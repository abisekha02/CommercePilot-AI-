from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from .models import (
    Warehouse,
    Supplier,
    StockItem,
    StockMovement,
    PurchaseOrder,
    PurchaseOrderItem,
    MovementType,
    PurchaseOrderStatus,
)
from apps.products.models import Product, ProductVariant


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'code', 'location', 'is_primary', 'created_at']


class SupplierSerializer(serializers.ModelSerializer):
    purchase_order_count = serializers.IntegerField(source='purchase_orders.count', read_only=True)

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_name', 'email', 'phone',
            'address', 'lead_time_days', 'rating', 'purchase_order_count', 'created_at'
        ]


class StockItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    variant_sku = serializers.CharField(source='variant.sku', read_only=True, allow_null=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    warehouse_code = serializers.CharField(source='warehouse.code', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    unit_cost = serializers.DecimalField(source='product.cost_price', max_digits=10, decimal_places=2, read_only=True)
    unit_price = serializers.DecimalField(source='product.base_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = StockItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'variant', 'variant_name', 'variant_sku',
            'warehouse', 'warehouse_name', 'warehouse_code',
            'quantity_on_hand', 'reserved_quantity', 'available_quantity',
            'min_stock_threshold', 'reorder_quantity', 'is_low_stock',
            'unit_cost', 'unit_price', 'last_restocked_at', 'updated_at'
        ]


class StockAdjustmentSerializer(serializers.Serializer):
    quantity_change = serializers.IntegerField(required=True)
    movement_type = serializers.ChoiceField(choices=MovementType.choices, default=MovementType.ADJUSTMENT_AUDIT)
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_quantity_change(self, value):
        if value == 0:
            raise serializers.ValidationError("Adjustment quantity cannot be zero.")
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='stock_item.product.name', read_only=True)
    warehouse_code = serializers.CharField(source='stock_item.warehouse.code', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'stock_item', 'product_name', 'warehouse_code',
            'movement_type', 'movement_type_display',
            'quantity_change', 'previous_quantity', 'new_quantity',
            'reference_number', 'notes', 'performed_by_name', 'created_at'
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, allow_null=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'purchase_order', 'product', 'product_name',
            'variant', 'variant_name', 'quantity_ordered',
            'quantity_received', 'unit_cost', 'line_total'
        ]
        extra_kwargs = {'purchase_order': {'required': False}}


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    items = PurchaseOrderItemSerializer(many=True, required=False)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name',
            'warehouse', 'warehouse_name', 'status', 'status_display',
            'order_date', 'expected_delivery_date', 'total_cost',
            'notes', 'created_by_name', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        validated_data['created_by'] = self.context['request'].user
        po = PurchaseOrder.objects.create(**validated_data)

        total = 0
        for item_data in items_data:
            item = PurchaseOrderItem.objects.create(purchase_order=po, **item_data)
            total += item.quantity_ordered * item.unit_cost

        po.total_cost = total
        po.save(update_fields=['total_cost'])
        return po
