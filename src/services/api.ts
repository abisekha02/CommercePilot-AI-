import axios from 'axios';
import {
  User, Product, Category, Cart, Order,
  Warehouse, Supplier, StockItem, StockMovement,
  PurchaseOrder, InventoryAnalytics, SalesAnalytics,
  AIDescriptionResult, AIInventorySummaryResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Guest session ID helper
const getSessionId = () => {
  let sessionId = localStorage.getItem('commercepilot_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('commercepilot_session_id', sessionId);
  }
  return sessionId;
};

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token and Session ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('commercepilot_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Session-ID'] = getSessionId();
  return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid/expired
      const refreshToken = localStorage.getItem('commercepilot_refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh: refreshToken });
          localStorage.setItem('commercepilot_access_token', res.data.access);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('commercepilot_access_token');
          localStorage.removeItem('commercepilot_refresh_token');
          localStorage.removeItem('commercepilot_user');
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post('/auth/login/', credentials);
    return res.data;
  },
  register: async (userData: any) => {
    const res = await api.post('/auth/register/', userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get<User>('/profile/');
    return res.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const res = await api.patch<User>('/profile/', data);
    return res.data;
  },
  getStaff: async () => {
    const res = await api.get('/staff/');
    return res.data;
  },
};

export const productsApi = {
  getProducts: async (params?: { category?: string; search?: string; min_price?: number; max_price?: number; featured?: boolean; ordering?: string }) => {
    const res = await api.get<{ count: number; results: Product[] }>('/products/', { params });
    return res.data;
  },
  getProductBySlug: async (slug: string) => {
    const res = await api.get<Product>(`/products/${slug}/`);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<{ count: number; results: Category[] } | Category[]>('/categories/');
    const data = res.data as any;
    return Array.isArray(data) ? data : data.results || [];
  },
  getFeaturedProducts: async () => {
    const res = await api.get<Product[]>('/products/featured/');
    return res.data;
  },
  getRelatedProducts: async (slug: string) => {
    const res = await api.get<Product[]>(`/products/${slug}/related/`);
    return res.data;
  },
  addReview: async (slug: string, review: { rating: number; title: string; comment: string }) => {
    const res = await api.post(`/products/${slug}/reviews/`, review);
    return res.data;
  },
  createProduct: async (productData: any) => {
    const res = await api.post<Product>('/products/', productData);
    return res.data;
  },
  updateProduct: async (slug: string, productData: any) => {
    const res = await api.patch<Product>(`/products/${slug}/`, productData);
    return res.data;
  },
};

export const cartApi = {
  getCart: async () => {
    const res = await api.get<Cart>('/cart/');
    return res.data;
  },
  addItem: async (item: { product_id: number; variant_id?: number | null; quantity: number }) => {
    const res = await api.post<Cart>('/cart/items/', item);
    return res.data;
  },
  updateItem: async (itemId: number, quantity: number) => {
    const res = await api.patch<Cart>(`/cart/items/${itemId}/`, { quantity });
    return res.data;
  },
  removeItem: async (itemId: number) => {
    const res = await api.delete<Cart>(`/cart/items/${itemId}/`);
    return res.data;
  },
  clearCart: async () => {
    const res = await api.delete('/cart/');
    return res.data;
  },
};

export const ordersApi = {
  checkout: async (data: any) => {
    const res = await api.post<Order>('/checkout/', data);
    return res.data;
  },
  getOrders: async (params?: { status?: string }) => {
    const res = await api.get<{ count: number; results: Order[] }>('/orders/', { params });
    return res.data;
  },
  getOrderById: async (id: number | string) => {
    const res = await api.get<Order>(`/orders/${id}/`);
    return res.data;
  },
  trackOrder: async (orderNumber: string) => {
    const res = await api.get<Order>(`/orders/track/${orderNumber}/`);
    return res.data;
  },
  updateOrderStatus: async (id: number, data: { status: string; tracking_number?: string; notes?: string }) => {
    const res = await api.patch<Order>(`/orders/${id}/update_status/`, data);
    return res.data;
  },
  getSalesAnalytics: async () => {
    const res = await api.get<SalesAnalytics>('/sales/analytics/');
    return res.data;
  },
};

export const inventoryApi = {
  getStock: async (params?: { warehouse?: number; low_stock?: boolean }) => {
    const res = await api.get<{ count: number; results: StockItem[] }>('/stock/', { params });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get<StockItem[]>('/stock/low_stock/');
    return res.data;
  },
  adjustStock: async (stockItemId: number, data: { quantity_change: number; movement_type: string; reference_number?: string; notes?: string }) => {
    const res = await api.post(`/stock/${stockItemId}/adjust_stock/`, data);
    return res.data;
  },
  getMovements: async (params?: { type?: string }) => {
    const res = await api.get<{ count: number; results: StockMovement[] }>('/movements/', { params });
    return res.data;
  },
  getWarehouses: async () => {
    const res = await api.get<{ count: number; results: Warehouse[] } | Warehouse[]>('/warehouses/');
    const data = res.data as any;
    return Array.isArray(data) ? data : data.results || [];
  },
  getSuppliers: async () => {
    const res = await api.get<{ count: number; results: Supplier[] } | Supplier[]>('/suppliers/');
    const data = res.data as any;
    return Array.isArray(data) ? data : data.results || [];
  },
  getPurchaseOrders: async () => {
    const res = await api.get<{ count: number; results: PurchaseOrder[] }>('/purchase-orders/');
    return res.data;
  },
  createPurchaseOrder: async (data: any) => {
    const res = await api.post<PurchaseOrder>('/purchase-orders/', data);
    return res.data;
  },
  receivePOItems: async (poId: number, data?: { items?: { item_id: number; received_quantity: number }[] }) => {
    const res = await api.post(`/purchase-orders/${poId}/receive_items/`, data || {});
    return res.data;
  },
  getInventoryAnalytics: async () => {
    const res = await api.get<InventoryAnalytics>('/inventory/analytics/');
    return res.data;
  },
};

export const aiApi = {
  generateDescription: async (payload: { title: string; category?: string; features?: string[]; tone?: string; audience?: string }) => {
    const res = await api.post<AIDescriptionResult>('/ai/generate-description/', payload);
    return res.data;
  },
  getRecommendations: async (payload?: { product_id?: number; category_slug?: string; limit?: number }) => {
    const res = await api.post<{ recommendations: Product[]; engine: string }>('/ai/recommendations/', payload || {});
    return res.data;
  },
  chatWithBot: async (payload: { message: string; history?: any[] }) => {
    const res = await api.post<{ reply: string; provider: string; suggested_products?: Product[] }>('/ai/chat/', payload);
    return res.data;
  },
  getInventorySummary: async () => {
    const res = await api.get<AIInventorySummaryResult>('/ai/inventory-summary/');
    return res.data;
  },
};

export default api;
