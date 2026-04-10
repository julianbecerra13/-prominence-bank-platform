from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_admin

router = DefaultRouter()
router.register('accounts', views_admin.AdminAccountViewSet)
router.register('transactions', views_admin.AdminTransactionViewSet)
router.register('holds', views_admin.AdminHoldViewSet)

urlpatterns = [
    path('deposits/', views_admin.DepositView.as_view(), name='admin-deposit'),
    path('hold-place/', views_admin.PlaceHoldView.as_view(), name='admin-place-hold'),
    path('hold-release/<int:hold_id>/', views_admin.ReleaseHoldView.as_view(), name='admin-release-hold'),
    path('adjustments/', views_admin.AdjustmentView.as_view(), name='admin-adjustment'),
    path('', include(router.urls)),
]
