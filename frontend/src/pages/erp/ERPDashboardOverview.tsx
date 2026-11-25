import React, { useEffect, useState } from 'react';
import { 
  DollarSign, ShoppingCart, Package, AlertTriangle, 
  Sparkles, TrendingUp, ArrowUpRight, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { ordersApi, inventoryApi, aiApi } from '../../services/api';
import { SalesAnalytics, InventoryAnalytics, AIInventorySummaryResult } from '../../types';
import { Link } from 'react-router-dom';

export const ERPDashboardOverview: React.FC = () => {
  const [salesStats, setSalesStats] = useState<SalesAnalytics | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryAnalytics | null>(null);
  const [aiSummary, setAiSummary] = useState<AIInventorySummaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingAI, setRefreshingAI] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sales, inv, ai] = await Promise.all([
        ordersApi.getSalesAnalytics(),
        inventoryApi.getInventoryAnalytics(),
        aiApi.getInventorySummary()
      ]);
      setSalesStats(sales);
      setInventoryStats(inv);
      setAiSummary(ai);
    } catch (err) {
      console.error('Failed to load ERP metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshAI = async () => {
    setRefreshingAI(true);
    try {
      const ai = await aiApi.getInventorySummary();
      setAiSummary(ai);
    } finally {
      setRefreshingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Aggregating enterprise telemetry & AI insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive ERP Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time warehouse stock valuation, order velocity, and autonomous AI inventory monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ${(salesStats?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>${(salesStats?.recent_30d_revenue || 0).toFixed(2)} in past 30 days</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Processed Orders</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {salesStats?.total_orders_count || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Avg Order: <strong>${salesStats?.average_order_value || 0}</strong>
          </div>
        </div>

        {/* Inventory On Hand */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory On Hand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {inventoryStats?.total_units_on_hand || 0} units
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {inventoryStats?.total_skus || 0} tracked warehouse SKUs
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stockout Risks</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {inventoryStats?.low_stock_count || 0} Critical SKUs
          </div>
          <Link to="/erp/inventory?low_stock=true" className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline font-semibold">
            <span>View Reorder Queue</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {/* AI Executive Inventory & Sales Assessment */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Autonomous AI Inventory Health & Velocity Diagnostic</h3>
              <p className="text-xs text-indigo-200">Continuous machine learning evaluation of stockout risks and slow-moving capital</p>
            </div>
          </div>
          <button
            onClick={handleRefreshAI}
            disabled={refreshingAI}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingAI ? 'animate-spin' : ''}`} />
            <span>Re-Analyze Health</span>
          </button>
        </div>

        {aiSummary && (
          <div className="space-y-5 text-xs text-slate-300">
            <p className="whitespace-pre-line leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 font-sans text-slate-200">
              {aiSummary.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Critical Low Stock */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Critical Reorder Triggers ({aiSummary.critical_low_stock.length})</span>
                </h4>
                <div className="space-y-2">
                  {aiSummary.critical_low_stock.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg">
                      <div>
                        <p className="font-bold text-white text-xs">{item.product}</p>
                        <p className="text-[10px] text-slate-400">SKU: {item.sku} • {item.quantity} units remaining</p>
                      </div>
                      <Link
                        to="/erp/purchase-orders"
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold px-2 py-1 rounded transition"
                      >
                        Draft PO
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slow Moving Capital */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5 text-blue-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Slow-Moving Inventory Recommendations</span>
                </h4>
                <div className="space-y-2">
                  {aiSummary.slow_moving_stock.map((item, idx) => (
                    <div key={idx} className="bg-black/20 p-2.5 rounded-lg">
                      <div className="flex justify-between text-xs font-semibold text-white">
                        <span>{item.product}</span>
                        <span className="text-slate-400">{item.quantity} in stock</span>
                      </div>
                      <p className="text-[10px] text-indigo-300 mt-1 italic">
                        Action: {item.recommendation}
                      </p>
                    </div>
                  ))}
                  {aiSummary.slow_moving_stock.length === 0 && (
                    <p className="text-slate-400 text-xs">All inventory lines currently moving within target velocity windows.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Columns: Recent Stock Movements & Top Selling Gear */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Audit Movements */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Inventory Audit Ledger</h3>
            <Link to="/erp/movements" className="text-xs text-indigo-600 hover:underline font-semibold">
              Full Ledger &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {inventoryStats?.recent_movements?.slice(0, 5).map((mv) => (
              <div key={mv.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{mv.product_name}</p>
                  <p className="text-[10px] text-slate-400">
                    {mv.movement_type_display} • {mv.warehouse_code} • by {mv.performed_by_name || 'System'}
                  </p>
                </div>
                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                  mv.quantity_change > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {mv.quantity_change > 0 ? `+${mv.quantity_change}` : mv.quantity_change}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Top Revenue Generators</h3>
            <Link to="/erp/analytics" className="text-xs text-indigo-600 hover:underline font-semibold">
              Sales Reports &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {salesStats?.top_products?.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{p.product_name}</p>
                  <p className="text-[10px] text-slate-400">{p.total_sold} units fulfilled</p>
                </div>
                <span className="font-bold text-slate-900">
                  ${Number(p.total_sales).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
