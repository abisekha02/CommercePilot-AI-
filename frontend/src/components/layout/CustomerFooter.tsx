import React from 'react';
import { Sparkles, Shield, Truck, RotateCcw, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      {/* Value Proposition Grid */}
      <div className="border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Free Express Shipping</h4>
              <p className="text-xs text-slate-400">On all continental orders over $50</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">30-Day Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400">Instant return slip via your dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">1-Year Warranty</h4>
              <p className="text-xs text-slate-400">100% genuine guaranteed items</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">24/7 PilotBot AI Support</h4>
              <p className="text-xs text-slate-400">Live catalog grounding & instant help</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>CommercePilot AI</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Next-generation full-stack e-commerce & ERP inventory management system engineered with Django REST, React TypeScript, PostgreSQL, and autonomous AI agents.
          </p>
          <div className="text-xs text-slate-500">
            Current release: v1.0 Enterprise Production
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Explore Catalog</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/catalog?category=audio-acoustics" className="hover:text-white transition">Audio & Acoustics</Link></li>
            <li><Link to="/catalog?category=computing-laptops" className="hover:text-white transition">Computing & Laptops</Link></li>
            <li><Link to="/catalog?category=smart-wearables" className="hover:text-white transition">Smart Wearables</Link></li>
            <li><Link to="/catalog?category=workspace-ergonomics" className="hover:text-white transition">Workspace Gear</Link></li>
            <li><Link to="/catalog?category=smart-ambient-lighting" className="hover:text-white transition">Ambient Smart Lighting</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Customer Services</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/track" className="hover:text-white transition">Track Live Order</Link></li>
            <li><Link to="/login" className="hover:text-white transition">Account Login</Link></li>
            <li><Link to="/catalog" className="hover:text-white transition">Shipping Policy ($50+ Free)</Link></li>
            <li><span className="text-slate-400">30-Day Money-Back Guarantee</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">ERP & Architecture</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/erp" className="text-indigo-400 hover:text-indigo-300 font-medium transition">Staff ERP Dashboard &rarr;</Link></li>
            <li><a href="/api/docs/" target="_blank" rel="noreferrer" className="hover:text-white transition">OpenAPI Swagger UI</a></li>
            <li><a href="/api/schema/" target="_blank" rel="noreferrer" className="hover:text-white transition">Raw OpenAPI Schema</a></li>
            <li><span className="text-slate-500">PostgreSQL + Django 5 + React 19</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} CommercePilot AI Inc. All business workflows, database migrations, and AI agents active.
      </div>
    </footer>
  );
};
