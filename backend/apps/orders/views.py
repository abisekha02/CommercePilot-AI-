from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    Cart, CartItem, Order, OrderItem,
    ShippingAddress, OrderTimeline,
    OrderStatus, PaymentStatus, PaymentMethod
)
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderListSerializer, OrderDetailSerializer,
    CheckoutSerializer, OrderTimelineSerializer
)
from apps.products.models import Product, ProductVariant
from apps.inventory.models import StockItem, StockMovement, MovementType, Warehouse
from apps.accounts.permissions import IsStaffRole, IsManagerRole


def get_or_create_cart(request):
    user = request.user if request.user.is_authenticated else None
    session_id = request.headers.get('X-Session-ID') or request.session.session_key
    if not session_id and not user:
        if not request.session.exists(request.session.session_key):
            request.session.create()
        session_id = request.session.session_key

    if user:
        cart, _ = Cart.objects.get_or_create(user=user)
    else:
        cart, _ = Cart.objects.get_or_create(session_id=session_id)
    return cart


class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = get_or_create_cart(request)
        cart.items.all().delete()
        return Response({"message": "Cart cleared successfully"})


class CartItemView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(id=product_id, is_active=True).first()
        if not product:
            return Response({"error": "Product not found or inactive"}, status=status.HTTP_404_NOT_FOUND)

        variant = None
        if variant_id:
            variant = ProductVariant.objects.filter(id=variant_id, product=product).first()

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity'])

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    def patch(self, request, item_id):
        cart = get_or_create_cart(request)
        item = cart.items.filter(id=item_id).first()
        if not item:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save(update_fields=['quantity'])

        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        cart = get_or_create_cart(request)
        cart.items.filter(id=item_id).delete()
        return Response(CartSerializer(cart).data)


class CheckoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_cart(request)
        if not cart.items.exists():
            return Response({"error": "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = request.user if request.user.is_authenticated else None
        warehouse = Warehouse.objects.filter(is_primary=True).first() or Warehouse.objects.first()

        with transaction.atomic():
            # Calculate totals
            subtotal = Decimal('0.00')
            for item in cart.items.select_related('product', 'variant').all():
                subtotal += item.line_total

            tax = subtotal * Decimal('0.08')  # 8% standard tax
            shipping = Decimal('0.00') if subtotal > Decimal('50.00') else Decimal('9.99')
            total = subtotal + tax + shipping

            # Create Order
            order = Order.objects.create(
                user=user,
                customer_name=data['customer_name'],
                customer_email=data['customer_email'],
                customer_phone=data.get('customer_phone', ''),
                status=OrderStatus.CONFIRMED,
                payment_status=PaymentStatus.PAID,  # Simulated instant approval
                payment_method=data.get('payment_method', PaymentMethod.STRIPE_CARD),
                subtotal=subtotal,
                tax_amount=tax,
                shipping_fee=shipping,
                total_amount=total,
                notes=data.get('notes', ''),
                estimated_delivery=timezone.now().date() + timedelta(days=4)
            )

            # Create ShippingAddress
            ShippingAddress.objects.create(
                order=order,
                full_name=data['customer_name'],
                address_line1=data['address_line1'],
                address_line2=data.get('address_line2', ''),
                city=data['city'],
                state=data['state'],
                postal_code=data['postal_code'],
                country=data.get('country', 'United States'),
                phone=data.get('customer_phone', '')
            )

            # Create OrderItems and deduct inventory
            for item in cart.items.all():
                p_name = item.product.name
                if item.variant:
                    p_name += f" - {item.variant.name}"
                sku = item.variant.sku if item.variant else item.product.sku

                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    variant=item.variant,
                    product_name=p_name,
                    sku=sku,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    subtotal=item.line_total
                )

                # Deduct inventory stock if stock item exists
                if warehouse:
                    stock_item = StockItem.objects.filter(
                        product=item.product,
                        variant=item.variant,
                        warehouse=warehouse
                    ).first()

                    if stock_item:
                        prev = stock_item.quantity_on_hand
                        stock_item.quantity_on_hand = max(0, prev - item.quantity)
                        stock_item.save(update_fields=['quantity_on_hand', 'updated_at'])

                        # Sync variant quantity
                        if item.variant:
                            item.variant.stock_quantity = stock_item.quantity_on_hand
                            item.variant.save(update_fields=['stock_quantity'])

                        StockMovement.objects.create(
                            stock_item=stock_item,
                            movement_type=MovementType.OUTBOUND_SALE,
                            quantity_change=-item.quantity,
                            previous_quantity=prev,
                            new_quantity=stock_item.quantity_on_hand,
                            reference_number=order.order_number,
                            notes=f"Order #{order.order_number} checkout"
                        )

            # Add initial OrderTimeline
            OrderTimeline.objects.create(
                order=order,
                status=OrderStatus.CONFIRMED,
                title="Order Confirmed",
                description="Payment authorized and order confirmed. Sent to fulfillment warehouse."
            )

            # Clear cart
            cart.items.all().delete()

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()
        if user.is_staff_member:
            qs = Order.objects.all().order_by('-created_at')
            status_param = self.request.query_params.get('status')
            if status_param:
                qs = qs.filter(status=status_param)
            return qs
        return Order.objects.filter(user=user).order_by('-created_at')

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffRole])
    def update_status(self, request, id=None):
        order = self.get_object()
        new_status = request.data.get('status')
        tracking_number = request.data.get('tracking_number')
        notes = request.data.get('notes', '')

        if new_status and new_status in OrderStatus.values:
            order.status = new_status
            if tracking_number:
                order.tracking_number = tracking_number
            order.save()

            title_map = {
                OrderStatus.PROCESSING: "Order in Processing",
                OrderStatus.SHIPPED: "Shipped & In Transit",
                OrderStatus.DELIVERED: "Delivered to Customer",
                OrderStatus.CANCELLED: "Order Cancelled",
                OrderStatus.REFUNDED: "Order Refunded",
            }
            title = title_map.get(new_status, f"Status updated to {new_status}")
            OrderTimeline.objects.create(
                order=order,
                status=new_status,
                title=title,
                description=notes or f"Order status changed to {new_status}."
            )

        return Response(OrderDetailSerializer(order).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='track/(?P<order_number>[^/.]+)')
    def track(self, request, order_number=None):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderDetailSerializer(order).data)


class SalesAnalyticsView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # High-level KPIs
        orders = Order.objects.exclude(status=OrderStatus.CANCELLED)
        total_revenue = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders_count = orders.count()
        recent_orders_count = orders.filter(created_at__gte=thirty_days_ago).count()
        recent_revenue = orders.filter(created_at__gte=thirty_days_ago).aggregate(total=Sum('total_amount'))['total'] or 0
        avg_order_value = float(recent_revenue) / recent_orders_count if recent_orders_count > 0 else 0

        # Orders by status breakdown
        status_breakdown = list(
            Order.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Top 5 products by quantity sold
        top_products = list(
            OrderItem.objects.values('product_name')
            .annotate(total_sold=Sum('quantity'), total_sales=Sum('subtotal'))
            .order_by('-total_sold')[:5]
        )

        return Response({
            "total_revenue": float(total_revenue),
            "recent_30d_revenue": float(recent_revenue),
            "total_orders_count": total_orders_count,
            "recent_30d_orders_count": recent_orders_count,
            "average_order_value": round(avg_order_value, 2),
            "status_breakdown": status_breakdown,
            "top_products": top_products,
        })
