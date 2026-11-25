import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { isDrawerOpen, closeDrawer, cart, updateQuantity, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);
  const progressPercent = Math.min(100, (totalPrice / freeShippingThreshold) * 100);

  const handleProceedCheckout = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-900">Your Cart ({cart?.items?.length || 0})</h2>
            </div>
            <button
              onClick={closeDrawer}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="bg-brand-50/70 border-b border-brand-100 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-900 mb-1.5">
              <Truck className="w-4 h-4 text-brand-600 shrink-0" />
              {remainingForFreeShipping > 0 ? (
                <span>Add <strong>${remainingForFreeShipping.toFixed(2)}</strong> more to unlock <strong>Free Shipping!</strong></span>
              ) : (
                <span className="text-emerald-700 font-bold">You qualify for Free Express Shipping!</span>
              )}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${remainingForFreeShipping === 0 ? 'bg-emerald-500' : 'bg-brand-600'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {!cart || cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">Looks like you haven't added any products to your shopping bag yet.</p>
                <button
                  onClick={() => { closeDrawer(); navigate('/catalog'); }}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-white shadow-xs">
                  {/* Thumbnail */}
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                    alt={item.product_name}
                    className="w-18 h-18 rounded-lg object-cover bg-slate-100 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{item.product_name}</h4>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.variant_name && (
                        <p className="text-xs text-slate-500 font-medium">{item.variant_name}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-bold text-slate-900">${Number(item.unit_price).toFixed(2)}</span>
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer transition rounded-l-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer transition rounded-r-lg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Totals & Checkout */}
          {cart && cart.items.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-5 bg-slate-50">
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Shipping</span>
                  <span className="font-medium text-slate-800">
                    {remainingForFreeShipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : '$9.99'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span>${(totalPrice + (remainingForFreeShipping === 0 ? 0 : 9.99)).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedCheckout}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-brand-200 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
