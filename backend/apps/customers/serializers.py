from rest_framework import serializers
from .models import Customer
from apps.accounts.serializers import UserSerializer, UserCreateSerializer


class CustomerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['customer_number', 'kyc_approved_by', 'kyc_approved_at']


class CustomerCreateSerializer(serializers.Serializer):
    # User fields
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True, min_length=10)

    # Customer fields
    customer_type = serializers.ChoiceField(choices=Customer.CUSTOMER_TYPE_CHOICES)
    phone = serializers.CharField(required=False, allow_blank=True)
    address_line1 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False)

    # Business fields
    legal_name = serializers.CharField(required=False, allow_blank=True)
    registration_number = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        from apps.accounts.models import User

        user_data = {
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
            'role': 'client',
        }
        user = User.objects.create_user(**user_data)

        customer = Customer.objects.create(
            user=user,
            customer_number=Customer.generate_customer_number(),
            **validated_data,
        )
        return customer
