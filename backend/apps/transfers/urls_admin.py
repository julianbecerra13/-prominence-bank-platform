from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_admin

router = DefaultRouter()
router.register('transfers', views_admin.AdminTransferRequestViewSet, basename='admin-transfers')

urlpatterns = [
    path('', include(router.urls)),
]
