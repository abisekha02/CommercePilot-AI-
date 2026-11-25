from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet,
    SupplierViewSet,
    StockItemViewSet,
    StockMovementViewSet,
    PurchaseOrderViewSet,
    InventoryAnalyticsView,
)

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'stock', StockItemViewSet, basename='stock')
router.register(r'movements', StockMovementViewSet, basename='stock-movement')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')

urlpatterns = [
    path('analytics/', InventoryAnalyticsView.as_view(), name='inventory_analytics'),
    path('', include(router.urls)),
]
