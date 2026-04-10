from decimal import Decimal

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seeds the database with demo data for Prominence Bank'

    def add_arguments(self, parser):
        parser.add_argument('--no-input', action='store_true')

    def handle(self, *args, **options):
        from apps.accounts.models import User
        from apps.customers.models import Customer
        from apps.banking.models import BankAccount, FundingInstruction
        from apps.banking.services import BankingService
        from apps.instruments.models import InstrumentType, Instrument
        from apps.transfers.models import Beneficiary

        if User.objects.filter(email='admin@prominencebank.com').exists():
            self.stdout.write(self.style.WARNING('Demo data already exists. Skipping.'))
            return

        self.stdout.write('Creating demo data for Prominence Bank...')

        # Create admin users
        admin1 = User.objects.create_superuser(
            email='admin@prominencebank.com',
            password='Admin2026!Secure',
            first_name='Sarah',
            last_name='Mitchell',
        )
        admin2 = User.objects.create_user(
            email='operator@prominencebank.com',
            password='Operator2026!Secure',
            first_name='James',
            last_name='Rodriguez',
            role='admin_operator',
            is_staff=True,
        )
        admin3 = User.objects.create_user(
            email='viewer@prominencebank.com',
            password='Viewer2026!Secure',
            first_name='Emily',
            last_name='Chen',
            role='admin_viewer',
            is_staff=True,
        )

        # Create client users and customers
        client1_user = User.objects.create_user(
            email='john.doe@email.com',
            password='Client2026!Secure',
            first_name='John',
            last_name='Doe',
            role='client',
        )
        customer1 = Customer.objects.create(
            user=client1_user,
            customer_number='PB-C-10000001',
            customer_type='personal',
            phone='+1 (555) 123-4567',
            address_line1='123 Wall Street',
            city='New York',
            state='NY',
            postal_code='10005',
            country='United States',
            kyc_status='approved',
            kyc_approved_by=admin1,
            risk_rating='low',
        )

        client2_user = User.objects.create_user(
            email='maria.santos@globalcorp.com',
            password='Client2026!Secure',
            first_name='Maria',
            last_name='Santos',
            role='client',
        )
        customer2 = Customer.objects.create(
            user=client2_user,
            customer_number='PB-C-10000002',
            customer_type='business',
            legal_name='Global Trading Corp.',
            registration_number='GTC-2024-001',
            phone='+1 (555) 987-6543',
            address_line1='456 Commerce Ave, Suite 800',
            city='Miami',
            state='FL',
            postal_code='33131',
            country='United States',
            kyc_status='approved',
            kyc_approved_by=admin1,
            risk_rating='medium',
        )

        client3_user = User.objects.create_user(
            email='pending.client@email.com',
            password='Client2026!Secure',
            first_name='Robert',
            last_name='Williams',
            role='client',
        )
        customer3 = Customer.objects.create(
            user=client3_user,
            customer_number='PB-C-10000003',
            customer_type='personal',
            phone='+1 (555) 555-0100',
            city='Los Angeles',
            country='United States',
            kyc_status='pending',
            risk_rating='low',
        )

        # Create bank accounts
        # Operating account (internal)
        operating = BankAccount.objects.create(
            customer=customer1,
            account_number='PB-OPS-00000001',
            account_type='business_checking',
            account_name='Prominence Bank Operating Account',
            status='active',
            available_balance=Decimal('10000000.0000'),
            ledger_balance=Decimal('10000000.0000'),
        )

        # Customer 1 accounts
        acct1_chk = BankAccount.objects.create(
            customer=customer1,
            account_number='PB-CHK-10000001',
            account_type='personal_checking',
            account_name='Primary Checking',
            opened_by=admin1,
        )
        acct1_sav = BankAccount.objects.create(
            customer=customer1,
            account_number='PB-SAV-10000001',
            account_type='savings',
            account_name='High-Yield Savings',
            opened_by=admin1,
        )
        acct1_cry = BankAccount.objects.create(
            customer=customer1,
            account_number='PB-CRY-10000001',
            account_type='crypto',
            currency='BTC',
            account_name='Bitcoin Wallet',
            opened_by=admin1,
        )

        # Customer 2 accounts
        acct2_biz = BankAccount.objects.create(
            customer=customer2,
            account_number='PB-BIZ-10000001',
            account_type='business_checking',
            account_name='Global Trading Operations',
            opened_by=admin1,
        )
        acct2_cus = BankAccount.objects.create(
            customer=customer2,
            account_number='PB-CUS-10000001',
            account_type='custody',
            account_name='Asset Custody Account',
            opened_by=admin1,
        )

        # Seed transactions
        BankingService.deposit(acct1_chk, Decimal('250000.00'), 'Initial deposit - Wire from Chase Bank', admin1)
        BankingService.deposit(acct1_chk, Decimal('15000.00'), 'Salary deposit - March 2026', admin1)
        BankingService.deposit(acct1_sav, Decimal('500000.00'), 'Savings transfer', admin1)
        BankingService.deposit(acct2_biz, Decimal('1500000.00'), 'Capital contribution - Q1 2026', admin1)
        BankingService.deposit(acct2_biz, Decimal('75000.00'), 'Invoice payment - Client Alpha', admin1)

        # Place a hold
        BankingService.place_hold(acct2_biz, Decimal('50000.00'), 'AML review - large incoming wire', admin1)

        # Internal transfer
        BankingService.internal_transfer(
            acct1_chk, acct1_sav, Decimal('25000.00'),
            'Monthly savings transfer', client1_user
        )

        # Beneficiaries
        ben1 = Beneficiary.objects.create(
            customer=customer1,
            nickname='My Chase Account',
            bank_name='JPMorgan Chase',
            routing_number='021000021',
            account_number='****4567',
            beneficiary_name='John Doe',
            beneficiary_address='123 Wall Street, New York, NY',
        )
        ben2 = Beneficiary.objects.create(
            customer=customer2,
            nickname='Supplier - Shanghai Co.',
            bank_name='Bank of China',
            swift_code='BKCHCNBJ',
            account_number='****8901',
            beneficiary_name='Shanghai Manufacturing Co. Ltd',
            beneficiary_address='100 Nanjing Road, Shanghai, China',
        )

        # Pending transfer request
        from apps.transfers.models import TransferRequest
        TransferRequest.objects.create(
            customer=customer2,
            source_account=acct2_biz,
            beneficiary=ben2,
            amount=Decimal('125000.00'),
            currency='USD',
            purpose='Payment for Q1 raw materials shipment',
            reference='INV-2026-0341',
            submitted_by=client2_user,
            status='pending_review',
        )

        # Instrument types
        instrument_types = [
            ('CD', 'Certificate of Deposit', 500),
            ('SBLC', 'Standby Letter of Credit', 2500),
            ('BG', 'Bank Guarantee', 2000),
            ('SKR', 'Safe Keeping Receipt', 1000),
            ('BCC', 'Bank Certified Check', 250),
            ('POF', 'Proof of Funds', 500),
            ('KTT', 'Key Tested Telex', 1500),
            ('BD', 'Bank Draft', 200),
            ('BF', 'Block Funds', 750),
        ]
        for code, name, fee in instrument_types:
            InstrumentType.objects.create(
                code=code, name=name, fee_amount=Decimal(str(fee)),
                description=f'{name} issued by Prominence Bank',
                is_active=True,
            )

        # Sample instruments
        cd_type = InstrumentType.objects.get(code='CD')
        Instrument.objects.create(
            instrument_type=cd_type,
            customer=customer1,
            reference_number='PB-CD-100001',
            face_value=Decimal('100000.00'),
            issue_date='2026-01-15',
            maturity_date='2027-01-15',
            status='active',
            issued_by=admin1,
            terms={'interest_rate': '4.5%', 'term': '12 months'},
        )

        sblc_type = InstrumentType.objects.get(code='SBLC')
        Instrument.objects.create(
            instrument_type=sblc_type,
            customer=customer2,
            reference_number='PB-SBLC-100001',
            face_value=Decimal('500000.00'),
            issue_date='2026-03-01',
            maturity_date='2027-03-01',
            status='active',
            issued_by=admin1,
            receiving_bank='HSBC London',
            bank_swift_code='HSBCGB2L',
            beneficiary_name='European Metals GmbH',
            beneficiary_address='Bahnhofstrasse 10, Zurich, Switzerland',
        )

        # Funding instructions
        FundingInstruction.objects.create(
            account=acct1_chk,
            bank_name='Prominence Bank',
            routing_number='021000089',
            swift_code='PRMBUSNY',
            account_holder='John Doe',
            instructions_html='<p>Wire to: Prominence Bank, New York<br>ABA: 021000089<br>SWIFT: PRMBUSNY<br>Account: PB-CHK-10000001<br>Beneficiary: John Doe</p>',
        )
        FundingInstruction.objects.create(
            account=acct2_biz,
            bank_name='Prominence Bank',
            routing_number='021000089',
            swift_code='PRMBUSNY',
            account_holder='Global Trading Corp.',
            instructions_html='<p>Wire to: Prominence Bank, New York<br>ABA: 021000089<br>SWIFT: PRMBUSNY<br>Account: PB-BIZ-10000001<br>Beneficiary: Global Trading Corp.</p>',
        )

        self.stdout.write(self.style.SUCCESS(
            '\nDemo data created successfully!\n'
            '\nLogin credentials:\n'
            '  Admin Manager: admin@prominencebank.com / Admin2026!Secure\n'
            '  Admin Operator: operator@prominencebank.com / Operator2026!Secure\n'
            '  Admin Viewer: viewer@prominencebank.com / Viewer2026!Secure\n'
            '  Client (John Doe): john.doe@email.com / Client2026!Secure\n'
            '  Client (Maria Santos): maria.santos@globalcorp.com / Client2026!Secure\n'
            '  Client (Pending KYC): pending.client@email.com / Client2026!Secure\n'
        ))
