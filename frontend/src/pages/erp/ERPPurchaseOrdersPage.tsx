import React, { useEffect, useState } from 'react';
import { 
  Truck, Plus, CheckCircle2, Clock, 
  RefreshCw, X, AlertCircle, PackageCheck, DollarSign 
} from 'lucide-react';
import { inventoryApi, productsApi } from '../../services/api';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../../types';

export const ERPPurchaseOrdersPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<number | string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | string>('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<{ product: number; quantity_ordered: number; unit_cost: number }[]>([]);
  const [creating, setCreating] = useState(false);

  // Receiving state
  const [receivingId, setReceivingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pos, sups, whs, prods] = await Promise.all([
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getSuppliers(),
        inventoryApi.getWarehouses(),
        productsApi.getProducts()
      ]);
      setPurchaseOrders(pos.results || pos || []);
      setSuppliers(sups || []);
      setWarehouses(whs || []);
      setProducts(prods.results || []);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemToPO = () => {
    if (products.length > 0) {
      const first = products[0];
      setPoItems([...poItems, {
        product: first.id,
        quantity_ordered: 10,
        unit_cost: Number(first.cost_price || 50)
      }]);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !selectedWarehouse || poItems.length === 0) {
      alert('Please select supplier, destination warehouse, and at least one item line.');
      return;
    }
    setCreating(true);
    try {
      const poNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      await inventoryApi.createPurchaseOrder({
        po_number: poNum,
        supplier: Number(selectedSupplier),
        warehouse: Number(selectedWarehouse),
        status: 'SUBMITTED',
        notes: poNotes,
        items: poItems
      });
      setCreateModalOpen(false);
      setPoItems([]);
      setPoNotes('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create purchase order.');
    } finally {
      setCreating(false);
    }
  };

  const handleReceivePO = async (poId: number) => {
    if (!confirm('Confirm receiving all ordered items into destination warehouse stock?')) return;
    setReceivingId(poId);
    try {
      await inventoryApi.receivePOItems(poId);
      await fetchData();
      alert('Stock successfully received and credited to warehouse inventory!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to receive items.');
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers & Purchase Orders (POs)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procurement workflow, vendor lead times, and automated warehouse inventory replenishment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedSupplier(suppliers[0]?.id || '');
              setSelectedWarehouse(warehouses[0]?.id || '');
              handleAddItemToPO();
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Vendor / Supplier</th>
                <th className="py-3.5 px-4">Destination Hub</th>
                <th className="py-3.5 px-4">Items / SKU Lines</th>
                <th className="py-3.5 px-4 text-right">Committed Value</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Expected Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span>Loading procurement orders...</span>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.po_number}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{po.supplier_name}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {po.warehouse_name || 'Central Distribution'}
                    </td>
                    <td className="py-3 px-4">
                      {po.items && po.items.length > 0 ? (
                        <span className="text-[11px] text-slate-600">
                          {po.items.map(it => `${it.quantity_ordered}x ${it.product_name}`).join(', ')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">General restock</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ${Number(po.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        po.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : po.status === 'PARTIALLY_RECEIVED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                        <span>{po.status_display || po.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {po.expected_delivery_date || 'Standard Lead'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status !== 'COMPLETED' && po.status !== 'CANCELLED' ? (
                        <button
                          onClick={() => handleReceivePO(po.id)}
                          disabled={receivingId === po.id}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>{receivingId === po.id ? 'Receiving...' : 'Receive Goods'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Fulfilled & Credited</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Create Replenishment Purchase Order</h3>
                <p className="text-[11px] text-slate-500">Initiate inventory restock with certified supplier</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} (Lead: {s.lead_time_days}d)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination Warehouse</label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Line Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-700 font-semibold">PO Order Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold cursor-pointer"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[idx].product = Number(e.target.value);
                          const prod = products.find(p => p.id === Number(e.target.value));
                          if (prod) newItems[idx].unit_cost = Number(prod.cost_price || 50);
                          setPoItems(newItems);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity_ordered}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[idx].quantity_ordered = Number(e.target.value);
                          setPoItems(newItems);
                        }}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost $"
                        value={item.unit_cost}
                        onChange={(e) => {
                          const newItems = [...poItems];
                          newItems[idx].unit_cost = Number(e.target.value);
                          setPoItems(newItems);
                        }}
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-right"
                      />

                      <button
                        type="button"
                        onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Procurement Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Q4 restocking run per AI inventory recommendations"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  {creating ? 'Submitting PO...' : 'Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
