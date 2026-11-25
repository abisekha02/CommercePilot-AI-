import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowLeftRight, Truck,
  Tags, ShoppingCart, BarChart3, ShieldCheck,
  ChevronRight, ExternalLink, LogOut, Sparkles, Menu, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ERPLayout: React.FC = () => {
  const { user, isStaff, isAdmin, demoLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Executive Overview', path: '/erp', icon: LayoutDashboard },
    { label: 'Inventory & Stock', path: '/erp/inventory', icon: Package },
    { label: 'Stock Movement Ledger', path: '/erp/movements', icon: ArrowLeftRight },
    { label: 'Suppliers & POs', path: '/erp/purchase-orders', icon: Truck },
    { label: 'Catalog Manager', path: '/erp/catalog', icon: Tags },
    { label: 'Orders & Fulfillment', path: '/erp/orders', icon: ShoppingCart },
    { label: 'Sales & Analytics', path: '/erp/analytics', icon: BarChart3 },
  ];

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center text-white">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">ERP Access Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            The ERP Backoffice Dashboard requires staff privileges (Administrator, Store Manager, or Warehouse Staff).
          </p>
          <div className="space-y-2 mb-6">
            <button
              onClick={() => demoLogin('admin')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              Sign in as Administrator (Full Access)
            </button>
            <button
              onClick={() => demoLogin('manager')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              Sign in as Store Manager
            </button>
            <button
              onClick={() => demoLogin('warehouse')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
            >
              Sign in as Warehouse Staff
            </button>
          </div>
          <Link to="/" className="text-xs text-indigo-400 hover:underline">
            &larr; Return to Customer Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/erp" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">CommercePilot</span>
              <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.2 rounded ml-1 font-semibold border border-indigo-700">ERP</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 mb-2 tracking-wider">
            Enterprise Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Storefront Link */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs mb-3 font-medium transition"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Customer Storefront</span>
            </span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <div>
              <p className="font-semibold text-white truncate max-w-[130px]">{user?.first_name || user?.username}</p>
              <p className="text-[10px] text-indigo-400 font-medium capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 cursor-pointer transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>ERP Hub</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800 capitalize">
                {location.pathname.replace('/erp', '').replace('/', '') || 'Overview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync Active
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              Role: {user?.role}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
