import React, { useEffect, useState } from 'react';
import { 
  Tags, Plus, Sparkles, RefreshCw, X, 
  CheckCircle2, DollarSign, Image as ImageIcon, ArrowUpRight 
} from 'lucide-react';
import { productsApi, aiApi } from '../../services/api';
import { Product, Category } from '../../types';

export const ERPCatalogManagerPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [basePrice, setBasePrice] = useState<string>('99.00');
  const [costPrice, setCostPrice] = useState<string>('45.00');
  const [description, setDescription] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // AI Generator in Modal
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiFeatures, setAiFeatures] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [resProducts, resCats] = await Promise.all([
        productsApi.getProducts({}),
        productsApi.getCategories()
      ]);
      setProducts(resProducts.results || []);
      setCategories(resCats || []);
    } catch (err) {
      console.error('Failed to load products in catalog manager', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleGenerateAI = async () => {
    if (!productName.trim()) {
      alert('Please enter a product title first so the AI can craft tailored descriptions.');
      return;
    }
    setGeneratingAI(true);
    try {
      const catObj = categories.find(c => c.id === Number(categoryId));
      const res = await aiApi.generateDescription({
        title: productName,
        category: catObj?.name || 'Consumer Tech & Electronics',
        features: aiFeatures ? aiFeatures.split(',').map(s => s.trim()) : ['High performance', 'Durable aluminum frame', 'Precision engineering'],
        tone: 'persuasive and professional'
      });
      setDescription(res.description);
      setAiDescription(res.seo_meta_description || res.tagline);
    } catch {
      alert('AI generator encountered an issue. Using fallback copy.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !sku || !basePrice) {
      alert('Title, SKU, and Base Price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: productName,
        sku: sku,
        brand: brand || 'CommercePilot',
        category: categoryId ? Number(categoryId) : null,
        base_price: Number(basePrice),
        cost_price: Number(costPrice || 0),
        description: description || `${productName} engineered for peak productivity and style.`,
        ai_description: aiDescription,
        featured: isFeatured,
        is_active: true,
      };
      if (imageUrl) {
        payload.images = [{ image_url: imageUrl, is_primary: true, display_order: 0 }];
      }
      await productsApi.createProduct(payload);
      setModalOpen(false);
      resetForm();
      fetchCatalog();
    } catch (err: any) {
      alert(err.response?.data?.sku?.[0] || 'Failed to save product to catalog.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setSku('');
    setBrand('');
    setBasePrice('99.00');
    setCostPrice('45.00');
    setDescription('');
    setAiDescription('');
    setImageUrl('');
    setAiFeatures('');
    setIsFeatured(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure SKUs, pricing margins, category structures, and generate AI marketing copy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setCategoryId(categories[0]?.id || '');
              setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
          <button
            onClick={fetchCatalog}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4 text-right">Retail Price</th>
                <th className="py-3.5 px-4 text-right">Cost Basis</th>
                <th className="py-3.5 px-4 text-right">Gross Margin %</th>
                <th className="py-3.5 px-4 text-right">Warehouse Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading catalog repository...</span>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const retail = Number(p.base_price) || 0;
                  const cost = Number(p.cost_price) || 0;
                  const margin = retail > 0 ? (((retail - cost) / retail) * 100).toFixed(1) : '0';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80'}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                            <span className="text-xs text-slate-400">{p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.category_name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ${retail.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        ${cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {margin}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={p.total_stock <= 5 ? 'text-amber-600' : 'text-slate-900'}>
                          {p.total_stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal with AI Copywriter */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add New Product to Catalog</h3>
                <p className="text-xs text-slate-500">Create SKU with automated AI marketing copywriting</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. QuantumBeam 4K Portable Projector"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. BeamTech"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cost Basis ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* AI Copywriting Assistant Section */}
              <div className="bg-brand-50/70 border border-brand-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-brand-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Marketing Copy Generator</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{generatingAI ? 'Synthesizing...' : '1-Click Generate Copy'}</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={aiFeatures}
                    onChange={(e) => setAiFeatures(e.target.value)}
                    placeholder="Key features (e.g. 4K HDR, Dolby Atmos, 300 ANSI lumens, Android TV)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter full product description or generate it above using AI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="featuredCheck" className="text-slate-700 font-medium">
                  Feature on Storefront Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Product to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
