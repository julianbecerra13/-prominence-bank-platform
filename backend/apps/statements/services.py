import io
from datetime import date
from decimal import Decimal

from django.db.models import Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image


class StatementGenerator:
    BANK_NAME = "Prominence Bank"
    BANK_TAGLINE = "Smart Banking Solutions"
    PRIMARY_COLOR = colors.HexColor('#0A1F44')
    ACCENT_COLOR = colors.HexColor('#C5A55A')

    @classmethod
    def generate(cls, account, start_date, end_date):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
        styles = getSampleStyleSheet()
        elements = []

        # Header
        header_style = ParagraphStyle('BankHeader', parent=styles['Title'], textColor=cls.PRIMARY_COLOR, fontSize=20)
        elements.append(Paragraph(cls.BANK_NAME, header_style))
        elements.append(Paragraph(cls.BANK_TAGLINE, styles['Normal']))
        elements.append(Spacer(1, 0.3 * inch))

        # Account info
        info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=10)
        elements.append(Paragraph(f"<b>Account Statement</b>", styles['Heading2']))
        elements.append(Paragraph(f"Account: {account.account_number}", info_style))
        elements.append(Paragraph(f"Account Holder: {account.customer.user.full_name}", info_style))
        elements.append(Paragraph(f"Account Type: {account.get_account_type_display()}", info_style))
        elements.append(Paragraph(f"Currency: {account.currency}", info_style))
        elements.append(Paragraph(f"Period: {start_date.strftime('%B %d, %Y')} - {end_date.strftime('%B %d, %Y')}", info_style))
        elements.append(Spacer(1, 0.3 * inch))

        # Balance summary
        elements.append(Paragraph("<b>Balance Summary</b>", styles['Heading3']))
        balance_data = [
            ['Available Balance', f"${account.available_balance:,.2f}"],
            ['Held Balance', f"${account.held_balance:,.2f}"],
            ['In-Transit Balance', f"${account.in_transit_balance:,.2f}"],
            ['Ledger Balance', f"${account.ledger_balance:,.2f}"],
        ]
        balance_table = Table(balance_data, colWidths=[3 * inch, 2 * inch])
        balance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
            ('TEXTCOLOR', (0, 0), (-1, -1), cls.PRIMARY_COLOR),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
        ]))
        elements.append(balance_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Transactions
        from apps.banking.models import Transaction
        transactions = Transaction.objects.filter(
            Q(debit_account=account) | Q(credit_account=account),
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status='posted',
        ).order_by('created_at')

        elements.append(Paragraph("<b>Transaction History</b>", styles['Heading3']))

        if transactions.exists():
            tx_data = [['Date', 'Description', 'Type', 'Debit', 'Credit']]
            for tx in transactions:
                is_debit = tx.debit_account == account
                tx_data.append([
                    tx.created_at.strftime('%Y-%m-%d'),
                    tx.description[:40],
                    tx.get_transaction_type_display(),
                    f"${tx.amount:,.2f}" if is_debit else '',
                    f"${tx.amount:,.2f}" if not is_debit else '',
                ])

            tx_table = Table(tx_data, colWidths=[1.1 * inch, 2.5 * inch, 1.2 * inch, 1 * inch, 1 * inch])
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), cls.PRIMARY_COLOR),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('PADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
                ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
            ]))
            elements.append(tx_table)
        else:
            elements.append(Paragraph("No transactions found for this period.", info_style))

        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph(
            f"This statement was generated electronically by {cls.BANK_NAME}. "
            "For questions, contact helpdesk@prominencebank.com",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer
