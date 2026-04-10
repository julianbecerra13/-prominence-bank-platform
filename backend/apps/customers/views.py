from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsAdminOperator
from .models import Customer
from .serializers import CustomerSerializer, CustomerCreateSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related('user').all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['customer_type', 'kyc_status', 'risk_rating']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'customer_number']
    ordering_fields = ['created_at', 'customer_number']

    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        return CustomerSerializer

    def create(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminOperator]
        self.check_permissions(request)

        serializer = CustomerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(
            CustomerSerializer(customer).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOperator])
    def approve_kyc(self, request, pk=None):
        customer = self.get_object()
        customer.kyc_status = 'approved'
        customer.kyc_approved_by = request.user
        customer.kyc_approved_at = timezone.now()
        customer.kyc_notes = request.data.get('notes', '')
        customer.save()
        return Response(CustomerSerializer(customer).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOperator])
    def reject_kyc(self, request, pk=None):
        customer = self.get_object()
        customer.kyc_status = 'rejected'
        customer.kyc_notes = request.data.get('notes', '')
        customer.save()
        return Response(CustomerSerializer(customer).data)
