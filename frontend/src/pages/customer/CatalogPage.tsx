import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { productsApi } from '../../services/api';
import { Product, Category } from '../../types';
import { useCart } from '../../context/CartContext';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const selectedCategory = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [ordering, setOrdering] = useState<string>('-created_at');

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params: any = { ordering };
      if (selectedCategory) params.category = selectedCategory;
      if (search) params.search = search;
      if (minPrice) params.min_price = Number(minPrice);
      if (maxPrice) params.max_price = Number(maxPrice);

      const [resProducts, resCategories] = await Promise.all([
        productsApi.getProducts(params),
        categories.length === 0 ? productsApi.getCategories() : Promise.resolve(categories)
      ]);

      setProducts(resProducts.results || []);
      if (categories.length === 0) setCategories(resCategories || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, search, ordering]);

  const handleCategorySelect = (slug: string) => {
    if (selectedCategory === slug) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handlePriceFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing {products.length} products with live warehouse stock tracking
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-500">Sort by:</label>
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="-created_at">Newest Arrivals</option>
            <option value="base_price">Price: Low to High</option>
            <option value="-base_price">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filters</span>
              </span>
              {(selectedCategory || search || minPrice || maxPrice) && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Categories list */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2.5">Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                    !selectedCategory ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                  {!selectedCategory && <Check className="w-3 h-3 text-indigo-600" />}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCategorySelect(c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                      selectedCategory === c.slug ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.name}</span>
                    {selectedCategory === c.slug && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2.5">Price Range ($)</h3>
              <form onSubmit={handlePriceFilter} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded-lg text-xs transition cursor-pointer"
                >
                  Apply Filter
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading catalog items...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-sm font-semibold text-slate-800 mb-1">No products match your criteria</p>
              <p className="text-xs text-slate-500 mb-4">Try clearing some filters or searching with another term.</p>
              <button
                onClick={clearAllFilters}
                className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition flex flex-col group"
                >
                  <Link to={`/product/${product.slug}`} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={product.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {product.featured && (
                      <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Featured
                      </span>
                    )}
                    {product.total_stock <= 5 && product.total_stock > 0 && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Low Stock ({product.total_stock})
                      </span>
                    )}
                    {product.total_stock === 0 && (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Out of Stock
                      </span>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>{product.brand}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-slate-700">{product.average_rating}</span>
                        </div>
                      </div>
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Price</span>
                        <span className="text-base font-bold text-slate-900">${Number(product.base_price).toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => addToCart(product.id, null, 1)}
                        disabled={product.total_stock === 0}
                        className="bg-slate-900 hover:bg-indigo-600 disabled:opacity-30 text-white p-2.5 rounded-xl transition cursor-pointer shadow-xs"
                        title={product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
