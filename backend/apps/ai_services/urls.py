from django.urls import path
from .views import (
    ProductDescriptionGeneratorView,
    ProductRecommendationsView,
    AIChatbotView,
    AIInventorySummaryView,
)

urlpatterns = [
    path('generate-description/', ProductDescriptionGeneratorView.as_view(), name='ai_generate_description'),
    path('recommendations/', ProductRecommendationsView.as_view(), name='ai_recommendations'),
    path('chat/', AIChatbotView.as_view(), name='ai_chat'),
    path('inventory-summary/', AIInventorySummaryView.as_view(), name='ai_inventory_summary'),
]
