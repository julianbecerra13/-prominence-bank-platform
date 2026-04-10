from rest_framework.permissions import BasePermission


class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'admin_viewer', 'admin_operator', 'admin_manager', 'superadmin'
        )


class IsAdminOperator(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'admin_operator', 'admin_manager', 'superadmin'
        )


class IsAdminManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'admin_manager', 'superadmin'
        )


class IsAdminViewer(BasePermission):
    """Read-only auditor role."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ('admin_manager', 'superadmin', 'admin_operator'):
            return True
        if request.user.role == 'admin_viewer' and request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return False
