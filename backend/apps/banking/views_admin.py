from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsAdmin, IsAdminOperator
from .models import BankAccount, Transaction, Hold
from .serializers import (
    BankAccountSerializer, BankAccountCreateSerializer,
    TransactionSerializer, HoldSerializer,
    DepositSerializer, PlaceHoldSerializer, AdjustmentSerializer,
)
from .services import BankingService, InsufficientFundsError, AccountNotActiveError


class AdminAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.select_related('customer__user').all()
    serializer_class = BankAccountSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['account_type', 'status', 'currency']
    search_fields = ['account_number', 'customer__user__email', 'customer__customer_number']

    def create(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminOperator]
        self.check_permissions(request)

        serializer = BankAccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.customers.models import Customer
        try:
            customer = Customer.objects.get(id=serializer.validated_data['customer_id'])
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

        account = BankAccount.objects.create(
            customer=customer,
            account_number=BankAccount.generate_account_number(serializer.validated_data['account_type']),
            account_type=serializer.validated_data['account_type'],
            currency=serializer.validated_data.get('currency', 'USD'),
            account_name=serializer.validated_data.get('account_name', ''),
            opened_by=request.user,
        )
        return Response(BankAccountSerializer(account).data, status=status.HTTP_201_CREATED)


class AdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.select_related('debit_account', 'credit_account', 'created_by').all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['transaction_type', 'status']
    search_fields = ['reference', 'description']


class DepositView(APIView):
    permission_classes = [IsAdminOperator]

    def post(self, request):
        serializer = DepositSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = BankAccount.objects.get(id=serializer.validated_data['account_id'])
        except BankAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            txn = BankingService.deposit(
                account=account,
                amount=serializer.validated_data['amount'],
                description=serializer.validated_data.get('description', ''),
                posted_by=request.user,
            )
        except AccountNotActiveError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'transaction': TransactionSerializer(txn).data,
            'account': BankAccountSerializer(account).data,
        }, status=status.HTTP_201_CREATED)


class PlaceHoldView(APIView):
    permission_classes = [IsAdminOperator]

    def post(self, request):
        serializer = PlaceHoldSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = BankAccount.objects.get(id=serializer.validated_data['account_id'])
        except BankAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            txn, hold = BankingService.place_hold(
                account=account,
                amount=serializer.validated_data['amount'],
                reason=serializer.validated_data['reason'],
                placed_by=request.user,
            )
        except (InsufficientFundsError, AccountNotActiveError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'transaction': TransactionSerializer(txn).data,
            'hold': HoldSerializer(hold).data,
            'account': BankAccountSerializer(account).data,
        }, status=status.HTTP_201_CREATED)


class ReleaseHoldView(APIView):
    permission_classes = [IsAdminOperator]

    def post(self, request, hold_id):
        try:
            hold = Hold.objects.get(id=hold_id, status='active')
        except Hold.DoesNotExist:
            return Response({'error': 'Active hold not found'}, status=status.HTTP_404_NOT_FOUND)

        txn = BankingService.release_hold(hold=hold, released_by=request.user)
        account = hold.account
        account.refresh_from_db()

        return Response({
            'transaction': TransactionSerializer(txn).data,
            'hold': HoldSerializer(hold).data,
            'account': BankAccountSerializer(account).data,
        })


class AdjustmentView(APIView):
    permission_classes = [IsAdminOperator]

    def post(self, request):
        serializer = AdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            account = BankAccount.objects.get(id=serializer.validated_data['account_id'])
        except BankAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            txn = BankingService.adjustment(
                account=account,
                amount=serializer.validated_data['amount'],
                description=serializer.validated_data['description'],
                posted_by=request.user,
                is_credit=serializer.validated_data.get('is_credit', True),
            )
        except AccountNotActiveError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        account.refresh_from_db()
        return Response({
            'transaction': TransactionSerializer(txn).data,
            'account': BankAccountSerializer(account).data,
        }, status=status.HTTP_201_CREATED)


class AdminHoldViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hold.objects.select_related('account', 'placed_by').all()
    serializer_class = HoldSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['status']
