from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_client

router = DefaultRouter()
router.register('accounts', views_client.ClientAccountViewSet, basename='client-accounts')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views_client.ClientDashboardView.as_view(), name='client-dashboard'),
    path('transfers/internal/', views_client.ClientTransferView.as_view(), name='client-internal-transfer'),
]
