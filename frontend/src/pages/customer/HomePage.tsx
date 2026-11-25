import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Headphones, RotateCcw, ShoppingCart, Star } from 'lucide-react';
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
  const heroImg = featured[slide]?.primary_image || FALLBACK_IMG;
  const s = SLIDES[slide];

  return (
    <div className="pb-16">
      <section className="bg-ink text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} aria-roledescription="carousel" aria-label="Featured collections">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-20">
          <div aria-live="polite">
            <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-6xl">{s.title}</h1>
            <p className="mt-5 max-w-md text-lg text-slate-300">{s.text}</p>
            <Link to="/catalog" className="mt-8 inline-flex items-center gap-2 rounded-md bg-amber-400 px-6 py-3 font-semibold text-ink hover:bg-amber-300">{s.cta}<ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <div className="mt-10 flex gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Show slide ${i + 1}`} aria-current={i === slide} className={`h-2 rounded-full transition-all ${i === slide ? 'w-10 bg-amber-400' : 'w-2 bg-slate-500'}`} />
              ))}
            </div>
          </div>
          <img src={heroImg} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="cats">
        <h2 id="cats" className="mb-6 text-2xl font-bold">Shop by category</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {loading ? <Skeletons n={5} /> : categories.map((c) => (
            <li key={c.id}>
              <Link to={`/catalog?category=${c.slug}`} className="flex h-full flex-col justify-end rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-600">
                <span className="font-semibold">{c.name}</span>
                {c.product_count !== undefined && <span className="text-sm text-slate-600">{c.product_count} products</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="best">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="best" className="text-2xl font-bold">Best sellers</h2>
          <div role="tablist" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${tab === t ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-600'}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? <Skeletons n={4} /> : shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-lg bg-brand-600 p-8 text-white md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <h2 className="text-3xl font-bold">Not sure what to buy?</h2>
            <p className="mt-2 max-w-xl text-brand-100">Ask PilotBot. It answers from our live catalog and shows the products that fit.</p>
          </div>
          <Link to="/catalog" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">Browse the catalog<ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </div>
      </section>

      {picks.length > 0 && (
        <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="picks">
          <h2 id="picks" className="mb-6 text-2xl font-bold">Picked for you</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{picks.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}

      <ul className="mx-auto mt-14 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {TRUST.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium"><Icon className="h-5 w-5 text-brand-600" aria-hidden />{label}</li>
        ))}
      </ul>
    </div>
  );
};
