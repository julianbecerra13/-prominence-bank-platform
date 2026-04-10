import random
import hashlib

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'superadmin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('admin_viewer', 'Admin Viewer'),
        ('admin_operator', 'Admin Operator'),
        ('admin_manager', 'Admin Manager'),
        ('superadmin', 'Super Admin'),
    ]

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_admin(self):
        return self.role in ('admin_viewer', 'admin_operator', 'admin_manager', 'superadmin')

    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False


class OTPToken(models.Model):
    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('transfer', 'Transfer'),
        ('beneficiary', 'Add Beneficiary'),
        ('withdrawal', 'Withdrawal'),
        ('instrument', 'Instrument Request'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='otp_tokens')
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'otp_tokens'

    @staticmethod
    def hash_code(code):
        return hashlib.sha256(code.encode()).hexdigest()

    @classmethod
    def generate(cls, user, purpose='login'):
        code = f"{random.randint(0, 999999):06d}"
        expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        token = cls.objects.create(
            user=user,
            code_hash=cls.hash_code(code),
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=expiry_minutes),
        )
        return token, code

    def verify(self, code):
        if self.is_used:
            return False
        if self.expires_at < timezone.now():
            return False
        max_attempts = getattr(settings, 'OTP_MAX_ATTEMPTS', 5)
        if self.attempts >= max_attempts:
            return False
        self.attempts += 1
        if self.code_hash == self.hash_code(code):
            self.is_used = True
            self.save()
            return True
        self.save()
        return False
