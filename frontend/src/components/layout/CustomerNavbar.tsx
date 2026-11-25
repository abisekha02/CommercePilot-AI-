import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Search, Sparkles, User as UserIcon, 
  LayoutDashboard, LogOut, ChevronDown, ShieldCheck, 
  Truck, Menu, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const CustomerNavbar: React.FC = () => {
  const { user, isAuthenticated, isStaff, logout, demoLogin } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickRole = async (role: 'admin' | 'manager' | 'warehouse' | 'customer') => {
    await demoLogin(role);
    setDemoMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>CommercePilot AI Enterprise Platform</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-400">Free shipping on orders over $50</span>
          </div>

          {/* Quick Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Demo Role: <strong className="text-white capitalize">{user?.role ? user.role.toLowerCase().replace('_', ' ') : 'Customer'}</strong></span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {demoMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800">
                <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Demo Account
                </div>
                <button
                  onClick={() => handleQuickRole('admin')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-800">Administrator</span>
                  <span className="text-xs bg-brand-100 text-brand-700 font-bold px-1.5 py-0.5 rounded">Full ERP</span>
                </button>
                <button
                  onClick={() => handleQuickRole('manager')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-800">Store Manager</span>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Catalog/Orders</span>
                </button>
                <button
                  onClick={() => handleQuickRole('warehouse')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-800">Warehouse Staff</span>
                  <span className="text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Stock/PO</span>
                </button>
                <button
                  onClick={() => handleQuickRole('customer')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 flex items-center justify-between"
                >
                  <span className="font-medium text-slate-800">Customer</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Shopper</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CommercePilot</span>
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">AI</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, brands, tech gear..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </form>

          {/* Navigation Links & Actions */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/catalog" className="hover:text-brand-600 transition">Catalog</Link>
            <Link to="/track" className="hover:text-brand-600 transition flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-slate-400" />
              <span>Track Order</span>
            </Link>

            {/* ERP Dashboard link for Staff */}
            {isStaff && (
              <Link
                to="/erp"
                className="flex items-center gap-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 font-semibold transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>ERP Dashboard</span>
              </Link>
            )}
          </div>

          {/* User & Cart CTA */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={openDrawer}
              className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Auth Dropdown / Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user?.first_name || user?.username}</span>
                  <span className="text-xs text-slate-400 capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            <Link to="/catalog" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 py-1.5 font-medium">Product Catalog</Link>
            <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="text-slate-700 py-1.5 font-medium">Track Order</Link>
            {isStaff && (
              <Link to="/erp" onClick={() => setMobileMenuOpen(false)} className="text-brand-600 font-semibold py-1.5">
                ERP Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
