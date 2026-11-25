import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, Check, Lock, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    address_line1: user?.address || '742 Evergreen Terrace',
    address_line2: '',
    city: user?.city || 'Springfield',
    state: 'OR',
    postal_code: user?.postal_code || '97477',
    country: user?.country || 'United States',
    payment_method: 'STRIPE_CARD',
    card_number: '4242 •••• •••• 4242',
    exp_month: '12',
    exp_year: '28',
    cvc: '123',
    notes: 'Please leave at front doorstep.',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Your shopping bag is empty</h2>
        <p className="text-xs text-slate-500 mb-6">Add items from the catalog before proceeding to checkout.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-brand-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl"
        >
          Explore Catalog
        </button>
      </div>
    );
  }

  const shippingFee = totalPrice > 50 ? 0 : 9.99;
  const taxAmount = totalPrice * 0.08;
  const grandTotal = totalPrice + shippingFee + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const order = await ordersApi.checkout(formData);
      await clearCart();
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete order checkout. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Express Checkout</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your purchase with encrypted transaction authorization and instant warehouse routing
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Form: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Shipping Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>1. Shipping Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">State / Province</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>2. Payment Details</span>
              </h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>256-Bit SSL Encrypted</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'STRIPE_CARD' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.payment_method === 'STRIPE_CARD'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-semibold">Credit Card</span>
                <span className="text-xs text-slate-500">Stripe / Visa / MC</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'CASH_ON_DELIVERY' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.payment_method === 'CASH_ON_DELIVERY'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-semibold">Cash on Delivery</span>
                <span className="text-xs text-slate-500">Pay on arrival</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'BANK_TRANSFER' })}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  formData.payment_method === 'BANK_TRANSFER'
                    ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-semibold">Bank Wire</span>
                <span className="text-xs text-slate-500">Direct transfer</span>
              </button>
            </div>

            {formData.payment_method === 'STRIPE_CARD' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Card Number (Simulated Approval)</label>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Exp Month</label>
                    <input
                      type="text"
                      value={formData.exp_month}
                      onChange={(e) => setFormData({ ...formData, exp_month: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Exp Year</label>
                    <input
                      type="text"
                      value={formData.exp_year}
                      onChange={(e) => setFormData({ ...formData, exp_year: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">CVC</label>
                    <input
                      type="text"
                      value={formData.cvc}
                      onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5 sticky top-24">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Order Summary ({cart.items.length} items)
            </h2>

            {/* Items scroll */}
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 space-y-2">
              {cart.items.map((it) => (
                <div key={it.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={it.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'}
                      alt={it.product_name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-semibold text-slate-900 truncate">{it.product_name}</p>
                      <p className="text-xs text-slate-500">Qty: {it.quantity} {it.variant_name ? `• ${it.variant_name}` : ''}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">${Number(it.line_total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 pt-4 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (8%)</span>
                <span className="font-semibold text-slate-800">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Express Shipping</span>
                <span className="font-semibold text-slate-800">
                  {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                <span>Total Due</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 text-sm transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Authorizing & Allocating Inventory...' : `Authorize & Place Order ($${grandTotal.toFixed(2)})`}</span>
            </button>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              By placing this order, inventory is deducted atomically from the distribution warehouse and an audit movement log is created.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
};
