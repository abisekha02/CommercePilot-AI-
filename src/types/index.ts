export type UserRole = 'ADMIN' | 'STORE_MANAGER' | 'WAREHOUSE_STAFF' | 'CUSTOMER';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count?: number;
}

export interface ProductVariant {
  id: number;
  product?: number;
  name: string;
  sku: string;
  additional_price: string | number;
  final_price: string | number;
  stock_quantity: number;
  attributes?: Record<string, any>;
  is_active: boolean;
}

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductReview {
  id: number;
  product: number;
  username: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  brand: string;
  category?: Category | number;
  category_name?: string;
  category_slug?: string;
  base_price: string | number;
  cost_price?: string | number;
  description: string;
  ai_description?: string;
  is_active: boolean;
  featured: boolean;
  tags?: string[];
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  average_rating: number;
  review_count: number;
  total_stock: number;
  created_at?: string;
  ai_recommendation_reason?: string;
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_image?: string;
  variant?: number | null;
  variant_name?: string | null;
  quantity: number;
  unit_price: string | number;
  line_total: string | number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_price: string | number;
  item_count: number;
}

export interface OrderItem {
  id: number;
  product?: number;
  variant?: number | null;
  product_name: string;
  sku: string;
  unit_price: string | number;
  quantity: number;
  subtotal: string | number;
}

export interface ShippingAddress {
  id?: number;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderTimeline {
  id: number;
  status: string;
  title: string;
  description: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  status_display: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_status_display: string;
  payment_method: string;
  subtotal: string | number;
  shipping_fee: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery?: string;
  notes?: string;
  items?: OrderItem[];
  items_count?: number;
  shipping_address?: ShippingAddress;
  timeline?: OrderTimeline[];
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  location: string;
  is_primary: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  lead_time_days: number;
  rating: string | number;
  purchase_order_count?: number;
}

export interface StockItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  variant?: number | null;
  variant_name?: string | null;
  variant_sku?: string | null;
  warehouse: number;
  warehouse_name: string;
  warehouse_code: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  min_stock_threshold: number;
  reorder_quantity: number;
  is_low_stock: boolean;
  unit_cost: string | number;
  unit_price: string | number;
  last_restocked_at?: string;
}

export interface StockMovement {
  id: number;
  stock_item: number;
  product_name: string;
  warehouse_code: string;
  movement_type: string;
  movement_type_display: string;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reference_number: string;
  notes: string;
  performed_by_name: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id?: number;
  product: number;
  product_name?: string;
  variant?: number | null;
  variant_name?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: string | number;
  line_total?: string | number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  warehouse?: number;
  warehouse_name?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  order_date: string;
  expected_delivery_date?: string;
  total_cost: string | number;
  notes?: string;
  created_by_name?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
}

export interface InventoryAnalytics {
  total_skus: number;
  total_units_on_hand: number;
  low_stock_count: number;
  total_inventory_cost_value: number;
  total_inventory_retail_value: number;
  pending_purchase_orders: number;
  recent_movements: StockMovement[];
}

export interface SalesAnalytics {
  total_revenue: number;
  recent_30d_revenue: number;
  total_orders_count: number;
  recent_30d_orders_count: number;
  average_order_value: number;
  status_breakdown: { status: string; count: number }[];
  top_products: { product_name: string; total_sold: number; total_sales: string | number }[];
}

export interface AIDescriptionResult {
  tagline: string;
  description: string;
  bullet_points: string[];
  seo_meta_description: string;
  tags: string[];
  provider?: string;
}

export interface AIInventorySummaryResult {
  summary: string;
  critical_low_stock: { product: string; sku: string; quantity: number; threshold: number; action: string }[];
  slow_moving_stock: { product: string; sku: string; quantity: number; sold_recent: number; days_dormant: number; recommendation: string }[];
  healthy_sku_count: number;
}
