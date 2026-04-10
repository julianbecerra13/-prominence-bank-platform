from django.conf import settings
from django.db import models
from apps.core.models import TimestampedModel


class InstrumentType(TimestampedModel):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    fee_amount = models.DecimalField(max_digits=19, decimal_places=4, default=0)
    fee_currency = models.CharField(max_length=5, default='USD')
    template_fields = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'instrument_types'

    def __str__(self):
        return f"{self.code} - {self.name}"


class Instrument(TimestampedModel):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('issued', 'Issued'),
        ('active', 'Active'),
        ('matured', 'Matured'),
        ('cancelled', 'Cancelled'),
    ]

    instrument_type = models.ForeignKey(InstrumentType, on_delete=models.PROTECT, related_name='instruments')
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='instruments')
    reference_number = models.CharField(max_length=50, unique=True)
    face_value = models.DecimalField(max_digits=19, decimal_places=4)
    currency = models.CharField(max_length=5, default='USD')
    issue_date = models.DateField(null=True, blank=True)
    maturity_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='draft')
    terms = models.JSONField(default=dict, blank=True)

    # For SBLC, BG
    receiving_bank = models.CharField(max_length=255, blank=True)
    bank_swift_code = models.CharField(max_length=20, blank=True)
    beneficiary_name = models.CharField(max_length=255, blank=True)
    beneficiary_address = models.TextField(blank=True)

    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='issued_instruments'
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'instruments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.instrument_type.code} - {self.reference_number}"

    @staticmethod
    def generate_reference(type_code):
        import random
        return f"PB-{type_code}-{random.randint(100000, 999999)}"
