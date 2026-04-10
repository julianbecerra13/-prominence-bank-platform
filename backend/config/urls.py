from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/client/', include('apps.banking.urls_client')),
    path('api/v1/client/', include('apps.transfers.urls_client')),
    path('api/v1/client/', include('apps.instruments.urls_client')),
    path('api/v1/client/', include('apps.statements.urls')),
    path('api/v1/admin/', include('apps.customers.urls')),
    path('api/v1/admin/', include('apps.banking.urls_admin')),
    path('api/v1/admin/', include('apps.transfers.urls_admin')),
    path('api/v1/admin/', include('apps.instruments.urls_admin')),
    path('api/v1/admin/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
