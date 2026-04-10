from rest_framework import viewsets
from apps.core.permissions import IsClient
from .models import Instrument, InstrumentType
from .serializers import InstrumentSerializer, InstrumentTypeSerializer


class ClientInstrumentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InstrumentSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        return Instrument.objects.filter(
            customer__user=self.request.user
        ).select_related('instrument_type')


class ClientInstrumentTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InstrumentType.objects.filter(is_active=True)
    serializer_class = InstrumentTypeSerializer
    permission_classes = [IsClient]
