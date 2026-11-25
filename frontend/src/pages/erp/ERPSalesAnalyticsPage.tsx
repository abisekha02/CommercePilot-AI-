import React, { useEffect, useState } from 'react';
import { 
  BarChart3, DollarSign, ShoppingCart, TrendingUp, 
  Download, RefreshCw, Layers, PieChart 
} from 'lucide-react';
import { ordersApi } from '../../services/api';
import { SalesAnalytics } from '../../types';

export const ERPSalesAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getSalesAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load sales analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Gross Revenue', `$${analytics.total_revenue}`],
      ['Past 30 Days Revenue', `$${analytics.recent_30d_revenue}`],
      ['Total Orders Count', analytics.total_orders_count],
      ['Average Order Value', `$${analytics.average_order_value}`],
      [],
      ['Top Product', 'Units Sold', 'Total Sales Revenue'],
      ...analytics.top_products.map(p => [p.product_name, p.total_sold, `$${p.total_sales}`])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CommercePilot_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-xs">Computing revenue metrics and order turnover...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales & Revenue Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated business KPIs, average basket sizing, and product sales distributions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={fetchAnalytics}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Lifetime Sales
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            ${(analytics?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            Net delivered & confirmed orders
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Last 30 Days Velocity
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            ${(analytics?.recent_30d_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {analytics?.recent_30d_orders_count || 0} recent shipments
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Order Volume
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics?.total_orders_count || 0}
          </div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
            Total transactions processed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Average Order Value (AOV)
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            ${analytics?.average_order_value || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Basket size per customer checkout
          </span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Top Velocity Revenue Leaders</h3>
            <span className="text-xs text-slate-400">By quantity sold</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Product Title</th>
                  <th className="py-2.5 text-center">Units Sold</th>
                  <th className="py-2.5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {analytics?.top_products?.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-900">{prod.product_name}</td>
                    <td className="py-3 text-center font-bold text-indigo-600">{prod.total_sold} units</td>
                    <td className="py-3 text-right font-extrabold text-slate-900">
                      ${Number(prod.total_sales).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4">Fulfillment Status Breakdown</h3>
            <div className="space-y-3 text-xs">
              {analytics?.status_breakdown?.map((st, idx) => {
                const total = analytics.total_orders_count || 1;
                const pct = Math.round((st.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 capitalize">{st.status.toLowerCase().replace('_', ' ')}</span>
                      <span className="text-slate-900">{st.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          st.status === 'DELIVERED' ? 'bg-emerald-500' : st.status === 'SHIPPED' ? 'bg-blue-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-6 text-xs text-slate-400">
            Data aggregated across production transactions and warehouse audit movements.
          </div>
        </div>

      </div>
    </div>
  );
};
