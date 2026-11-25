import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Headphones, RotateCcw, ShoppingCart, Star, Laptop, Watch, Home, Smartphone, Zap, Sparkles } from 'lucide-react';
import { productsApi, aiApi } from '../../services/api';
import { Product, Category } from '../../types';
import { useCart } from '../../context/CartContext';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';

const SLIDES = [
  { title: 'Sound that fills the room', text: 'Headphones and speakers tuned for long listening, from desk to commute.', cta: 'Shop audio' },
  { title: 'A lighter desk setup', text: 'Laptops, monitors and accessories that keep your workday simple.', cta: 'Shop computing' },
  { title: 'Wear it and forget it', text: 'Trackers and watches with battery that lasts the week.', cta: 'Shop wearables' },
];

const TRUST = [
  { icon: Truck, label: 'Free shipping over $50' },
  { icon: RotateCcw, label: '14-day free returns' },
  { icon: ShieldCheck, label: 'Secure checkout' },
  { icon: Headphones, label: 'Support every day' },
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const low = product.total_stock > 0 && product.total_stock <= 5;
  return (
    <article className="group flex flex-col rounded-lg border border-slate-200 bg-white">
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-t-lg bg-slate-100">
        <img src={product.primary_image || FALLBACK_IMG} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        {low && <span className="absolute left-3 top-3 rounded bg-amber-400 px-2 py-0.5 text-xs font-semibold text-ink">Only {product.total_stock} left</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="flex items-center justify-between text-xs text-slate-600">
          <span>{product.brand}</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />{product.average_rating}<span className="sr-only"> out of 5</span></span>
        </p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug"><Link to={`/product/${product.slug}`} className="hover:text-brand-600">{product.name}</Link></h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold">${Number(product.base_price).toFixed(2)}</span>
          <button onClick={() => addToCart(product.id, null, 1)} className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <ShoppingCart className="h-4 w-4" aria-hidden />Add<span className="sr-only"> {product.name} to cart</span>
          </button>
        </div>
      </div>
    </article>
  );
};

const Skeletons: React.FC<{ n: number }> = ({ n }) => (
  <>{Array.from({ length: n }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-slate-200" />)}</>
);

const ICONS = [Headphones, Laptop, Watch, Home, Smartphone, Zap];
const TINTS = ['bg-brand-50', 'bg-amber-100', 'bg-slate-100', 'bg-brand-100', 'bg-amber-50'];

export const HomePage: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [picks, setPicks] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const [f, c, r] = await Promise.all([productsApi.getFeaturedProducts(), productsApi.getCategories(), aiApi.getRecommendations({ limit: 4 })]);
        setFeatured(f || []); setCategories(c || []); setPicks(r?.recommendations || []);
      } catch (err) { console.error('Failed to load home page data', err); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const tabs = useMemo(() => ['All', ...Array.from(new Set(featured.map((p) => p.category_name).filter(Boolean) as string[]))], [featured]);
  const shown = tab === 'All' ? featured : featured.filter((p) => p.category_name === tab);
  const img = (i: number) => featured.length ? featured[i % featured.length].primary_image || FALLBACK_IMG : FALLBACK_IMG;
  const side = featured.length ? featured[(slide + 1) % featured.length] : null;
  const s = SLIDES[slide];
  const wrap = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

  return (
    <div>
      <section className="overflow-hidden bg-ink text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} aria-roledescription="carousel" aria-label="Featured collections">
        <div className={`${wrap} grid items-center gap-14 py-14 md:grid-cols-2 lg:py-24`}>
          <div aria-live="polite">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-sm text-brand-100"><Sparkles className="h-4 w-4 text-amber-400" aria-hidden />AI shopping assistant built in</p>
            <h1 className="max-w-xl text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">{s.title}</h1>
            <p className="mt-6 max-w-md text-lg text-slate-300">{s.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalog" className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-6 py-3 font-semibold text-ink hover:bg-amber-300">{s.cta}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
              <Link to="/catalog" className="rounded-md border border-white/30 px-6 py-3 font-semibold hover:bg-white/10">View all products</Link>
            </div>
            <dl className="mt-10 flex gap-10 border-t border-white/15 pt-6">
              {[[`${categories.length || '-'}`, 'Categories'], [`${featured.length || '-'}`, 'Top picks'], ['24h', 'Dispatch']].map(([n, l]) => (
                <div key={l}><dt className="text-sm text-slate-400">{l}</dt><dd className="font-display text-3xl font-bold">{n}</dd></div>
              ))}
            </dl>
            <div className="mt-8 flex gap-2">
              {SLIDES.map((_, i) => <button key={i} onClick={() => setSlide(i)} aria-label={`Show slide ${i + 1}`} aria-current={i === slide} className={`h-2 rounded-full transition-all ${i === slide ? 'w-10 bg-amber-400' : 'w-2 bg-slate-500'}`} />)}
            </div>
          </div>
          <div className="relative pb-8 pr-4">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-lg bg-brand-600" aria-hidden />
            <img src={img(slide)} alt="" className="relative aspect-[4/3] w-full rounded-lg object-cover" />
            {side && (
              <Link to={`/product/${side.slug}`} className="absolute -bottom-2 left-4 flex items-center gap-3 rounded-lg bg-white p-3 pr-5 text-ink shadow-xl">
                <img src={side.primary_image || FALLBACK_IMG} alt="" className="h-14 w-14 rounded-md object-cover" />
                <span><span className="block text-xs text-slate-600">Trending now</span><span className="block max-w-[11rem] truncate font-semibold">{side.name}</span><span className="text-sm font-bold text-brand-600">${Number(side.base_price).toFixed(2)}</span></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {!loading && featured.length === 0 && (
        <div className={`${wrap} mt-10`}>
          <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm">
            Products are not loading yet. The free server may be waking up, which can take about a minute.
            <button onClick={() => window.location.reload()} className="ml-3 font-semibold text-brand-700 underline">Retry</button>
          </div>
        </div>
      )}

      <section className={`${wrap} mt-16`} aria-labelledby="cats">
        <h2 id="cats" className="mb-6 text-3xl font-bold">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading ? <Skeletons n={5} /> : categories.map((c, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={c.id}>
                <Link to={`/catalog?category=${c.slug}`} className={`group flex h-full min-h-44 flex-col justify-between rounded-lg p-5 transition hover:-translate-y-1 ${TINTS[i % TINTS.length]}`}>
                  <Icon className="h-9 w-9 text-brand-700" aria-hidden />
                  <span>
                    <span className="block text-lg font-semibold">{c.name}</span>
                    <span className="flex items-center justify-between text-sm text-slate-700">{c.product_count !== undefined ? `${c.product_count} products` : 'Explore'}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden /></span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {featured.length >= 3 && (
        <section className={`${wrap} mt-16 grid gap-5 md:grid-cols-3`} aria-label="Collections">
          {[['New arrivals', 'Fresh in the last few weeks', 'bg-brand-600 text-white'], ['Top rated', 'Loved by our customers', 'bg-amber-400 text-ink'], ['Under $100', 'Smart buys, small price', 'bg-ink text-white']].map(([h, sub, cls], i) => (
            <Link key={h} to="/catalog" className={`relative flex min-h-64 flex-col justify-end overflow-hidden rounded-lg p-6 ${cls}`}>
              <img src={img(i)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <span className="relative"><span className="block font-display text-3xl font-bold">{h}</span><span className="mt-1 flex items-center gap-2">{sub}<ArrowRight className="h-4 w-4" aria-hidden /></span></span>
            </Link>
          ))}
        </section>
      )}

      <section className="mt-16 border-y border-slate-200 bg-white py-16" aria-labelledby="best">
        <div className={wrap}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="best" className="text-3xl font-bold">Best sellers</h2>
            <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
              {tabs.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:border-brand-600'}`}>{t}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{loading ? <Skeletons n={4} /> : shown.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </div>
      </section>

      <section className={`${wrap} mt-16`}>
        <div className="relative grid gap-6 overflow-hidden rounded-lg bg-brand-600 p-8 text-white md:grid-cols-[1fr_auto] md:items-center md:p-14">
          <Sparkles className="absolute -right-6 -top-6 h-48 w-48 text-white/10" aria-hidden />
          <div className="relative"><h2 className="text-3xl font-bold sm:text-4xl">Not sure what to buy?</h2><p className="mt-3 max-w-xl text-lg text-brand-100">Ask PilotBot. It answers from our live catalog and shows the products that fit.</p></div>
          <Link to="/catalog" className="relative inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">Browse the catalog<ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </section>

      {picks.length > 0 && (
        <section className={`${wrap} mt-16`} aria-labelledby="picks">
          <h2 id="picks" className="mb-6 text-3xl font-bold">Picked for you</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{picks.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      <ul className={`${wrap} my-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
        {TRUST.map(({ icon: Icon, label }) => <li key={label} className="flex items-center gap-3 rounded-lg bg-brand-50 p-5 font-medium"><Icon className="h-6 w-6 text-brand-600" aria-hidden />{label}</li>)}
      </ul>
    </div>
  );
};
