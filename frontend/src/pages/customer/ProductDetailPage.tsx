import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, ShoppingBag, Truck, ShieldCheck, RotateCcw, 
  Sparkles, CheckCircle2, MessageSquare, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { productsApi } from '../../services/api';
import { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ai_copy' | 'reviews'>('details');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Product[]>([]);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productsApi.getProductBySlug(slug);
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        const relData = await productsApi.getRelatedProducts(slug);
        setRelated(relData || []);
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Loading product details and real-time inventory...</p>
      </div>
    );
  }

  const currentPrice = selectedVariant 
    ? Number(selectedVariant.final_price) 
    : Number(product.base_price);

  const currentStock = selectedVariant 
    ? selectedVariant.stock_quantity 
    : product.total_stock;

  const handleAddToCart = () => {
    addToCart(product.id, selectedVariant?.id || null, quantity);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim() || !slug) return;
    setSubmittingReview(true);
    try {
      await productsApi.addReview(slug, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      // Refresh product to show review
      const updated = await productsApi.getProductBySlug(slug);
      setProduct(updated);
      setReviewComment('');
      setReviewTitle('');
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back link */}
      <div>
        <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
            <img
              src={product.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.alt_text || product.name}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                {product.brand || 'CommercePilot'}
              </span>
              <span className="text-xs text-slate-400">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings and Reviews */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{product.average_rating}</span>
              <span className="text-xs text-slate-400">({product.review_count} verified reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">${currentPrice.toFixed(2)}</span>
              {selectedVariant && Number(selectedVariant.additional_price) > 0 && (
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">
                  +${Number(selectedVariant.additional_price).toFixed(2)} tier
                </span>
              )}
            </div>

            {/* Inventory Status Indicator */}
            <div className="mt-4 flex items-center gap-2">
              {currentStock > 10 ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Stock ({currentStock} units ready to ship)</span>
                </div>
              ) : currentStock > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Low Inventory: Only {currentStock} units remaining</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Out of Stock (Replenishment PO pending)</span>
                </div>
              )}
            </div>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Select Model / Variant:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        selectedVariant?.id === v.id
                          ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{v.name}</span>
                      {Number(v.additional_price) > 0 && (
                        <span className="ml-1 text-xs text-slate-500">(+${Number(v.additional_price)})</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-brand-200 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{currentStock === 0 ? 'Out of Stock' : 'Add to Bag'}</span>
              </button>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200 text-slate-600 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Free Shipping over $50</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>30-Day Hassle-Free Returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>1-Yr Warranty</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs: Specifications, AI Generated Highlights, Reviews */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Overview
          </button>
          <button
            onClick={() => setActiveTab('ai_copy')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai_copy'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Copy & Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({product.reviews?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'details' && (
          <div className="py-6 max-w-3xl space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-4">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Copy */}
        {activeTab === 'ai_copy' && (
          <div className="py-6 max-w-3xl space-y-4">
            <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2 text-brand-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>AI-Engineered Product Synthesis</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {product.ai_description || "This product features verified low latency, ultra-durable chassis design, and full compatibility across modern enterprise setups."}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="py-6 space-y-8 max-w-3xl">
            {/* Existing Reviews */}
            <div className="space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900">{rev.username}</span>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    {rev.title && <h4 className="text-xs font-bold text-slate-800 mb-1">{rev.title}</h4>}
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No reviews yet. Be the first to share your experience!</p>
              )}
            </div>

            {/* Submit Review Form */}
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Leave a Review</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Rating:</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value={5}>5 Stars - Excellent</option>
                    <option value={4}>4 Stars - Great</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Terrible</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Review title (e.g. Incredible sound and comfort)"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
                <textarea
                  rows={3}
                  placeholder="Write your honest review..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  {submittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Please sign in to write a product review.</span>
                <Link to="/login" className="font-bold text-brand-600 hover:underline">Sign In &rarr;</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Frequently Viewed Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition p-3 group flex flex-col justify-between"
              >
                <div>
                  <img
                    src={p.primary_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'}
                    alt={p.name}
                    className="w-full aspect-4/3 object-cover rounded-xl bg-slate-100 group-hover:scale-103 transition"
                  />
                  <h4 className="text-xs font-semibold text-slate-900 mt-2 truncate">{p.name}</h4>
                  <p className="text-xs text-slate-500">{p.brand}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">${Number(p.base_price).toFixed(2)}</span>
                  <span className="text-xs text-brand-600 font-semibold group-hover:underline">View &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
