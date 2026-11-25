from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsStaffRole, IsManagerRole
from apps.products.models import Product, Category
from apps.products.serializers import ProductListSerializer
from apps.inventory.models import StockItem
from apps.orders.models import OrderItem, Order
from .ai_engine import CommercePilotAIEngine

ai_engine = CommercePilotAIEngine()


class ProductDescriptionGeneratorView(APIView):
    """Generates AI copywriting for product catalog listings."""
    permission_classes = [IsManagerRole]

    def post(self, request):
        title = request.data.get('title')
        if not title:
            return Response({"error": "Product title is required"}, status=status.HTTP_400_BAD_REQUEST)

        category = request.data.get('category', '')
        features = request.data.get('features', [])
        tone = request.data.get('tone', 'persuasive')
        audience = request.data.get('audience', 'tech enthusiasts and modern professionals')

        result = ai_engine.generate_product_description(
            title=title,
            category=category,
            features=features,
            tone=tone,
            audience=audience
        )
        return Response(result)


class ProductRecommendationsView(APIView):
    """Generates intelligent personalized recommendations with contextual reasoning."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_id = request.data.get('product_id')
        category_slug = request.data.get('category_slug')
        limit = int(request.data.get('limit', 4))

        qs = Product.objects.filter(is_active=True)
        current_product = None

        if product_id:
            current_product = Product.objects.filter(id=product_id).first()
            if current_product:
                qs = qs.exclude(id=current_product.id)
                if current_product.category:
                    # Prioritize products in same category or matching tags
                    cat_matches = qs.filter(category=current_product.category)
                    other_matches = qs.exclude(category=current_product.category)
                    recs = list(cat_matches[:limit])
                    if len(recs) < limit:
                        recs.extend(list(other_matches[:(limit - len(recs))]))
                else:
                    recs = list(qs[:limit])
            else:
                recs = list(qs[:limit])
        elif category_slug:
            recs = list(qs.filter(category__slug=category_slug)[:limit])
            if len(recs) < limit:
                recs.extend(list(qs.exclude(category__slug=category_slug)[:(limit - len(recs))]))
        else:
            recs = list(qs.order_by('-featured', '-created_at')[:limit])

        # Attach AI recommendation rationale to each product
        results = []
        for p in recs:
            p_data = ProductListSerializer(p).data
            if current_product and p.category_id == current_product.category_id:
                reason = f"Frequently paired with items in {p.category.name if p.category else 'this category'}"
            elif p.featured:
                reason = "Popular top-seller with 4.8+ customer rating"
            else:
                reason = "Recommended based on your current browsing interest"

            p_data['ai_recommendation_reason'] = reason
            results.append(p_data)

        return Response({
            "recommendations": results,
            "engine": "CommercePilot Hybrid AI Engine"
        })


class AIChatbotView(APIView):
    """Interactive AI Store-Support Assistant grounded on real product catalog & policies."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        history = request.data.get('history', [])

        # Fetch active products for catalog grounding context
        products = Product.objects.filter(is_active=True).select_related('category')[:15]
        catalog_context = [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category.name if p.category else "General",
                "price": str(p.base_price),
                "stock": p.total_stock,
                "rating": p.average_rating,
                "slug": p.slug
            }
            for p in products
        ]

        result = ai_engine.answer_support_question(
            user_question=message,
            catalog_context=catalog_context,
            chat_history=history
        )

        # Also find up to 2 referenced products to suggest as clickable cards
        suggested_products = []
        msg_words = set(message.lower().split())
        for p in products:
            p_words = set(p.name.lower().split()) | set((p.category.name.lower() if p.category else '').split())
            if msg_words & p_words:
                suggested_products.append(ProductListSerializer(p).data)
                if len(suggested_products) >= 2:
                    break

        result['suggested_products'] = suggested_products
        return Response(result)


class AIInventorySummaryView(APIView):
    """Executive AI inventory health assessment and slow-moving stock identification."""
    permission_classes = [IsStaffRole]

    def get(self, request):
        stock_items = StockItem.objects.select_related('product', 'warehouse').all()
        stock_data = [
            {
                "id": s.id,
                "name": s.product.name,
                "sku": s.product.sku,
                "quantity_on_hand": s.quantity_on_hand,
                "min_threshold": s.min_stock_threshold,
                "cost_price": float(s.product.cost_price),
                "base_price": float(s.product.base_price),
            }
            for s in stock_items
        ]

        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_sales = list(
            OrderItem.objects.filter(order__created_at__gte=thirty_days_ago)
            .values('sku', 'product_name')
            .annotate(quantity=Sum('quantity'))
        )

        analysis = ai_engine.analyze_inventory_health(
            stock_data=stock_data,
            sales_data=recent_sales
        )

        return Response(analysis)
