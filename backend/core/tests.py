from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, UserRole
from apps.products.models import Product, Category, ProductVariant
from apps.inventory.models import Warehouse, StockItem, Supplier, PurchaseOrder, MovementType
from apps.orders.models import Cart, CartItem, Order, OrderStatus
from decimal import Decimal


class FullSystemTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='Password123!',
            role=UserRole.ADMIN
        )
        self.manager = User.objects.create_user(
            username='mgr_test',
            email='mgr@test.com',
            password='Password123!',
            role=UserRole.STORE_MANAGER
        )
        self.customer = User.objects.create_user(
            username='cust_test',
            email='cust@test.com',
            password='Password123!',
            role=UserRole.CUSTOMER
        )

        # Category and Product
        self.cat = Category.objects.create(name='Audio', slug='audio')
        self.product = Product.objects.create(
            name='Test Headphones',
            sku='TEST-HP-01',
            category=self.cat,
            base_price=Decimal('199.99'),
            cost_price=Decimal('100.00'),
            description='Test audio headphones'
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            name='Black',
            sku='TEST-HP-01-BLK',
            additional_price=Decimal('0.00'),
            stock_quantity=20
        )

        # Warehouse & Stock
        self.warehouse = Warehouse.objects.create(name='Main Hub', code='TEST-W1', location='Test City', is_primary=True)
        self.stock_item = StockItem.objects.create(
            product=self.product,
            variant=self.variant,
            warehouse=self.warehouse,
            quantity_on_hand=20,
            min_stock_threshold=5
        )

    def test_auth_jwt_login(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['role'], UserRole.ADMIN)

    def test_product_catalog_and_filter(self):
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results']), 1)

        # Filter by category
        res_cat = self.client.get('/api/products/?category=audio')
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data['results']), 1)

    def test_cart_and_checkout_flow(self):
        self.client.force_authenticate(user=self.customer)

        # 1. Add to cart
        res_add = self.client.post('/api/cart/items/', {
            'product_id': self.product.id,
            'variant_id': self.variant.id,
            'quantity': 2
        })
        self.assertEqual(res_add.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_add.data['item_count'], 2)

        # 2. Checkout
        res_checkout = self.client.post('/api/checkout/', {
            'customer_name': 'Test Customer',
            'customer_email': 'cust@test.com',
            'customer_phone': '1234567890',
            'address_line1': '123 Test St',
            'city': 'San Francisco',
            'state': 'CA',
            'postal_code': '94103',
            'country': 'United States'
        })
        self.assertEqual(res_checkout.status_code, status.HTTP_201_CREATED)
        order_num = res_checkout.data['order_number']
        self.assertTrue(order_num.startswith('CP-'))

        # Check stock deduction
        self.stock_item.refresh_from_db()
        self.assertEqual(self.stock_item.quantity_on_hand, 18)

        # 3. Track order
        res_track = self.client.get(f'/api/orders/track/{order_num}/')
        self.assertEqual(res_track.status_code, status.HTTP_200_OK)
        self.assertEqual(res_track.data['status'], OrderStatus.CONFIRMED)

    def test_inventory_stock_adjustment(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/stock/{self.stock_item.id}/adjust_stock/', {
            'quantity_change': -5,
            'movement_type': MovementType.ADJUSTMENT_DAMAGE,
            'reference_number': 'AUDIT-TEST-001',
            'notes': 'Damaged during transit'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.stock_item.refresh_from_db()
        self.assertEqual(self.stock_item.quantity_on_hand, 15)

    def test_ai_description_generation(self):
        self.client.force_authenticate(user=self.manager)
        res = self.client.post('/api/ai/generate-description/', {
            'title': 'Solar Wireless Earbuds',
            'category': 'Audio',
            'features': ['Solar charging case', 'Active noise reduction', 'IPX8']
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('tagline', res.data)
        self.assertIn('description', res.data)
        self.assertIn('bullet_points', res.data)

    def test_ai_support_chat(self):
        res = self.client.post('/api/ai/chat/', {
            'message': 'Do you offer free shipping or returns?'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('reply', res.data)
        self.assertIn('shipping', res.data['reply'].lower())

    def test_ai_inventory_summary(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get('/api/ai/inventory-summary/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', res.data)
        self.assertIn('critical_low_stock', res.data)
