from django.conf import settings
from django.db import models
from apps.core.models import TimestampedModel


class Beneficiary(TimestampedModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='beneficiaries')
    nickname = models.CharField(max_length=100)
    bank_name = models.CharField(max_length=255)
    bank_address = models.CharField(max_length=500, blank=True)
    routing_number = models.CharField(max_length=50, blank=True)
    account_number = models.CharField(max_length=50)
    swift_code = models.CharField(max_length=20, blank=True)
    beneficiary_name = models.CharField(max_length=255)
    beneficiary_address = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    class Meta:
        db_table = 'beneficiaries'
        verbose_name_plural = 'beneficiaries'

    def __str__(self):
        return f"{self.nickname} - {self.beneficiary_name}"


class TransferRequest(TimestampedModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_review', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='transfer_requests')
    source_account = models.ForeignKey('banking.BankAccount', on_delete=models.PROTECT, related_name='transfer_requests')
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.PROTECT, related_name='transfer_requests')
    amount = models.DecimalField(max_digits=19, decimal_places=4)
    currency = models.CharField(max_length=5, default='USD')
    purpose = models.CharField(max_length=500, blank=True)
    reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')

    # Maker-checker
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='submitted_transfers'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='reviewed_transfers'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='final_approved_transfers'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'transfer_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Wire {self.amount} {self.currency} -> {self.beneficiary.nickname} [{self.status}]"
