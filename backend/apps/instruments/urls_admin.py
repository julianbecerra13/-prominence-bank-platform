from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_admin

router = DefaultRouter()
router.register('instrument-types', views_admin.InstrumentTypeViewSet)
router.register('instruments', views_admin.AdminInstrumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
