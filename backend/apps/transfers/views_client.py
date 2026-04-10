from rest_framework import viewsets, status
from rest_framework.response import Response

from apps.core.permissions import IsClient
from apps.banking.models import BankAccount
from .models import Beneficiary, TransferRequest
from .serializers import BeneficiarySerializer, TransferRequestSerializer, TransferRequestCreateSerializer


class ClientBeneficiaryViewSet(viewsets.ModelViewSet):
    serializer_class = BeneficiarySerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        return Beneficiary.objects.filter(customer__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user.customer)


class ClientTransferRequestViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransferRequestSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        return TransferRequest.objects.filter(
            customer__user=self.request.user
        ).select_related('beneficiary', 'source_account', 'submitted_by')

    def create(self, request, *args, **kwargs):
        serializer = TransferRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = request.user.customer

        try:
            source_account = BankAccount.objects.get(id=data['source_account_id'], customer=customer)
        except BankAccount.DoesNotExist:
            return Response({'error': 'Source account not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            beneficiary = Beneficiary.objects.get(id=data['beneficiary_id'], customer=customer)
        except Beneficiary.DoesNotExist:
            return Response({'error': 'Beneficiary not found'}, status=status.HTTP_404_NOT_FOUND)

        if source_account.available_balance < data['amount']:
            return Response({'error': 'Insufficient funds'}, status=status.HTTP_400_BAD_REQUEST)

        transfer = TransferRequest.objects.create(
            customer=customer,
            source_account=source_account,
            beneficiary=beneficiary,
            amount=data['amount'],
            currency=data.get('currency', 'USD'),
            purpose=data.get('purpose', ''),
            reference=data.get('reference', ''),
            submitted_by=request.user,
            status='pending_review',
        )

        return Response(
            TransferRequestSerializer(transfer).data,
            status=status.HTTP_201_CREATED
        )
