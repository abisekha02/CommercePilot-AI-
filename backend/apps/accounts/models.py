from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrator'
    STORE_MANAGER = 'STORE_MANAGER', 'Store Manager'
    WAREHOUSE_STAFF = 'WAREHOUSE_STAFF', 'Warehouse Staff'
    CUSTOMER = 'CUSTOMER', 'Customer'


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER,
        db_index=True,
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=150, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, default='United States')
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    @property
    def is_manager(self):
        return self.role in [UserRole.ADMIN, UserRole.STORE_MANAGER] or self.is_superuser

    @property
    def is_warehouse(self):
        return self.role in [UserRole.ADMIN, UserRole.WAREHOUSE_STAFF] or self.is_superuser

    @property
    def is_staff_member(self):
        return self.role in [UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.WAREHOUSE_STAFF] or self.is_staff or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
