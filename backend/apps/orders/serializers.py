from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, ShippingAddress, OrderTimeline, OrderStatus, PaymentStatus, PaymentMethod
from apps.products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_image = serializers.CharField(source='product.primary_image', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_name', 'product_slug', 'product_image',
            'variant', 'variant_name', 'quantity', 'unit_price', 'line_total'
        ]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'item_count', 'updated_at']


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            'id', 'full_name', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country', 'phone'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'variant', 'product_name',
            'sku', 'unit_price', 'quantity', 'subtotal'
        ]


class OrderTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTimeline
        fields = ['id', 'status', 'title', 'description', 'created_at']


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = ShippingAddressSerializer(read_only=True)
    timeline = OrderTimelineSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'customer_name', 'customer_email', 'customer_phone',
            'status', 'status_display', 'payment_status', 'payment_status_display', 'payment_method',
            'subtotal', 'shipping_fee', 'tax_amount', 'discount_amount', 'total_amount',
            'tracking_number', 'shipping_carrier', 'estimated_delivery', 'notes',
            'items', 'shipping_address', 'timeline', 'created_at', 'updated_at'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email',
            'status', 'status_display', 'payment_status', 'payment_status_display',
            'total_amount', 'items_count', 'tracking_number', 'created_at'
        ]


class CheckoutSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=50, required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=PaymentMethod.choices, default=PaymentMethod.STRIPE_CARD)
    notes = serializers.CharField(required=False, allow_blank=True)

    # Shipping Address fields
    address_line1 = serializers.CharField(max_length=255)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=30)
    country = serializers.CharField(max_length=100, default='United States')

    # Optional Mock Payment Details
    card_number = serializers.CharField(required=False, allow_blank=True)
    exp_month = serializers.CharField(required=False, allow_blank=True)
    exp_year = serializers.CharField(required=False, allow_blank=True)
    cvc = serializers.CharField(required=False, allow_blank=True)
