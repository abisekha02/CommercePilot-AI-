from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Sum, F, Count
from django.utils import timezone
from apps.accounts.permissions import IsStaffRole, IsWarehouseRole, IsManagerRole
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
from .serializers import (
    WarehouseSerializer,
    SupplierSerializer,
    StockItemSerializer,
    StockAdjustmentSerializer,
    StockMovementSerializer,
    PurchaseOrderSerializer,
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsStaffRole]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsStaffRole]


class StockItemViewSet(viewsets.ModelViewSet):
    queryset = StockItem.objects.select_related('product', 'variant', 'warehouse').all()
    serializer_class = StockItemSerializer
    permission_classes = [IsStaffRole]

    def get_queryset(self):
        qs = super().get_queryset()
        warehouse_id = self.request.query_params.get('warehouse')
        if warehouse_id:
            qs = qs.filter(warehouse_id=warehouse_id)

        low_stock_only = self.request.query_params.get('low_stock')
        if low_stock_only and low_stock_only.lower() in ['true', '1']:
            qs = qs.filter(quantity_on_hand__lte=F('min_stock_threshold'))

        return qs

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        low_items = self.queryset.filter(quantity_on_hand__lte=F('min_stock_threshold'))
        serializer = self.get_serializer(low_items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsWarehouseRole])
    def adjust_stock(self, request, pk=None):
        stock_item = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity_change = serializer.validated_data['quantity_change']
        movement_type = serializer.validated_data['movement_type']
        ref = serializer.validated_data.get('reference_number', '')
        notes = serializer.validated_data.get('notes', '')

        with transaction.atomic():
            prev_qty = stock_item.quantity_on_hand
            new_qty = prev_qty + quantity_change
            if new_qty < 0:
                return Response(
                    {"error": f"Cannot reduce stock below zero. Current stock is {prev_qty}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            stock_item.quantity_on_hand = new_qty
            if quantity_change > 0:
                stock_item.last_restocked_at = timezone.now()
            stock_item.save(update_fields=['quantity_on_hand', 'last_restocked_at', 'updated_at'])

            # Also update product variant stock if bound
            if stock_item.variant:
                stock_item.variant.stock_quantity = new_qty
                stock_item.variant.save(update_fields=['stock_quantity'])

            movement = StockMovement.objects.create(
                stock_item=stock_item,
                movement_type=movement_type,
                quantity_change=quantity_change,
                previous_quantity=prev_qty,
                new_quantity=new_qty,
                reference_number=ref,
                notes=notes,
                performed_by=request.user
            )

        return Response({
            "message": "Stock adjusted successfully",
            "stock_item": StockItemSerializer(stock_item).data,
            "movement": StockMovementSerializer(movement).data
        })


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related('stock_item__product', 'stock_item__warehouse', 'performed_by').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffRole]

    def get_queryset(self):
        qs = super().get_queryset()
        m_type = self.request.query_params.get('type')
        if m_type:
            qs = qs.filter(movement_type=m_type)
        return qs


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.prefetch_related('items__product', 'items__variant').select_related('supplier', 'warehouse', 'created_by').all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsStaffRole]

    @action(detail=True, methods=['post'], permission_classes=[IsWarehouseRole])
    def receive_items(self, request, pk=None):
        """
        Receives items against this PO, increments inventory, and writes StockMovements.
        Payload format: {"items": [{"item_id": 1, "received_quantity": 10}, ...]}
        """
        po = self.get_object()
        if po.status in [PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.CANCELLED]:
            return Response({"error": f"Cannot receive items on a {po.status} PO"}, status=status.HTTP_400_BAD_REQUEST)

        incoming_items = request.data.get('items', [])
        if not incoming_items:
            # If no specific items listed, mark all items as fully received
            incoming_items = [{'item_id': item.id, 'received_quantity': item.quantity_ordered - item.quantity_received} for item in po.items.all()]

        warehouse = po.warehouse or Warehouse.objects.filter(is_primary=True).first() or Warehouse.objects.first()
        if not warehouse:
            return Response({"error": "No destination warehouse configured."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            all_fulfilled = True
            for entry in incoming_items:
                item_id = entry.get('item_id')
                recv_qty = int(entry.get('received_quantity', 0))
                if recv_qty <= 0:
                    continue

                po_item = po.items.filter(id=item_id).first()
                if not po_item:
                    continue

                po_item.quantity_received += recv_qty
                po_item.save(update_fields=['quantity_received'])

                if po_item.quantity_received < po_item.quantity_ordered:
                    all_fulfilled = False

                # Update or create StockItem in destination warehouse
                stock_item, _ = StockItem.objects.get_or_create(
                    product=po_item.product,
                    variant=po_item.variant,
                    warehouse=warehouse,
                    defaults={'quantity_on_hand': 0, 'min_stock_threshold': 10}
                )
                prev_qty = stock_item.quantity_on_hand
                stock_item.quantity_on_hand += recv_qty
                stock_item.last_restocked_at = timezone.now()
                stock_item.save(update_fields=['quantity_on_hand', 'last_restocked_at', 'updated_at'])

                # Variant sync
                if po_item.variant:
                    po_item.variant.stock_quantity = stock_item.quantity_on_hand
                    po_item.variant.save(update_fields=['stock_quantity'])

                # Log movement
                StockMovement.objects.create(
                    stock_item=stock_item,
                    movement_type=MovementType.INBOUND_PURCHASE,
                    quantity_change=recv_qty,
                    previous_quantity=prev_qty,
                    new_quantity=stock_item.quantity_on_hand,
                    reference_number=po.po_number,
                    notes=f"Received against {po.po_number}",
                    performed_by=request.user
                )

            # Update PO status
            po.status = PurchaseOrderStatus.COMPLETED if all_fulfilled else PurchaseOrderStatus.PARTIALLY_RECEIVED
            po.save(update_fields=['status', 'updated_at'])

        return Response({
            "message": "Purchase order items received successfully",
            "po": PurchaseOrderSerializer(po).data
        })


class InventoryAnalyticsView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        total_items_count = StockItem.objects.count()
        total_units_on_hand = StockItem.objects.aggregate(total=Sum('quantity_on_hand'))['total'] or 0
        low_stock_count = StockItem.objects.filter(quantity_on_hand__lte=F('min_stock_threshold')).count()
        total_valuation = StockItem.objects.annotate(
            item_val=F('quantity_on_hand') * F('product__cost_price')
        ).aggregate(total=Sum('item_val'))['total'] or 0
        total_retail_val = StockItem.objects.annotate(
            item_val=F('quantity_on_hand') * F('product__base_price')
        ).aggregate(total=Sum('item_val'))['total'] or 0

        pending_pos = PurchaseOrder.objects.filter(
            status__in=[PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.PARTIALLY_RECEIVED]
        ).count()

        recent_movements = StockMovement.objects.order_by('-created_at')[:10]

        return Response({
            "total_skus": total_items_count,
            "total_units_on_hand": total_units_on_hand,
            "low_stock_count": low_stock_count,
            "total_inventory_cost_value": float(total_valuation),
            "total_inventory_retail_value": float(total_retail_val),
            "pending_purchase_orders": pending_pos,
            "recent_movements": StockMovementSerializer(recent_movements, many=True).data
        })
