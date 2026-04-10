from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_client

router = DefaultRouter()
router.register('beneficiaries', views_client.ClientBeneficiaryViewSet, basename='client-beneficiaries')
router.register('transfers', views_client.ClientTransferRequestViewSet, basename='client-transfers')

urlpatterns = [
    path('', include(router.urls)),
]
