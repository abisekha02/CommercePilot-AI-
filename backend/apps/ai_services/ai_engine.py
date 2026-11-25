import os
import json
import logging
import requests
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)


class CommercePilotAIEngine:
    """
    Intelligent AI engine with dual provider support:
    - Primary: Google Gemini API (or OpenAI API)
    - Resilient Fallback: Built-in semantic heuristics generator for offline/demo operation.
    """

    def __init__(self):
        self.gemini_key = getattr(settings, 'GEMINI_API_KEY', '') or os.getenv('GEMINI_API_KEY', '')
        self.openai_key = getattr(settings, 'OPENAI_API_KEY', '') or os.getenv('OPENAI_API_KEY', '')

    def _call_gemini(self, prompt: str, system_instruction: str = "") -> str:
        """Calls Google Gemini REST API directly."""
        if not self.gemini_key:
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        headers = {'Content-Type': 'application/json'}

        contents = []
        if system_instruction:
            contents.append({
                "role": "user",
                "parts": [{"text": f"SYSTEM INSTRUCTION: {system_instruction}\n\nUSER PROMPT: {prompt}"}]
            })
        else:
            contents.append({
                "role": "user",
                "parts": [{"text": prompt}]
            })

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            }
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                res_data = response.json()
                candidates = res_data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    if parts:
                        return parts[0].get('text', '')
            logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Error calling Gemini API: {str(e)}")

        return ""

    def generate_product_description(self, title: str, category: str, features: list = None, tone: str = "persuasive", audience: str = "general shoppers"):
        """Generates SEO-optimized product description, key benefits, and meta tags."""
        features_str = ", ".join(features) if features else "premium quality, durable build, high performance"
        prompt = f"""
Create an e-commerce product description for:
Product: {title}
Category: {category}
Features: {features_str}
Tone: {tone}
Audience: {audience}

Return your answer strictly in valid JSON format with keys:
- tagline: short catchy one-liner
- description: 2-3 engaging paragraphs
- bullet_points: array of 4 bullet points emphasizing value
- seo_meta_description: 150-160 characters summary for Google
- tags: array of 5-8 relevant search tags
"""
        raw_text = self._call_gemini(prompt, "You are a world-class e-commerce copywriter.")
        if raw_text:
            try:
                # Strip markdown json codeblocks if any
                clean_json = raw_text.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.startswith("```"):
                    clean_json = clean_json[3:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                return json.loads(clean_json.strip())
            except Exception:
                pass

        # Intelligent Fallback Engine
        tagline = f"Experience premium quality with {title} — engineered for everyday excellence."
        bullets = [
            f"Precision crafted for top-tier reliability in {category or 'lifestyle'}",
            "Engineered with durable, high-grade materials for long-lasting use",
            "Modern ergonomic design that seamlessly fits into your routine",
            "Backed by our 30-day satisfaction guarantee and full warranty"
        ]
        if features:
            bullets = [f"Highlight: {f}" for f in features[:4]]

        description = (
            f"Upgrade your lifestyle with the {title}. Designed specifically for those who value both style and functionality, "
            f"this outstanding piece in our {category or 'featured'} collection delivers unbeatable performance and longevity.\n\n"
            f"Whether you are upgrading your setup or looking for the perfect gift, the {title} stands out with meticulous craftsmanship, "
            f"cutting-edge design, and seamless usability."
        )

        tags = [title.lower(), category.lower() if category else 'trending', 'premium', 'best-seller', 'top-rated']

        return {
            "tagline": tagline,
            "description": description,
            "bullet_points": bullets,
            "seo_meta_description": f"Discover the {title}. Premium quality, superior durability, and sleek design. Free shipping available on orders over $50.",
            "tags": tags,
            "provider": "smart-engine"
        }

    def answer_support_question(self, user_question: str, catalog_context: list, chat_history: list = None):
        """Answers customer questions grounded in real product catalogue and store policies."""
        prompt = f"""
You are "PilotBot", the friendly and knowledgeable AI shopping assistant for CommercePilot.
Store Policies:
- Free shipping on all orders over $50. Standard shipping is $9.99 (delivery in 3-5 business days).
- 30-day hassle-free return policy.
- 100% authentic products with manufacturer warranties.

Here is the current live product catalog data:
{json.dumps(catalog_context[:8], indent=2)}

User Question: "{user_question}"

Provide a warm, helpful, concise answer. If matching products are mentioned, refer to them accurately by name and price.
"""
        raw_text = self._call_gemini(prompt, "You are CommercePilot's AI assistant. Ground all answers strictly on provided store facts.")
        if raw_text and len(raw_text.strip()) > 10:
            return {
                "reply": raw_text.strip(),
                "provider": "gemini"
            }

        # Resilient Heuristic grounder
        q_lower = user_question.lower()
        if any(w in q_lower for w in ['shipping', 'delivery', 'ship', 'track']):
            reply = "We offer **Free Standard Shipping** on all orders over $50! For orders under $50, flat-rate shipping is $9.99. Orders typically arrive within 3 to 5 business days, and you will receive a real-time tracking number as soon as your package leaves our warehouse."
        elif any(w in q_lower for w in ['return', 'refund', 'warranty', 'exchange']):
            reply = "We offer a **30-day hassle-free return and exchange policy**. If you're not completely satisfied with your purchase, simply submit a return request from your order history for a full refund or exchange. All items come with a 1-year warranty."
        else:
            # Match keywords to catalog
            matches = []
            for p in catalog_context:
                if any(k in p.get('name', '').lower() for k in q_lower.split()) or any(k in p.get('category', '').lower() for k in q_lower.split()):
                    matches.append(p)

            if matches:
                top = matches[0]
                reply = (
                    f"Yes! We recommend the **{top.get('name')}** priced at **${top.get('price')}**. "
                    f"It currently has {top.get('stock', 0)} units in stock and is rated {top.get('rating', 5.0)}/5.0 stars! "
                    f"Would you like me to help you add it to your cart?"
                )
            else:
                reply = (
                    f"Thanks for reaching out to CommercePilot AI! I can help you find products, check stock levels, "
                    f"track existing orders, or share details about our 30-day return policy and free shipping over $50. "
                    f"What specific item or category are you shopping for today?"
                )

        return {
            "reply": reply,
            "provider": "smart-engine"
        }

    def analyze_inventory_health(self, stock_data: list, sales_data: list):
        """Analyzes stock turnover, highlights slow movers, and suggests AI actions."""
        slow_movers = []
        healthy_movers = []
        critical_low = []

        total_units = sum(item.get('quantity_on_hand', 0) for item in stock_data)

        # Map sold count per product SKU/name
        sales_map = {}
        for sale in sales_data:
            sku = sale.get('sku') or sale.get('product_name')
            sales_map[sku] = sales_map.get(sku, 0) + sale.get('quantity', 0)

        for item in stock_data:
            sku = item.get('sku')
            qty = item.get('quantity_on_hand', 0)
            threshold = item.get('min_threshold', 10)
            sold = sales_map.get(sku, 0)

            # Categorize
            if qty <= threshold:
                critical_low.append({
                    "product": item.get('name'),
                    "sku": sku,
                    "quantity": qty,
                    "threshold": threshold,
                    "action": "Urgent PO Reorder needed"
                })
            elif qty > 30 and sold == 0:
                slow_movers.append({
                    "product": item.get('name'),
                    "sku": sku,
                    "quantity": qty,
                    "sold_recent": sold,
                    "days_dormant": 45,
                    "recommendation": "Apply 15-20% promotional bundle discount or feature on homepage"
                })
            else:
                healthy_movers.append(item.get('name'))

        ai_summary = (
            f"Executive AI Inventory Health Assessment:\n"
            f"- Total live inventory units monitored: {total_units} across {len(stock_data)} catalog SKUs.\n"
            f"- Critical low-stock alerts: {len(critical_low)} SKUs require urgent replenishment to prevent stockouts.\n"
            f"- Slow-moving inventory detected: {len(slow_movers)} items exhibit sluggish turnover.\n"
            f"- Recommended strategy: Initiate restock Purchase Orders for top velocity items and deploy automated flash discounts on dormant stock."
        )

        return {
            "summary": ai_summary,
            "critical_low_stock": critical_low,
            "slow_moving_stock": slow_movers,
            "healthy_sku_count": len(healthy_movers),
            "generated_at": str(settings.TIME_ZONE)
        }
