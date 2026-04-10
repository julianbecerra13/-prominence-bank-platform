from django.conf import settings
from django.db import models
from apps.core.models import TimestampedModel


class Customer(TimestampedModel):
    CUSTOMER_TYPE_CHOICES = [
        ('personal', 'Personal'),
        ('business', 'Business'),
    ]

    KYC_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    RISK_RATING_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer')
    customer_type = models.CharField(max_length=10, choices=CUSTOMER_TYPE_CHOICES, default='personal')
    customer_number = models.CharField(max_length=20, unique=True)

    # Personal fields
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)

    # Business fields
    legal_name = models.CharField(max_length=255, blank=True)
    dba_name = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)

    # KYC
    kyc_status = models.CharField(max_length=15, choices=KYC_STATUS_CHOICES, default='pending')
    kyc_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='kyc_approvals'
    )
    kyc_approved_at = models.DateTimeField(null=True, blank=True)
    kyc_notes = models.TextField(blank=True)

    # Risk
    risk_rating = models.CharField(max_length=10, choices=RISK_RATING_CHOICES, default='low')

    class Meta:
        db_table = 'customers'

    def __str__(self):
        return f"{self.customer_number} - {self.user.full_name}"

    @staticmethod
    def generate_customer_number():
        import random
        return f"PB-C-{random.randint(10000000, 99999999)}"
