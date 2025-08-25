import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicCategory, fetchPublicCategoryProducts, fetchPublicCategories, type ProductCategory, type ProductListItem } from '../lib/api';
import { Loader2 } from 'lucide-react';
import SEO from '../components/SEO';

// Simple intersection observer hook for reveal animations
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }),
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function ProductRow({ product, index }: { product: ProductListItem; index: number }) {
  const { ref, visible } = useReveal<HTMLAnchorElement>();
  const reverse = index % 2 === 1;
  return (
    <Link
      to={`/products/item/${product.slug}`}
      ref={ref as any}
      className={[
        'group relative max-w-5xl mx-auto grid grid-cols-1 md:grid md:grid-cols-12 items-center gap-8 md:gap-10 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm hover:shadow-md',
        reverse ? 'md:[&>*:first-child]:col-start-8' : '',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      ].join(' ')}
      style={{ transition: 'opacity .7s ease, transform .7s cubic-bezier(.4,0,.2,1)', transitionDelay: `${Math.min(index*70,350)}ms` }}
    >
      {/* IMAGE */}
      <div className={`md:col-span-5 w-full flex justify-center ${reverse ? 'md:justify-start' : 'md:justify-end'}`}>
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-40 bg-gradient-to-br from-brand-500/20 via-brand-400/10 to-transparent group-hover:opacity-60 transition-opacity" />
          <div className="relative w-full h-full flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-contain w-full h-full scale-95 group-hover:scale-100 transition-transform duration-700 ease-out drop-shadow-xl"
                loading="lazy"
              />
            ) : (
              <span className="text-slate-400 text-xs tracking-wide">No Image</span>
            )}
          </div>
        </div>
      </div>
      {/* CONTENT */}
      <div className={`md:col-span-7 w-full ${reverse ? 'md:order-first' : ''}`}>
        <div className={`max-w-xl ${reverse ? 'md:ml-0 md:mr-auto' : 'md:mr-0 md:ml-auto'} flex flex-col gap-6`}>
          <header className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent group-hover:from-brand-500 group-hover:via-brand-400 group-hover:to-brand-300 transition-colors duration-500">
                {product.name}
              </span>
              {product.apiGrade && <span className="ml-3 align-middle text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 tracking-wide">{product.apiGrade}</span>}
            </h3>
            {product.shortDescription && (
              <p className="text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-400/90">
                {product.shortDescription}
              </p>
            )}
          </header>
          <div className="flex flex-wrap items-center gap-3">
            {product.viscosity && <span className="text-[11px] uppercase tracking-wide font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">{product.viscosity}</span>}
            <span className="relative inline-flex items-center gap-2 text-[12px] font-medium text-brand-600 dark:text-brand-400">
              <span className="group-hover:translate-x-1 transition-transform">View Details</span>
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 10h10" />
                <path d="m12 5 5 5-5 5" />
              </svg>
              <span className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full bg-current transition-all duration-500" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryProductsPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [categories,setCategories]=useState<ProductCategory[]>([]);
  const [category,setCategory]=useState<ProductCategory|null>(null);
  const [products,setProducts]=useState<ProductListItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{ (async()=>{
    setLoading(true); setError(null);
    try {
      const cats = await fetchPublicCategories(); setCategories(cats);
      if(categorySlug){
        const { category } = await fetchPublicCategory(categorySlug); setCategory(category);
        const list = await fetchPublicCategoryProducts(categorySlug,1,100); setProducts(list.data);
      }
    } catch(e:any){ setError(e.message||'Failed'); }
    finally { setLoading(false);} })(); },[categorySlug]);

  if(loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  if(error) return <div className="max-w-3xl mx-auto py-20 text-center text-rose-600">{error}</div>;
  if(!category) return <div className="max-w-3xl mx-auto py-20 text-center text-slate-500">Category not found.</div>;

  return (
    <div className="pt-16">
      <SEO
        title={`${category.name} | Power Drive Solution`}
        description={category.shortDescription || `High-quality ${category.name} solutions engineered for durability and performance.`}
        canonical={`https://powerdrivesolution.com.np/products/category/${category.slug}`}
        jsonLd={{
          '@context':'https://schema.org',
          '@type':'CollectionPage',
          name: `${category.name} Products`,
          description: category.shortDescription || undefined,
          url: `https://powerdrivesolution.com.np/products/category/${category.slug}`
        }}
      />
      <section className="py-14 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div>
              <nav className="text-xs mb-3 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Link to="/products" className="hover:text-brand-600 dark:hover:text-brand-400">Products</Link>
                <span>/</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{category.name}</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">{category.name}</h1>
              {category.shortDescription && <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">{category.shortDescription}</p>}
            </div>
            <div className="flex gap-2 overflow-x-auto max-w-full py-2">
              {categories.map(c=> (
                <Link key={c.id} to={`/products/category/${c.slug}`} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border ${c.slug===category.slug?'bg-brand-600 text-white border-brand-600':'bg-white/70 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{c.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 relative">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_top,#0ea5e910,transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {category.status==='coming_soon' && <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/30 text-amber-800 dark:text-amber-300 mb-14 font-medium shadow-sm">Coming Soon – Products for this category are not yet published. Contact us for early inquiries.</div>}
          <div className="flex flex-col gap-16 md:gap-24">
            {products.map((p,i) => (
              <ProductRow key={p.id} product={p} index={i} />
            ))}
          </div>
          {products.length===0 && category.status!=='coming_soon' && <div className="text-center py-20 text-slate-500">No products published yet.</div>}
        </div>
      </section>
    </div>
  );
}
