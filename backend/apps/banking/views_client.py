from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsClient
from .models import BankAccount, Transaction, FundingInstruction
from .serializers import (
    BankAccountSerializer, TransactionSerializer, FundingInstructionSerializer,
)
from .services import BankingService, InsufficientFundsError


class ClientAccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BankAccountSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        return BankAccount.objects.filter(
            customer__user=self.request.user,
            status='active',
        ).exclude(account_number__startswith='PB-OPS')

    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        account = self.get_object()
        from django.db.models import Q
        transactions = Transaction.objects.filter(
            Q(debit_account=account) | Q(credit_account=account)
        ).order_by('-created_at')

        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = TransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(TransactionSerializer(transactions, many=True).data)

    @action(detail=True, methods=['get'], url_path='funding-instructions')
    def funding_instructions(self, request, pk=None):
        account = self.get_object()
        instructions = FundingInstruction.objects.filter(account=account, is_active=True)
        return Response(FundingInstructionSerializer(instructions, many=True).data)


class ClientDashboardView(APIView):
    permission_classes = [IsClient]

    def get(self, request):
        customer = request.user.customer
        accounts = BankAccount.objects.filter(
            customer=customer, status='active'
        ).exclude(account_number__startswith='PB-OPS')

        from django.db.models import Sum, Q
        from decimal import Decimal

        total_available = accounts.aggregate(
            total=Sum('available_balance'))['total'] or Decimal('0')
        total_held = accounts.aggregate(
            total=Sum('held_balance'))['total'] or Decimal('0')

        recent_transactions = Transaction.objects.filter(
            Q(debit_account__customer=customer) | Q(credit_account__customer=customer)
        ).order_by('-created_at')[:10]

        return Response({
            'accounts': BankAccountSerializer(accounts, many=True).data,
            'summary': {
                'total_available': str(total_available),
                'total_held': str(total_held),
                'total_accounts': accounts.count(),
            },
            'recent_transactions': TransactionSerializer(recent_transactions, many=True).data,
        })


class ClientTransferView(APIView):
    permission_classes = [IsClient]

    def post(self, request):
        from_account_id = request.data.get('from_account_id')
        to_account_id = request.data.get('to_account_id')
        amount = request.data.get('amount')
        description = request.data.get('description', '')

        customer = request.user.customer

        try:
            from_account = BankAccount.objects.get(id=from_account_id, customer=customer)
            to_account = BankAccount.objects.get(id=to_account_id, customer=customer)
        except BankAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            txn = BankingService.internal_transfer(
                from_account=from_account,
                to_account=to_account,
                amount=amount,
                description=description,
                initiated_by=request.user,
            )
        except InsufficientFundsError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)
