from django.db import models
from django.conf import settings
from decimal import Decimal


class Warehouse(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=30, unique=True)
    location = models.CharField(max_length=255)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Supplier(models.Model):
    name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    lead_time_days = models.PositiveIntegerField(default=7, help_text="Typical restock lead time in days")
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=Decimal('4.8'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class StockItem(models.Model):
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='stock_items'
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_items'
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stock_items'
    )
    quantity_on_hand = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0, help_text="Reserved for pending unshipped orders")
    min_stock_threshold = models.IntegerField(default=10, help_text="Triggers low-stock alert")
    reorder_quantity = models.IntegerField(default=50)
    last_restocked_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'variant', 'warehouse')

    @property
    def available_quantity(self):
        return max(0, self.quantity_on_hand - self.reserved_quantity)

    @property
    def is_low_stock(self):
        return self.quantity_on_hand <= self.min_stock_threshold

    def __str__(self):
        v_name = f" - {self.variant.name}" if self.variant else ""
        return f"{self.product.name}{v_name} @ {self.warehouse.code}: {self.quantity_on_hand} units"


class MovementType(models.TextChoices):
    INBOUND_PURCHASE = 'INBOUND_PURCHASE', 'Inbound Purchase Order'
    OUTBOUND_SALE = 'OUTBOUND_SALE', 'Customer Order Fulfillment'
    ADJUSTMENT_DAMAGE = 'ADJUSTMENT_DAMAGE', 'Damage / Scrap Adjustment'
    ADJUSTMENT_AUDIT = 'ADJUSTMENT_AUDIT', 'Physical Inventory Audit'
    RETURN_RESTOCK = 'RETURN_RESTOCK', 'Customer Return Restock'


class StockMovement(models.Model):
    stock_item = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE,
        related_name='movements'
    )
    movement_type = models.CharField(
        max_length=30,
        choices=MovementType.choices,
        default=MovementType.ADJUSTMENT_AUDIT
    )
    quantity_change = models.IntegerField(help_text="Positive for additions, negative for reductions")
    previous_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    reference_number = models.CharField(max_length=100, blank=True, help_text="Order ID, PO number, or Audit ID")
    notes = models.TextField(blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        sign = "+" if self.quantity_change > 0 else ""
        return f"{self.stock_item.product.name}: {sign}{self.quantity_change} ({self.get_movement_type_display()})"


class PurchaseOrderStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', 'Partially Received'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PurchaseOrder(models.Model):
    po_number = models.CharField(max_length=60, unique=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='purchase_orders'
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.SET_NULL,
        null=True,
        related_name='purchase_orders'
    )
    status = models.CharField(
        max_length=30,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.DRAFT
    )
    order_date = models.DateField(auto_now_add=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.po_number} - {self.supplier.name} ({self.get_status_display()})"


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE
    )
    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    quantity_ordered = models.PositiveIntegerField(default=1)
    quantity_received = models.PositiveIntegerField(default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity_ordered * self.unit_cost

    def __str__(self):
        return f"{self.quantity_ordered}x {self.product.name} on {self.purchase_order.po_number}"
