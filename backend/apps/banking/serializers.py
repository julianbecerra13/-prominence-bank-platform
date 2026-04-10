from rest_framework import serializers
from .models import BankAccount, Transaction, LedgerEntry, Hold, FundingInstruction


class BankAccountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.full_name', read_only=True)
    customer_number = serializers.CharField(source='customer.customer_number', read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_number', 'account_type', 'currency', 'status',
            'account_name', 'available_balance', 'ledger_balance',
            'held_balance', 'in_transit_balance', 'customer_name',
            'customer_number', 'created_at',
        ]
        read_only_fields = ['account_number', 'available_balance', 'ledger_balance', 'held_balance', 'in_transit_balance']


class BankAccountCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField()
    account_type = serializers.ChoiceField(choices=BankAccount.ACCOUNT_TYPE_CHOICES)
    currency = serializers.ChoiceField(choices=BankAccount.CURRENCY_CHOICES, default='USD')
    account_name = serializers.CharField(required=False, allow_blank=True)


class TransactionSerializer(serializers.ModelSerializer):
    debit_account_number = serializers.CharField(source='debit_account.account_number', read_only=True, default=None)
    credit_account_number = serializers.CharField(source='credit_account.account_number', read_only=True, default=None)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'transaction_type', 'description', 'amount',
            'currency', 'status', 'debit_account_number', 'credit_account_number',
            'created_by_name', 'created_at', 'posted_at',
        ]


class LedgerEntrySerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)

    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'transaction', 'account_number', 'entry_type', 'amount',
            'balance_type', 'running_balance', 'created_at',
        ]


class HoldSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)
    placed_by_name = serializers.CharField(source='placed_by.full_name', read_only=True)

    class Meta:
        model = Hold
        fields = [
            'id', 'account_number', 'amount', 'reason', 'status',
            'placed_by_name', 'created_at', 'released_at', 'expires_at',
        ]


class DepositSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=19, decimal_places=4, min_value=0.01)
    description = serializers.CharField(required=False, allow_blank=True)


class PlaceHoldSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=19, decimal_places=4, min_value=0.01)
    reason = serializers.CharField()


class AdjustmentSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=19, decimal_places=4, min_value=0.01)
    description = serializers.CharField()
    is_credit = serializers.BooleanField(default=True)


class FundingInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundingInstruction
        fields = '__all__'
