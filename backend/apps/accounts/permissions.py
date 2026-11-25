from rest_framework import permissions
from .models import UserRole


class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to Admin users or superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsManagerRole(permissions.BasePermission):
    """Allows access to Admin and Store Manager users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_manager)


class IsWarehouseRole(permissions.BasePermission):
    """Allows access to Admin and Warehouse Staff users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_warehouse)


class IsStaffRole(permissions.BasePermission):
    """Allows access to any staff member (Admin, Store Manager, Warehouse Staff)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff_member)


class IsOwnerOrStaff(permissions.BasePermission):
    """Allows access to owner of object or staff members."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff_member:
            return True
        return hasattr(obj, 'user') and obj.user == request.user
