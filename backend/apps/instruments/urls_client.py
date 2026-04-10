from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_client

router = DefaultRouter()
router.register('instruments', views_client.ClientInstrumentViewSet, basename='client-instruments')
router.register('instrument-types', views_client.ClientInstrumentTypeViewSet, basename='client-instrument-types')

urlpatterns = [
    path('', include(router.urls)),
]
