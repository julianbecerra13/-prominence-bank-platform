from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.banking.models import Transaction
from apps.customers.models import Customer
from apps.transfers.models import TransferRequest
from apps.instruments.models import Instrument
from .models import AuditLog
from .middleware import get_current_request


def _get_user_and_ip():
    request = get_current_request()
    user = None
    ip = None
    if request:
        user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
    return user, ip


@receiver(post_save, sender=Transaction)
def log_transaction(sender, instance, created, **kwargs):
    if created:
        user, ip = _get_user_and_ip()
        action_map = {
            'deposit': 'deposit',
            'withdrawal': 'withdrawal',
            'transfer_internal': 'transfer',
            'transfer_external': 'transfer',
            'hold_place': 'hold_placed',
            'hold_release': 'hold_released',
        }
        AuditLog.objects.create(
            user=user,
            action=action_map.get(instance.transaction_type, 'create'),
            resource_type='Transaction',
            resource_id=str(instance.reference),
            ip_address=ip,
            description=f"{instance.get_transaction_type_display()}: {instance.amount} {instance.currency} - {instance.description}",
            changes={
                'type': instance.transaction_type,
                'amount': str(instance.amount),
                'status': instance.status,
            }
        )


@receiver(post_save, sender=Customer)
def log_customer(sender, instance, created, **kwargs):
    user, ip = _get_user_and_ip()
    AuditLog.objects.create(
        user=user,
        action='create' if created else 'update',
        resource_type='Customer',
        resource_id=str(instance.id),
        ip_address=ip,
        description=f"Customer {'created' if created else 'updated'}: {instance.customer_number}",
    )


@receiver(post_save, sender=Instrument)
def log_instrument(sender, instance, created, **kwargs):
    if created:
        user, ip = _get_user_and_ip()
        AuditLog.objects.create(
            user=user,
            action='instrument_issued',
            resource_type='Instrument',
            resource_id=str(instance.id),
            ip_address=ip,
            description=f"Instrument {instance.instrument_type.code} issued: {instance.reference_number}",
        )
