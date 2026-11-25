import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, Truck, CheckCircle2, Clock, 
  Package, MapPin, AlertCircle, ArrowRight 
} from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';

export const OrderTrackingPage: React.FC = () => {
  const { orderNumber: paramOrderNum } = useParams<{ orderNumber: string }>();
  const [inputNum, setInputNum] = useState(paramOrderNum || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTrack = async (numToTrack: string) => {
    if (!numToTrack.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.trackOrder(numToTrack.trim());
      setOrder(data);
    } catch {
      setError(`No active order found with reference "${numToTrack}". Please verify the order number.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramOrderNum) {
      handleTrack(paramOrderNum);
    }
  }, [paramOrderNum]);

  const steps = [
    { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Payment approved & registered' },
    { key: 'PROCESSING', label: 'Warehouse Processing', desc: 'Picked and packed at distribution hub' },
    { key: 'SHIPPED', label: 'In Transit', desc: 'Dispatched with logistics carrier' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Safely arrived at destination' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 1;
    }
  };

  const activeIndex = order ? getStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Tracking & Live Status</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your package journey from central distribution to your doorstep in real time
        </p>
      </div>

      {/* Search Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleTrack(inputNum); }}
        className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Enter your Order Reference (e.g. CP-2026-9042)"
            value={inputNum}
            onChange={(e) => setInputNum(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
        >
          {loading ? 'Locating...' : 'Track Package'}
        </button>
      </form>

      {/* Demo helper */}
      {!order && !loading && (
        <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <span>Tip: Try testing with seeded orders:</span>
          <div className="flex gap-2">
            <button
              onClick={() => { setInputNum('CP-2026-9042'); handleTrack('CP-2026-9042'); }}
              className="font-mono text-indigo-600 hover:underline cursor-pointer"
            >
              CP-2026-9042 (Delivered)
            </button>
            <span>•</span>
            <button
              onClick={() => { setInputNum('CP-2026-9150'); handleTrack('CP-2026-9150'); }}
              className="font-mono text-indigo-600 hover:underline cursor-pointer"
            >
              CP-2026-9150 (Shipped)
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Order Reference</span>
                <h2 className="text-xl font-bold text-slate-900 font-mono">{order.order_number}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-3 py-1 rounded-full capitalize">
                  {order.status_display}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-3 py-1 rounded-full">
                  {order.payment_status_display}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Carrier</span>
                <span className="font-semibold text-slate-800">{order.shipping_carrier || 'FedEx Priority'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tracking Number</span>
                <span className="font-semibold text-slate-800 font-mono">{order.tracking_number || 'Pending Dispatch'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Expected Arrival</span>
                <span className="font-semibold text-slate-800">{order.estimated_delivery || '3 Business Days'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Value</span>
                <span className="font-semibold text-slate-800">${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-6">Delivery Progress</h3>
            
            <div className="relative flex flex-col md:flex-row justify-between gap-4">
              {steps.map((st, idx) => {
                const isPassed = activeIndex >= idx + 1;
                const isCurrent = activeIndex === idx + 1;
                return (
                  <div key={st.key} className="flex-1 flex md:flex-col items-center md:items-center text-left md:text-center gap-3 relative">
                    {/* Circle icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold ${isPassed || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                        {st.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Timeline Events */}
          {order.timeline && order.timeline.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Milestone Activity Log</h3>
              <div className="space-y-4">
                {order.timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{event.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(event.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordered Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Package Contents</h3>
              <div className="divide-y divide-slate-100 text-xs">
                {order.items.map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{it.product_name}</p>
                      <p className="text-[11px] text-slate-400">SKU: {it.sku} • Qty: {it.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-800">${Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
