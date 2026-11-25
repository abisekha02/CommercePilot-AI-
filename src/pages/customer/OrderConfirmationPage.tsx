import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Truck, Package, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      ordersApi.trackOrder(orderNumber).then(setOrder).catch(console.error);
    }
  }, [orderNumber]);

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order Confirmed!</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Thank you for choosing CommercePilot. Your payment has been authorized, and items are now reserved and routing for fulfillment.
      </p>

      {/* Order Badge Box */}
      <div className="my-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-lg mx-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Order Reference</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">{orderNumber}</span>
              <button
                onClick={copyOrderNumber}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                title="Copy order number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
            Paid & Confirmed
          </span>
        </div>

        <div className="pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Estimated Delivery</span>
            <span className="font-semibold text-slate-800">
              {order?.estimated_delivery || 'Within 3-4 Business Days'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Shipping Carrier</span>
            <span className="font-semibold text-slate-800">{order?.shipping_carrier || 'FedEx Express'}</span>
          </div>
        </div>

        {order?.shipping_address && (
          <div className="pt-4 mt-4 border-t border-slate-200 text-xs">
            <span className="text-slate-400 block mb-1">Delivering to:</span>
            <p className="font-medium text-slate-700">
              {order.shipping_address.full_name}<br />
              {order.shipping_address.address_line1}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={`/track/${orderNumber}`}
          className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md shadow-brand-200 flex items-center justify-center gap-2 transition"
        >
          <Truck className="w-4 h-4" />
          <span>Track Live Order Status</span>
        </Link>
        <Link
          to="/catalog"
          className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-6 py-3 rounded-xl transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};
