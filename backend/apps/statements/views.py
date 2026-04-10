from datetime import date, timedelta

from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsClient
from apps.banking.models import BankAccount
from .services import StatementGenerator


class StatementDownloadView(APIView):
    permission_classes = [IsClient]

    def get(self, request, account_id):
        try:
            account = BankAccount.objects.get(
                id=account_id,
                customer__user=request.user,
            )
        except BankAccount.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        try:
            if start_date_str:
                start_date = date.fromisoformat(start_date_str)
            else:
                start_date = date.today() - timedelta(days=30)
            if end_date_str:
                end_date = date.fromisoformat(end_date_str)
            else:
                end_date = date.today()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)

        pdf_buffer = StatementGenerator.generate(account, start_date, end_date)

        filename = f"statement_{account.account_number}_{start_date}_{end_date}.pdf"
        response = FileResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
