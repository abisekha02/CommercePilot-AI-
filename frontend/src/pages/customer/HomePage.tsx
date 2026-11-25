import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Truck, Zap, ShoppingCart, Star, Layers } from 'lucide-react';
import { productsApi, aiApi } from '../../services/api';
import { Product, Category } from '../../types';
import { useCart } from '../../context/CartContext';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [featData, catData, aiRecs] = await Promise.all([
          productsApi.getFeaturedProducts(),
          productsApi.getCategories(),
          aiApi.getRecommendations({ limit: 4 })
        ]);
        setFeaturedProducts(featData || []);
        setCategories(catData || []);
        setAiRecommendations(aiRecs?.recommendations || []);
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-3.5 py-1 text-xs text-indigo-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Full-Stack E-Commerce + ERP Inventory Engine</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Commerce Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-300">Intelligent AI</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              From automated warehouse reorder triggers to real-time stock allocation and interactive customer AI assistants — experience full-stack e-commerce built for real business workflows.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/catalog"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-sm transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Browse Live Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/erp"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-xl text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Launch ERP Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Curated Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500">Explore gear tailored for tech professionals and modern spaces</p>
          </div>
          <Link to="/catalog" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square flex flex-col justify-end p-4 shadow-2xs hover:shadow-md transition"
            >
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
              <div className="relative z-10 text-white">
                <h3 className="font-bold text-sm tracking-tight leading-tight drop-shadow-xs">{cat.name}</h3>
                <span className="text-[11px] text-slate-300">Browse collection &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Flagship Lineup</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Gear</h2>
          </div>
          <Link to="/catalog" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition flex flex-col group"
            >
              <Link to={`/product/${product.slug}`} className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                <img
                  src={product.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'}
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
                    Only {product.total_stock} Left
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
                    className="bg-slate-900 hover:bg-indigo-600 text-white p-2.5 rounded-xl transition cursor-pointer shadow-xs"
                    title="Add to Cart"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Smart Recommendations Banner */}
      {aiRecommendations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>AI Personalized Recommendations</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Recommended For You by CommercePilot AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mb-6">
                Our recommendation neural model matches your interests with inventory availability and community ratings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {aiRecommendations.map((item) => (
                  <div key={item.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
                    <div>
                      <Link to={`/product/${item.slug}`}>
                        <img
                          src={item.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'}
                          alt={item.name}
                          className="w-full aspect-16/10 object-cover rounded-xl mb-2.5 bg-slate-800"
                        />
                        <h4 className="font-semibold text-xs text-white truncate">{item.name}</h4>
                      </Link>
                      {item.ai_recommendation_reason && (
                        <p className="text-[10px] text-indigo-200 mt-1 line-clamp-1 italic">
                          "{item.ai_recommendation_reason}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                      <span className="text-xs font-bold text-white">${Number(item.base_price).toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(item.id, null, 1)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
