from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartView, CartItemView, CheckoutView, OrderViewSet, SalesAnalyticsView

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemView.as_view(), name='cart_items'),
    path('cart/items/<int:item_id>/', CartItemView.as_view(), name='cart_item_detail'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('sales/analytics/', SalesAnalyticsView.as_view(), name='sales_analytics'),
    path('', include(router.urls)),
]
