from rest_framework import serializers
from .models import Beneficiary, TransferRequest


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        fields = '__all__'
        read_only_fields = ['customer']


class TransferRequestSerializer(serializers.ModelSerializer):
    beneficiary_name = serializers.CharField(source='beneficiary.beneficiary_name', read_only=True)
    source_account_number = serializers.CharField(source='source_account.account_number', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.full_name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TransferRequest
        fields = '__all__'
        read_only_fields = [
            'customer', 'submitted_by', 'reviewed_by', 'approved_by',
            'submitted_at', 'reviewed_at', 'completed_at',
        ]

    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.full_name if obj.reviewed_by else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.full_name if obj.approved_by else None


class TransferRequestCreateSerializer(serializers.Serializer):
    source_account_id = serializers.IntegerField()
    beneficiary_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=19, decimal_places=4, min_value=0.01)
    currency = serializers.CharField(default='USD')
    purpose = serializers.CharField(required=False, allow_blank=True)
    reference = serializers.CharField(required=False, allow_blank=True)
