import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Customer Components
import { CustomerNavbar } from './components/layout/CustomerNavbar';
import { CustomerFooter } from './components/layout/CustomerFooter';
import { CartDrawer } from './components/cart/CartDrawer';
import { AIChatbotWidget } from './components/ai/AIChatbotWidget';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderConfirmationPage } from './pages/customer/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/customer/OrderTrackingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// ERP Dashboard Layout & Pages
import { ERPLayout } from './components/layout/ERPLayout';
import { ERPDashboardOverview } from './pages/erp/ERPDashboardOverview';
import { ERPInventoryPage } from './pages/erp/ERPInventoryPage';
import { ERPStockMovementsPage } from './pages/erp/ERPStockMovementsPage';
import { ERPPurchaseOrdersPage } from './pages/erp/ERPPurchaseOrdersPage';
import { ERPCatalogManagerPage } from './pages/erp/ERPCatalogManagerPage';
import { ERPOrdersPage } from './pages/erp/ERPOrdersPage';
import { ERPSalesAnalyticsPage } from './pages/erp/ERPSalesAnalyticsPage';

const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <CustomerNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomerFooter />
      <CartDrawer />
      <AIChatbotWidget />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Customer Storefront Routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/track" element={<OrderTrackingPage />} />
              <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* ERP Enterprise Dashboard Routes */}
            <Route path="/erp" element={<ERPLayout />}>
              <Route index element={<ERPDashboardOverview />} />
              <Route path="inventory" element={<ERPInventoryPage />} />
              <Route path="movements" element={<ERPStockMovementsPage />} />
              <Route path="purchase-orders" element={<ERPPurchaseOrdersPage />} />
              <Route path="catalog" element={<ERPCatalogManagerPage />} />
              <Route path="orders" element={<ERPOrdersPage />} />
              <Route path="analytics" element={<ERPSalesAnalyticsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
