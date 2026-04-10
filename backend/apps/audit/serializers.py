from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default=None)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'user', 'user_email', 'user_name',
            'action', 'resource_type', 'resource_id', 'ip_address',
            'description', 'changes',
        ]

    def get_user_name(self, obj):
        return obj.user.full_name if obj.user else 'System'
