import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { fetchPublicProduct, type ProductDetail } from '../lib/api';
import { Loader2, ArrowLeft, Check, Tag, Layers, Boxes, Image as ImageIcon, FileText } from 'lucide-react';
import SEO from '../components/SEO';

export default function ProductItemDetailPage(){
  const { productSlug } = useParams<{ productSlug: string }>();
  const [product,setProduct]=useState<ProductDetail|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{ if(!productSlug) return; (async()=>{ setLoading(true); setError(null); try { const p = await fetchPublicProduct(productSlug); setProduct(p);} catch(e:any){ setError(e.message||'Failed'); } finally { setLoading(false);} })(); },[productSlug]);

  if(loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  if(error) return <div className="max-w-3xl mx-auto py-20 text-center text-rose-600">{error}</div>;
  if(!product) return <Navigate to="/products" replace />;

  return (
    <div className="pt-16">
      <SEO
        title={`${product.name} | Power Drive Solution`}
        description={product.shortDescription || `High-quality lubricant product ${product.name} by Power Drive Solution.`}
        canonical={`https://powerdrivesolution.com.np/products/item/${product.slug}`}
        image={product.imageUrl || undefined}
        jsonLd={{
          '@context':'https://schema.org',
          '@type':'Product',
          name: product.name,
          description: product.shortDescription || product.longDescription || '',
          sku: product.id,
            brand: { '@type':'Brand', name: 'Power Drive Solution' },
            category: product.category?.name,
          image: product.imageUrl ? [product.imageUrl] : undefined
        }}
      />
      <section className="bg-gray-50 dark:bg-gray-900 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/products" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">Products</Link>
            <span className="text-gray-400">/</span>
            {product.category && (
              <>
                <Link to={`/products/category/${product.category.slug}`} className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">{product.category.name}</Link>
                <span className="text-gray-400">/</span>
              </>
            )}
            <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {product.category && (
            <Link to={`/products/category/${product.category.slug}`} className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition mb-8 font-medium">
              <ArrowLeft className="h-4 w-4" /> Back to {product.category.name}
            </Link>
          )}

          <div className="grid md:grid-cols-[320px_1fr] gap-10 items-start">
            <div className="relative w-full flex justify-center">
              <div className="relative w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-2xl ring-1 ring-gray-200/60 dark:ring-white/10 overflow-hidden flex items-center justify-center">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="h-16 w-16 text-slate-400"/>}
              </div>
            </div>
            <div className="space-y-6 max-w-2xl">
              <div>
                {product.category && (<p className="text-brand-600 dark:text-brand-400 font-medium text-sm tracking-wide uppercase mb-2">{product.category.name}</p>)}
                <h1 className="font-poppins text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">{product.name}</h1>
                {product.shortDescription && <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base md:text-lg">{product.shortDescription}</p>}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase font-medium tracking-wide">
                {product.viscosity && <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{product.viscosity}</span>}
                {product.apiGrade && <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{product.apiGrade}</span>}
              </div>
              {product.features && product.features.length>0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Tag className="h-4 w-4 text-brand-600"/>Key Features</h3>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    {product.features.slice(0,6).map(f=> <li key={f.id} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600"/>{f.label}</li>)}
                  </ul>
                </div>
              )}
              {product.applications && product.applications.length>0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Layers className="h-4 w-4 text-brand-600"/>Applications</h3>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    {product.applications.map(a=> <li key={a.id} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400"></span>{a.label}</li> )}
                  </ul>
                </div>
              )}
              {product.packSizes && product.packSizes.length>0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Boxes className="h-4 w-4 text-brand-600"/>Available Packs</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.packSizes.map(p=> <span key={p.id} className="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-medium tracking-wide">{p.displayLabel}</span>)}
                  </div>
                </div>
              )}
              {product.longDescription && (
                <div className="rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm p-4 md:p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-brand-600"/>Product Description</h3>
                  <p className="text-[15px] leading-7 text-gray-700 dark:text-gray-200">{product.longDescription}</p>
                </div>
              )}
              {product.healthSafety && (
                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 mt-6">Health, Safety & Environment</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">{product.healthSafety}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/contact" className="flex-1 inline-flex items-center justify-center bg-brand-600 text-white font-semibold tracking-wide text-sm px-8 py-3 rounded-md shadow hover:bg-brand-700 transition">Get Quote</Link>
                {(() => {
                  const pdf = (product.media||[]).find(m => m.type === 'spec' || m.type === 'brochure' || m.type === 'msds');
                  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
                  if (pdf) {
                    const pdfFullUrl = pdf.url.startsWith('http') ? pdf.url : `${backendUrl}${pdf.url}`;
                    return (
                      <a href={pdfFullUrl} target="_blank" rel="noopener noreferrer" className="flex-1 inline-flex items-center justify-center border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold tracking-wide text-sm px-8 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-white/10 transition">View PDF</a>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
