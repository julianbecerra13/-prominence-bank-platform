from rest_framework import viewsets, status
from rest_framework.response import Response

from apps.core.permissions import IsAdmin, IsAdminOperator
from apps.customers.models import Customer
from .models import InstrumentType, Instrument
from .serializers import InstrumentTypeSerializer, InstrumentSerializer, InstrumentCreateSerializer


class InstrumentTypeViewSet(viewsets.ModelViewSet):
    queryset = InstrumentType.objects.all()
    serializer_class = InstrumentTypeSerializer
    permission_classes = [IsAdmin]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOperator()]
        return [IsAdmin()]


class AdminInstrumentViewSet(viewsets.ModelViewSet):
    queryset = Instrument.objects.select_related('instrument_type', 'customer__user').all()
    serializer_class = InstrumentSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['status', 'instrument_type__code']
    search_fields = ['reference_number', 'customer__user__email', 'beneficiary_name']

    def create(self, request, *args, **kwargs):
        self.permission_classes = [IsAdminOperator]
        self.check_permissions(request)

        serializer = InstrumentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            instrument_type = InstrumentType.objects.get(id=data.pop('instrument_type_id'))
        except InstrumentType.DoesNotExist:
            return Response({'error': 'Instrument type not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            customer = Customer.objects.get(id=data.pop('customer_id'))
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)

        instrument = Instrument.objects.create(
            instrument_type=instrument_type,
            customer=customer,
            reference_number=Instrument.generate_reference(instrument_type.code),
            issued_by=request.user,
            status='issued',
            **data,
        )
        return Response(InstrumentSerializer(instrument).data, status=status.HTTP_201_CREATED)
