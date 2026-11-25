import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, Filter, RefreshCw, X, 
  CheckCircle2, Clock, Truck, RotateCcw, AlertCircle 
} from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';

export const ERPOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('PROCESSING');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await ordersApi.getOrders(params);
      setOrders(res.results || res || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await ordersApi.updateOrderStatus(selectedOrder.id, {
        status: newStatus,
        tracking_number: trackingNumber,
        notes: notes || `Order status updated to ${newStatus}`
      });
      setSelectedOrder(null);
      setTrackingNumber('');
      setNotes('');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Fulfillment & Dispatch</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer orders, assign shipping carrier tracking, and execute returns/refunds
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-600">Filter Order Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="">All Orders</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing / Packing</option>
            <option value="SHIPPED">Shipped & In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {orders.length} orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order Reference</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Placed Date</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                <th className="py-3.5 px-4">Tracking Code</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading customer fulfillment queue...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders matching status filter.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{o.customer_name}</div>
                      <div className="text-[10px] text-slate-400">{o.customer_email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {o.items_count || 1}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ${Number(o.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {o.payment_status_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'SHIPPED'
                          ? 'bg-blue-100 text-blue-800'
                          : o.status === 'PROCESSING'
                          ? 'bg-amber-100 text-amber-800'
                          : o.status === 'REFUNDED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        <span>{o.status_display}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {o.tracking_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setNewStatus(o.status === 'CONFIRMED' ? 'PROCESSING' : o.status === 'PROCESSING' ? 'SHIPPED' : 'DELIVERED');
                          setTrackingNumber(o.tracking_number || `FX-${Math.floor(100000000 + Math.random() * 900000000)}-US`);
                        }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Update Order Status</h3>
                <p className="text-[11px] text-slate-500">Order {selectedOrder.order_number} • {selectedOrder.customer_name}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">New Fulfillment State</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="PROCESSING">Processing / Picking & Packing</option>
                  <option value="SHIPPED">Shipped & Handed to Carrier</option>
                  <option value="DELIVERED">Delivered to Customer</option>
                  <option value="REFUNDED">Refund Authorized (Return)</option>
                  <option value="CANCELLED">Order Cancelled</option>
                </select>
              </div>

              {(newStatus === 'SHIPPED' || selectedOrder.tracking_number) && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Carrier Tracking Code</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. FX-992384112-US"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Timeline Milestone Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched from Chicago Hub via FedEx Ground"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  {updating ? 'Updating...' : 'Publish Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
