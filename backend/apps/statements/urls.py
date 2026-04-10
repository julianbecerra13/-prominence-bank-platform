from django.urls import path
from . import views

urlpatterns = [
    path('accounts/<int:account_id>/statement/', views.StatementDownloadView.as_view(), name='statement-download'),
]
