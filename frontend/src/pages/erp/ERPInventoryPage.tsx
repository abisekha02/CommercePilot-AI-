import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Package, AlertTriangle, ArrowUpDown, Filter, 
  Plus, Minus, RefreshCw, X, CheckCircle2 
} from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { StockItem, Warehouse } from '../../types';

export const ERPInventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const lowStockOnly = searchParams.get('low_stock') === 'true';
  const selectedWarehouse = searchParams.get('warehouse') || '';

  // Adjustment Modal State
  const [adjustModalItem, setAdjustModalItem] = useState<StockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('ADJUSTMENT_AUDIT');
  const [adjustRef, setAdjustRef] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (lowStockOnly) params.low_stock = true;
      if (selectedWarehouse) params.warehouse = selectedWarehouse;

      const [resStock, resWarehouses] = await Promise.all([
        inventoryApi.getStock(params),
        warehouses.length === 0 ? inventoryApi.getWarehouses() : Promise.resolve(warehouses)
      ]);

      setStockItems(resStock.results || []);
      if (warehouses.length === 0) setWarehouses(resWarehouses || []);
    } catch (err) {
      console.error('Failed to load inventory stock', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [lowStockOnly, selectedWarehouse]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem || adjustQty === 0) return;
    setAdjusting(true);
    try {
      await inventoryApi.adjustStock(adjustModalItem.id, {
        quantity_change: adjustQty,
        movement_type: adjustType,
        reference_number: adjustRef || 'MANUAL-ADJUST',
        notes: adjustNotes || 'Physical count adjustment'
      });
      setAdjustSuccess(`Successfully adjusted ${adjustModalItem.product_name} by ${adjustQty > 0 ? `+${adjustQty}` : adjustQty} units.`);
      setTimeout(() => {
        setAdjustModalItem(null);
        setAdjustSuccess(null);
        setAdjustQty(0);
        setAdjustNotes('');
        setAdjustRef('');
        fetchStock();
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to adjust stock.');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Warehouse Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-location physical inventory, reserved customer quotas, and stock adjustment auditing
          </p>
        </div>
        <button
          onClick={fetchStock}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Warehouse:</span>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                if (e.target.value) searchParams.set('warehouse', e.target.value);
                else searchParams.delete('warehouse');
                setSearchParams(searchParams);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <button
            onClick={() => {
              if (lowStockOnly) searchParams.delete('low_stock');
              else searchParams.set('low_stock', 'true');
              setSearchParams(searchParams);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              lowStockOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Risks Only</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {stockItems.length} inventory records
        </span>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Product & Variant</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-right">On Hand</th>
                <th className="py-3.5 px-4 text-right">Reserved</th>
                <th className="py-3.5 px-4 text-right">Available</th>
                <th className="py-3.5 px-4 text-right">Threshold</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading real-time inventory balances...</span>
                  </td>
                </tr>
              ) : stockItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No stock records found matching filters.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.product_name}</div>
                      {item.variant_name && (
                        <div className="text-[11px] text-indigo-600 font-medium">{item.variant_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {item.variant_sku || item.product_sku}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                        {item.warehouse_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{item.quantity_on_hand}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{item.reserved_quantity}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-600">{item.available_quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{item.min_stock_threshold}</td>
                    <td className="py-3 px-4 text-center">
                      {item.is_low_stock ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Optimal</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { setAdjustModalItem(item); setAdjustQty(0); }}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Adjust Physical Inventory</h3>
                <p className="text-[11px] text-slate-500">{adjustModalItem.product_name} ({adjustModalItem.warehouse_code})</p>
              </div>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adjustSuccess ? (
              <div className="py-8 text-center text-emerald-600 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto" />
                <p className="text-xs font-bold">{adjustSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleAdjustSubmit} className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Stock Level</label>
                  <div className="bg-slate-100 rounded-lg p-2 font-mono font-bold text-slate-900">
                    {adjustModalItem.quantity_on_hand} units on hand
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Quantity Adjustment (Negative to reduce, Positive to add)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    placeholder="-5 or +15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    New projected stock: <strong>{adjustModalItem.quantity_on_hand + adjustQty} units</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reason / Movement Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="ADJUSTMENT_AUDIT">Physical Count Reconciliation Audit</option>
                    <option value="ADJUSTMENT_DAMAGE">Damaged / Broken / Scrapped</option>
                    <option value="RETURN_RESTOCK">Customer Return Restock</option>
                    <option value="INBOUND_PURCHASE">Direct Warehouse Intake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Audit Reference ID</label>
                  <input
                    type="text"
                    value={adjustRef}
                    onChange={(e) => setAdjustRef(e.target.value)}
                    placeholder="e.g. AUDIT-2026-OCT-01"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Auditor Notes</label>
                  <textarea
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Variance identified during weekly cycle count"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdjustModalItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting || adjustQty === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    {adjusting ? 'Committing...' : 'Commit Stock Ledger Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
