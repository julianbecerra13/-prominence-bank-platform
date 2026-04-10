from rest_framework import serializers
from .models import InstrumentType, Instrument


class InstrumentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstrumentType
        fields = '__all__'


class InstrumentSerializer(serializers.ModelSerializer):
    instrument_type_name = serializers.CharField(source='instrument_type.name', read_only=True)
    instrument_type_code = serializers.CharField(source='instrument_type.code', read_only=True)
    customer_name = serializers.CharField(source='customer.user.full_name', read_only=True)

    class Meta:
        model = Instrument
        fields = '__all__'
        read_only_fields = ['reference_number', 'issued_by']


class InstrumentCreateSerializer(serializers.Serializer):
    instrument_type_id = serializers.IntegerField()
    customer_id = serializers.IntegerField()
    face_value = serializers.DecimalField(max_digits=19, decimal_places=4)
    currency = serializers.CharField(default='USD')
    issue_date = serializers.DateField(required=False)
    maturity_date = serializers.DateField(required=False)
    receiving_bank = serializers.CharField(required=False, allow_blank=True)
    bank_swift_code = serializers.CharField(required=False, allow_blank=True)
    beneficiary_name = serializers.CharField(required=False, allow_blank=True)
    beneficiary_address = serializers.CharField(required=False, allow_blank=True)
    terms = serializers.JSONField(required=False, default=dict)
    notes = serializers.CharField(required=False, allow_blank=True)
