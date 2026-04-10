from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsAdminOperator
from .models import TransferRequest
from .serializers import TransferRequestSerializer


class AdminTransferRequestViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransferRequest.objects.select_related(
        'customer__user', 'beneficiary', 'source_account', 'submitted_by', 'reviewed_by', 'approved_by'
    ).all()
    serializer_class = TransferRequestSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['status']
    search_fields = ['customer__user__email', 'beneficiary__beneficiary_name', 'reference']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOperator])
    def review(self, request, pk=None):
        """First reviewer marks transfer as under review."""
        transfer = self.get_object()
        if transfer.status != 'pending_review':
            return Response(
                {'error': f'Cannot review transfer in status: {transfer.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transfer.status = 'under_review'
        transfer.reviewed_by = request.user
        transfer.reviewed_at = timezone.now()
        transfer.save()
        return Response(TransferRequestSerializer(transfer).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOperator])
    def approve(self, request, pk=None):
        """Second approver (must be different from reviewer) approves the transfer."""
        transfer = self.get_object()
        if transfer.status != 'under_review':
            return Response(
                {'error': f'Cannot approve transfer in status: {transfer.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Maker-checker enforcement
        if transfer.reviewed_by == request.user:
            return Response(
                {'error': 'Approver must be different from reviewer (maker-checker policy)'},
                status=status.HTTP_403_FORBIDDEN
            )

        transfer.status = 'completed'
        transfer.approved_by = request.user
        transfer.completed_at = timezone.now()
        transfer.save()

        # Deduct from source account
        from apps.banking.services import BankingService
        BankingService.adjustment(
            account=transfer.source_account,
            amount=transfer.amount,
            description=f"Wire transfer to {transfer.beneficiary.beneficiary_name} - Ref: {transfer.reference}",
            posted_by=request.user,
            is_credit=False,
        )

        return Response(TransferRequestSerializer(transfer).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOperator])
    def reject(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status not in ('pending_review', 'under_review'):
            return Response(
                {'error': f'Cannot reject transfer in status: {transfer.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transfer.status = 'rejected'
        transfer.rejection_reason = request.data.get('reason', '')
        transfer.save()
        return Response(TransferRequestSerializer(transfer).data)
