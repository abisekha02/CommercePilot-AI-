from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random

from apps.accounts.models import User, UserRole
from apps.products.models import Category, Product, ProductVariant, ProductImage, ProductReview
from apps.inventory.models import (
    Warehouse, Supplier, StockItem, StockMovement,
    PurchaseOrder, PurchaseOrderItem, MovementType, PurchaseOrderStatus
)
from apps.orders.models import (
    Order, OrderItem, ShippingAddress, OrderTimeline,
    OrderStatus, PaymentStatus, PaymentMethod
)


class Command(BaseCommand):
    help = "Seeds the database with realistic e-commerce, ERP inventory, and analytics demo data."

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Create Users
        admin, _ = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@commercepilot.io",
                "first_name": "Alexander",
                "last_name": "Wright",
                "role": UserRole.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "company_name": "CommercePilot HQ",
                "phone": "+1 (555) 019-2834"
            }
        )
        admin.set_password("AdminPass123!")
        admin.role = UserRole.ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        manager, _ = User.objects.get_or_create(
            username="manager",
            defaults={
                "email": "manager@commercepilot.io",
                "first_name": "Elena",
                "last_name": "Rostova",
                "role": UserRole.STORE_MANAGER,
                "is_staff": True,
                "company_name": "CommercePilot Retail",
                "phone": "+1 (555) 018-9921"
            }
        )
        manager.set_password("ManagerPass123!")
        manager.role = UserRole.STORE_MANAGER
        manager.is_staff = True
        manager.save()

        warehouse_staff, _ = User.objects.get_or_create(
            username="warehouse",
            defaults={
                "email": "warehouse@commercepilot.io",
                "first_name": "Marcus",
                "last_name": "Vance",
                "role": UserRole.WAREHOUSE_STAFF,
                "is_staff": True,
                "company_name": "CommercePilot Logistics",
                "phone": "+1 (555) 014-4412"
            }
        )
        warehouse_staff.set_password("WarehousePass123!")
        warehouse_staff.role = UserRole.WAREHOUSE_STAFF
        warehouse_staff.is_staff = True
        warehouse_staff.save()

        customer, _ = User.objects.get_or_create(
            username="customer",
            defaults={
                "email": "customer@gmail.com",
                "first_name": "Sophia",
                "last_name": "Chen",
                "role": UserRole.CUSTOMER,
                "company_name": "Design Studio X",
                "phone": "+1 (555) 012-7788",
                "address": "742 Evergreen Terrace",
                "city": "Springfield",
                "country": "United States",
                "postal_code": "97477"
            }
        )
        customer.set_password("CustomerPass123!")
        customer.role = UserRole.CUSTOMER
        customer.save()

        self.stdout.write(self.style.SUCCESS("[OK] Users seeded (admin, manager, warehouse, customer)"))

        # 2. Warehouses
        w_central, _ = Warehouse.objects.get_or_create(
            code="W-CENTRAL",
            defaults={
                "name": "Central Midwest Distribution Hub",
                "location": "4500 Logistics Way, Chicago, IL 60607",
                "is_primary": True
            }
        )
        w_west, _ = Warehouse.objects.get_or_create(
            code="W-WEST",
            defaults={
                "name": "Pacific Coast Fulfillment Facility",
                "location": "1200 Harbor Blvd, Long Beach, CA 90802",
                "is_primary": False
            }
        )

        # 3. Suppliers
        s_apex, _ = Supplier.objects.get_or_create(
            name="Apex Microelectronics Ltd",
            defaults={
                "contact_name": "Julian Thorne",
                "email": "orders@apexmicro.com",
                "phone": "+1 (800) 555-0199",
                "address": "Silicon Park Bldg 4, Austin, TX",
                "lead_time_days": 5,
                "rating": Decimal('4.9')
            }
        )
        s_nova, _ = Supplier.objects.get_or_create(
            name="Nova Acoustic Technologies",
            defaults={
                "contact_name": "Beatrix Lindqvist",
                "email": "supply@novasound.io",
                "phone": "+46 8 123 4567",
                "address": "Nordic Tech Park, Stockholm, Sweden",
                "lead_time_days": 8,
                "rating": Decimal('4.8')
            }
        )
        s_lumina, _ = Supplier.objects.get_or_create(
            name="Lumina Lifestyle Innovations",
            defaults={
                "contact_name": "David Park",
                "email": "b2b@luminalife.com",
                "phone": "+1 (415) 555-8822",
                "address": "900 Market St, San Francisco, CA",
                "lead_time_days": 4,
                "rating": Decimal('4.7')
            }
        )

        # 4. Categories
        cat_audio, _ = Category.objects.get_or_create(
            name="Audio & Acoustics",
            defaults={
                "description": "High-fidelity headphones, earbuds, and spatial sound gear.",
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
            }
        )
        cat_computing, _ = Category.objects.get_or_create(
            name="Computing & Laptops",
            defaults={
                "description": "Next-gen AI laptops, performance workstations, and docks.",
                "image_url": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"
            }
        )
        cat_wearables, _ = Category.objects.get_or_create(
            name="Smart Wearables",
            defaults={
                "description": "Precision titanium smartwatches and biometric fitness monitors.",
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
            }
        )
        cat_productivity, _ = Category.objects.get_or_create(
            name="Workspace & Ergonomics",
            defaults={
                "description": "Custom mechanical keyboards, ergonomic desk stands, and accessories.",
                "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
            }
        )
        cat_smarthome, _ = Category.objects.get_or_create(
            name="Smart Ambient & Lighting",
            defaults={
                "description": "Intelligent circadian LED fixtures and automated home climate accents.",
                "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80"
            }
        )

        # 5. Products Data
        products_data = [
            {
                "name": "AuraPulse ANC Wireless Headphones",
                "sku": "AUD-AP-01",
                "brand": "AuraSound",
                "category": cat_audio,
                "base_price": Decimal("299.00"),
                "cost_price": Decimal("140.00"),
                "description": "Studio-grade wireless headphones featuring adaptive active noise cancellation, custom 45mm neodymium drivers, and 40-hour ultra battery life.",
                "ai_description": "Elevate your audio universe with AuraPulse ANC. Crafted with aerospace-grade magnesium alloy and plush memory foam, these headphones deliver pristine acoustics with real-time acoustic tuning. Ideal for audiophiles, remote professionals, and frequent flyers seeking unmatched isolation.",
                "featured": True,
                "tags": ["audio", "anc", "wireless", "headphones", "bluetooth"],
                "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                "variants": [
                    {"name": "Matte Obsidian", "sku": "AUD-AP-01-BLK", "additional_price": Decimal("0.00"), "stock": 42},
                    {"name": "Titanium Silver", "sku": "AUD-AP-01-SLV", "additional_price": Decimal("10.00"), "stock": 18},
                ]
            },
            {
                "name": "OmniBook Pro 16 AI Workstation",
                "sku": "CMP-OBP-16",
                "brand": "OmniTech",
                "category": cat_computing,
                "base_price": Decimal("1899.00"),
                "cost_price": Decimal("1100.00"),
                "description": "16-inch Liquid Retina XDR display laptop with dedicated 45 TOPS Neural Processing Engine, 32GB unified RAM, and all-day battery life.",
                "ai_description": "Unleash limitless creativity and machine learning workflows with OmniBook Pro 16. Powered by an advanced hybrid AI processor and vapor chamber cooling, it handles 8K video render pipelines and local LLM fine-tuning effortlessly.",
                "featured": True,
                "tags": ["laptop", "ai", "workstation", "creator", "apple-grade"],
                "image": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
                "variants": [
                    {"name": "32GB RAM / 1TB SSD", "sku": "CMP-OBP-16-1TB", "additional_price": Decimal("0.00"), "stock": 12},
                    {"name": "64GB RAM / 2TB SSD", "sku": "CMP-OBP-16-2TB", "additional_price": Decimal("400.00"), "stock": 4},  # LOW STOCK
                ]
            },
            {
                "name": "Vanguard Chrono Ultra Smartwatch",
                "sku": "WRB-VCU-02",
                "brand": "Vanguard",
                "category": cat_wearables,
                "base_price": Decimal("449.00"),
                "cost_price": Decimal("210.00"),
                "description": "Sapphire crystal display, grade 5 titanium chassis, multi-band dual-frequency GPS, and continuous medical-grade ECG and SpO2 tracking.",
                "ai_description": "Engineered for extreme expeditions and executive boardrooms alike. The Vanguard Chrono Ultra balances indestructible military spec resilience with understated luxury styling and 14-day stamina.",
                "featured": True,
                "tags": ["smartwatch", "wearables", "fitness", "gps", "titanium"],
                "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                "variants": [
                    {"name": "49mm Natural Titanium / Alpine Orange Band", "sku": "WRB-VCU-02-ORG", "additional_price": Decimal("0.00"), "stock": 25},
                    {"name": "49mm DLC Black / Trail Loop", "sku": "WRB-VCU-02-BLK", "additional_price": Decimal("20.00"), "stock": 2},  # CRITICAL LOW STOCK
                ]
            },
            {
                "name": "ErgoGlide Custom Mechanical Keyboard",
                "sku": "PRD-EGK-87",
                "brand": "GlideTech",
                "category": cat_productivity,
                "base_price": Decimal("189.00"),
                "cost_price": Decimal("75.00"),
                "description": "Gasket-mounted mechanical keyboard with CNC aluminum case, hot-swappable switches, PBT double-shot keycaps, and triple-mode connectivity.",
                "ai_description": "Type in acoustic bliss. The ErgoGlide 87 features 5 layers of sound-dampening poron foam and factory-lubed linear switches for an intoxicating marble-like typing thock.",
                "featured": False,
                "tags": ["keyboard", "mechanical", "custom", "ergonomic", "wireless"],
                "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
                "variants": [
                    {"name": "Linear Smooth Red / Chalk White", "sku": "PRD-EGK-87-RED", "additional_price": Decimal("0.00"), "stock": 55},
                    {"name": "Tactile Thock Brown / Dark Navy", "sku": "PRD-EGK-87-BRN", "additional_price": Decimal("10.00"), "stock": 38},
                ]
            },
            {
                "name": "LuminaFlow 4K Smart Ambient Lamp",
                "sku": "SMH-LF-01",
                "brand": "Lumina",
                "category": cat_smarthome,
                "base_price": Decimal("129.00"),
                "cost_price": Decimal("48.00"),
                "description": "Smart RGBIC dynamic gradient light bar with screen audio synchronization, HomeKit / Matter compatibility, and sunset circadian rhythm mode.",
                "ai_description": "Transform your room ambience with LuminaFlow. Dynamic lighting algorithms analyze your workspace music or screen display in real-time, casting an immersive aura.",
                "featured": False,
                "tags": ["smarthome", "lighting", "ambient", "rgb", "matter"],
                "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
                "variants": [
                    {"name": "Anodized Silver Base", "sku": "SMH-LF-01-SLV", "additional_price": Decimal("0.00"), "stock": 60},
                ]
            },
            {
                "name": "QuantumSync 14-in-1 Thunderbolt 4 Dock",
                "sku": "CMP-QSD-14",
                "brand": "QuantumHub",
                "category": cat_computing,
                "base_price": Decimal("249.00"),
                "cost_price": Decimal("110.00"),
                "description": "Dual 4K@120Hz display outputs, 96W Power Delivery passthrough, UHS-II SD reader, and 2.5 Gigabit Ethernet port in aluminum housing.",
                "ai_description": "One cable connects your entire workstation. QuantumSync delivers full bandwidth Thunderbolt 4 speeds with thermal dissipation engineered for continuous heavy transfer.",
                "featured": True,
                "tags": ["dock", "thunderbolt", "computing", "usb-c", "workstation"],
                "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80",
                "variants": [
                    {"name": "Space Gray Aluminum", "sku": "CMP-QSD-14-GRY", "additional_price": Decimal("0.00"), "stock": 3},  # LOW STOCK
                ]
            },
            {
                "name": "Titanium Aero Pro Wireless Earbuds",
                "sku": "AUD-TAP-03",
                "brand": "AuraSound",
                "category": cat_audio,
                "base_price": Decimal("179.00"),
                "cost_price": Decimal("65.00"),
                "description": "IPX7 waterproof earbuds with planar magnetic drivers, bone-conduction clear voice microphones, and magnetic wireless charging case.",
                "ai_description": "Featherlight fit with heavyweight fidelity. The Titanium Aero Pro is purpose-built for marathons, intense training sessions, and high-stakes conference calls.",
                "featured": False,
                "tags": ["audio", "earbuds", "wireless", "waterproof", "sport"],
                "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
                "variants": [
                    {"name": "Ceramic White", "sku": "AUD-TAP-03-WHT", "additional_price": Decimal("0.00"), "stock": 70},
                    {"name": "Carbon Gray", "sku": "AUD-TAP-03-GRY", "additional_price": Decimal("0.00"), "stock": 45},
                ]
            },
            {
                "name": "VisionPad Magnetic Floating Stand",
                "sku": "PRD-VPM-01",
                "brand": "GlideTech",
                "category": cat_productivity,
                "base_price": Decimal("89.00"),
                "cost_price": Decimal("32.00"),
                "description": "Magnetic floating cantilever desk stand for 11-inch and 12.9-inch tablets with 360-degree rotation and integrated wireless phone charging pad in base.",
                "ai_description": "Turn your tablet into a desktop command center. The VisionPad stand combines powerful rare-earth magnets with dual-axis pivot tension hinges that hold rock steady.",
                "featured": False,
                "tags": ["stand", "desk", "tablet", "ergonomics", "accessories"],
                "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80",
                "variants": [
                    {"name": "Space Gray", "sku": "PRD-VPM-01-GRY", "additional_price": Decimal("0.00"), "stock": 28},
                ]
            }
        ]

        created_products = []
        for p_info in products_data:
            p, _ = Product.objects.get_or_create(
                sku=p_info["sku"],
                defaults={
                    "name": p_info["name"],
                    "brand": p_info["brand"],
                    "category": p_info["category"],
                    "base_price": p_info["base_price"],
                    "cost_price": p_info["cost_price"],
                    "description": p_info["description"],
                    "ai_description": p_info["ai_description"],
                    "featured": p_info["featured"],
                    "tags": p_info["tags"],
                    "is_active": True
                }
            )
            created_products.append(p)

            # Image
            ProductImage.objects.get_or_create(
                product=p,
                image_url=p_info["image"],
                defaults={"is_primary": True, "alt_text": p.name}
            )

            # Variants and StockItems
            for v_info in p_info["variants"]:
                v, _ = ProductVariant.objects.get_or_create(
                    sku=v_info["sku"],
                    defaults={
                        "product": p,
                        "name": v_info["name"],
                        "additional_price": v_info["additional_price"],
                        "stock_quantity": v_info["stock"],
                        "is_active": True
                    }
                )

                # Create StockItem in Central Warehouse
                stock_item, created = StockItem.objects.get_or_create(
                    product=p,
                    variant=v,
                    warehouse=w_central,
                    defaults={
                        "quantity_on_hand": v_info["stock"],
                        "min_stock_threshold": 10,
                        "reorder_quantity": 40,
                        "last_restocked_at": timezone.now() - timedelta(days=random.randint(2, 20))
                    }
                )
                if not created:
                    stock_item.quantity_on_hand = v_info["stock"]
                    stock_item.save()

                # Add initial stock movement ledger
                StockMovement.objects.get_or_create(
                    stock_item=stock_item,
                    movement_type=MovementType.INBOUND_PURCHASE,
                    defaults={
                        "quantity_change": v_info["stock"],
                        "previous_quantity": 0,
                        "new_quantity": v_info["stock"],
                        "reference_number": "INIT-SEED-2026",
                        "notes": "Initial warehouse inventory onboarding",
                        "performed_by": warehouse_staff
                    }
                )

        # 6. Product Reviews
        reviews_data = [
            {"product": created_products[0], "rating": 5, "title": "Insane noise cancellation!", "comment": "The ANC completely silenced my cross-country flight. Battery easily lasted 3 days of heavy use. Best purchase of the year."},
            {"product": created_products[0], "rating": 5, "title": "Audiophile approved", "comment": "Soundstage is remarkably wide for closed-back wireless. Highs are crisp without being fatiguing."},
            {"product": created_products[1], "rating": 5, "title": "Blazing fast for local AI models", "comment": "Runs 8B parameter models locally at 28 tokens/sec without thermal throttling. Build quality is exceptional."},
            {"product": created_products[2], "rating": 4, "title": "Durable and stylish", "comment": "Titanium case has survived multiple mountain hikes without a scratch. GPS lock is instantaneous."},
            {"product": created_products[3], "rating": 5, "title": "Pure typing luxury", "comment": "The sound profile is deep and creamy right out of the box. Keycaps feel textured and high-end."},
        ]
        for r_info in reviews_data:
            ProductReview.objects.get_or_create(
                product=r_info["product"],
                user=customer,
                defaults={
                    "rating": r_info["rating"],
                    "title": r_info["title"],
                    "comment": r_info["comment"]
                }
            )

        # 7. Purchase Orders
        po1, _ = PurchaseOrder.objects.get_or_create(
            po_number="PO-2026-0881",
            defaults={
                "supplier": s_apex,
                "warehouse": w_central,
                "status": PurchaseOrderStatus.COMPLETED,
                "total_cost": Decimal("5500.00"),
                "notes": "Restock run for Q4 AI Laptops & Docking stations",
                "created_by": manager,
                "expected_delivery_date": timezone.now().date() - timedelta(days=2)
            }
        )
        PurchaseOrderItem.objects.get_or_create(
            purchase_order=po1,
            product=created_products[1],
            defaults={
                "quantity_ordered": 5,
                "quantity_received": 5,
                "unit_cost": Decimal("1100.00")
            }
        )

        po2, _ = PurchaseOrder.objects.get_or_create(
            po_number="PO-2026-0894",
            defaults={
                "supplier": s_nova,
                "warehouse": w_central,
                "status": PurchaseOrderStatus.SUBMITTED,
                "total_cost": Decimal("2800.00"),
                "notes": "Urgent restock for AuraPulse headphones and earbuds",
                "created_by": manager,
                "expected_delivery_date": timezone.now().date() + timedelta(days=4)
            }
        )
        PurchaseOrderItem.objects.get_or_create(
            purchase_order=po2,
            product=created_products[0],
            defaults={
                "quantity_ordered": 20,
                "quantity_received": 0,
                "unit_cost": Decimal("140.00")
            }
        )

        # 8. Completed & Active Customer Orders
        order1, _ = Order.objects.get_or_create(
            order_number="CP-2026-9042",
            defaults={
                "user": customer,
                "customer_name": "Sophia Chen",
                "customer_email": "customer@gmail.com",
                "customer_phone": "+1 (555) 012-7788",
                "status": OrderStatus.DELIVERED,
                "payment_status": PaymentStatus.PAID,
                "payment_method": PaymentMethod.STRIPE_CARD,
                "subtotal": Decimal("488.00"),
                "shipping_fee": Decimal("0.00"),
                "tax_amount": Decimal("39.04"),
                "total_amount": Decimal("527.04"),
                "tracking_number": "FX-889923419-US",
                "shipping_carrier": "FedEx Express Priority",
                "estimated_delivery": timezone.now().date() - timedelta(days=1),
                "created_at": timezone.now() - timedelta(days=6)
            }
        )
        ShippingAddress.objects.get_or_create(
            order=order1,
            defaults={
                "full_name": "Sophia Chen",
                "address_line1": "742 Evergreen Terrace",
                "city": "Springfield",
                "state": "OR",
                "postal_code": "97477",
                "country": "United States",
                "phone": "+1 (555) 012-7788"
            }
        )
        OrderItem.objects.get_or_create(
            order=order1,
            product=created_products[0],
            defaults={
                "product_name": created_products[0].name,
                "sku": created_products[0].sku,
                "unit_price": Decimal("299.00"),
                "quantity": 1,
                "subtotal": Decimal("299.00")
            }
        )
        OrderItem.objects.get_or_create(
            order=order1,
            product=created_products[3],
            defaults={
                "product_name": created_products[3].name,
                "sku": created_products[3].sku,
                "unit_price": Decimal("189.00"),
                "quantity": 1,
                "subtotal": Decimal("189.00")
            }
        )
        OrderTimeline.objects.get_or_create(
            order=order1,
            status=OrderStatus.CONFIRMED,
            defaults={"title": "Order Placed & Authorized", "description": "Customer order successfully charged via Stripe."}
        )
        OrderTimeline.objects.get_or_create(
            order=order1,
            status=OrderStatus.SHIPPED,
            defaults={"title": "Dispatched from Chicago Hub", "description": "Package handed over to FedEx carrier with tracking FX-889923419-US."}
        )
        OrderTimeline.objects.get_or_create(
            order=order1,
            status=OrderStatus.DELIVERED,
            defaults={"title": "Delivered to Front Door", "description": "Signed and safely delivered to resident."}
        )

        # Order 2 (In transit)
        order2, _ = Order.objects.get_or_create(
            order_number="CP-2026-9150",
            defaults={
                "user": customer,
                "customer_name": "Liam Gallagher",
                "customer_email": "liam.g@oasisdesign.io",
                "customer_phone": "+1 (555) 017-3312",
                "status": OrderStatus.SHIPPED,
                "payment_status": PaymentStatus.PAID,
                "payment_method": PaymentMethod.STRIPE_CARD,
                "subtotal": Decimal("449.00"),
                "shipping_fee": Decimal("0.00"),
                "tax_amount": Decimal("35.92"),
                "total_amount": Decimal("484.92"),
                "tracking_number": "UPS-1Z9999999999",
                "shipping_carrier": "UPS 2nd Day Air",
                "estimated_delivery": timezone.now().date() + timedelta(days=2),
                "created_at": timezone.now() - timedelta(days=1)
            }
        )
        ShippingAddress.objects.get_or_create(
            order=order2,
            defaults={
                "full_name": "Liam Gallagher",
                "address_line1": "450 Sutter St Suite 1200",
                "city": "San Francisco",
                "state": "CA",
                "postal_code": "94108",
                "country": "United States",
                "phone": "+1 (555) 017-3312"
            }
        )
        OrderItem.objects.get_or_create(
            order=order2,
            product=created_products[2],
            defaults={
                "product_name": created_products[2].name,
                "sku": created_products[2].sku,
                "unit_price": Decimal("449.00"),
                "quantity": 1,
                "subtotal": Decimal("449.00")
            }
        )
        OrderTimeline.objects.get_or_create(
            order=order2,
            status=OrderStatus.CONFIRMED,
            defaults={"title": "Order Confirmed", "description": "Payment approved."}
        )
        OrderTimeline.objects.get_or_create(
            order=order2,
            status=OrderStatus.SHIPPED,
            defaults={"title": "Shipped in Transit", "description": "Departed Long Beach hub via UPS."}
        )

        self.stdout.write(self.style.SUCCESS("[OK] Realistic demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("  - 8 Products with variants, images, stock & reviews"))
        self.stdout.write(self.style.SUCCESS("  - 2 Warehouses & 3 Suppliers"))
        self.stdout.write(self.style.SUCCESS("  - Low stock alerts configured on Vanguard Chrono & QuantumSync Dock"))
        self.stdout.write(self.style.SUCCESS("  - Active and delivered orders with timeline tracking"))
