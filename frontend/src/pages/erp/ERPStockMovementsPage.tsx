import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Filter, RefreshCw, FileText } from 'lucide-react';
import { inventoryApi } from '../../services/api';
import { StockMovement } from '../../types';

export const ERPStockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedType) params.type = selectedType;
      const data = await inventoryApi.getMovements(params);
      setMovements(data.results || []);
    } catch (err) {
      console.error('Failed to load stock movements', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [selectedType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Movement Audit Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction log of all warehouse movements, customer orders, and physical adjustments
          </p>
        </div>
        <button
          onClick={fetchMovements}
          className="self-start sm:self-auto flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-600">Filter Event Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-semibold text-slate-800"
          >
            <option value="">All Movement Types</option>
            <option value="INBOUND_PURCHASE">Inbound Purchase Order</option>
            <option value="OUTBOUND_SALE">Customer Order Fulfillment</option>
            <option value="ADJUSTMENT_AUDIT">Physical Inventory Audit</option>
            <option value="ADJUSTMENT_DAMAGE">Damage / Scrap Adjustment</option>
            <option value="RETURN_RESTOCK">Customer Return Restock</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {movements.length} logged events
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Event Classification</th>
                <th className="py-3.5 px-4 text-center">Net Delta</th>
                <th className="py-3.5 px-4 text-center">Balance Transition</th>
                <th className="py-3.5 px-4">Reference ID</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading movement transactions...</span>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No movement records logged for this filter.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.product_name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 font-mono text-xs text-slate-700 px-2 py-0.5 rounded">
                        {m.warehouse_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-700">
                        {m.movement_type_display}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold px-2.5 py-0.5 rounded text-xs ${
                        m.quantity_change > 0 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                      {m.previous_quantity} &rarr; <strong className="text-slate-900">{m.new_quantity}</strong>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-brand-600 font-semibold">
                      {m.reference_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.performed_by_name || 'System / Batch'}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">{m.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
