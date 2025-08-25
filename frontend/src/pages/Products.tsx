import { Link } from 'react-router-dom';
import { ArrowRight, Award, Beaker, Shield } from 'lucide-react';
import BackToTop from '../components/BackToTop';
import { useEffect, useState } from 'react';
import { fetchPublicCategories, type ProductCategory } from '../lib/api';
import SEO from '../components/SEO';

// Fallback icon mapping (simple heuristic)
function categoryIcon(name: string){
  if(/diesel/i.test(name)) return <Shield className="h-12 w-12"/>;
  if(/motor|bike/i.test(name)) return <Beaker className="h-12 w-12"/>;
  return <Beaker className="h-12 w-12"/>;
}

const Products = () => {
  const [categories,setCategories]=useState<ProductCategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{ (async()=>{ try { const cats = await fetchPublicCategories(); setCategories(cats); } catch(e:any){ setError(e.message||'Failed'); } finally { setLoading(false);} })(); },[]);

  return (
    <div className="pt-16 transition-colors duration-300">
      <SEO
        title="Lubricant Product Categories | Power Drive Solution"
        description="Explore diesel engine oils, gear & transmission oils, greases, motorcycle and passenger car motor oils from Power Drive Solution."
        canonical="https://powerdrivesolution.com.np/products"
      />
      {/* Hero Section */}
      <section className="relative py-20 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 dark:opacity-40"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920)'
          }}
        ></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our <span className="text-brand-600 dark:text-brand-400">Products</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Comprehensive lubrication solutions engineered for superior performance
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && !error && (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-full max-w-sm mx-auto flex flex-col overflow-hidden animate-pulse"
                  style={{ width: '18rem' }}
                  aria-busy="true"
                >
                  {/* Image skeleton */}
                  <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-700" />
                  {/* Body skeleton */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-600 rounded mb-3" />
                    <div className="space-y-2 mb-4">
                      <div className="h-4 w-full bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-600 rounded" />
                    </div>
                    <div className="mt-auto">
                      <div className="h-9 w-28 bg-gray-200 dark:bg-gray-600 rounded-md" />
                    </div>
                  </div>
                </div>
              ))
            )}
            {error && <div className="col-span-full text-center py-20 text-rose-600">{error}</div>}
            {!loading && !error && categories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow w-full max-w-sm mx-auto flex flex-col overflow-hidden"
                style={{width:'18rem'}}
              >
                {/* Image Top (Bootstrap style) */}
                <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {category.heroImageUrl ? (
                    <img
                      src={category.heroImageUrl}
                      alt={category.name}
                      loading="lazy"
                      className="w-full h-full object-contain p-2 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-slate-400">
                      {categoryIcon(category.name)}
                    </div>
                  )}
                </div>
                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{category.name}</h3>
                  {category.shortDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-4">
                      {category.shortDescription}
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-3 flex-wrap">
                    <Link
                      to={category.status==='coming_soon' ? `/contact?category=${category.slug}` : `/products/category/${category.slug}`}
                      className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/30 transition"
                    >
                      {category.status==='coming_soon' ? 'Enquire' : 'View Details'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    {category.status==='coming_soon' && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded dark:bg-orange-500/10 dark:text-orange-300">Coming Soon</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Quality You Can Trust
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Every product undergoes rigorous testing and quality control to ensure optimal performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-brand-50 dark:bg-brand-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-100 dark:group-hover:bg-brand-600/30 transition-colors duration-200">
                <Award className="h-10 w-10 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Certified Quality
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                All products meet international quality standards and certifications
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-50 dark:bg-brand-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-100 dark:group-hover:bg-brand-600/30 transition-colors duration-200">
                <Beaker className="h-10 w-10 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Advanced Testing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive laboratory testing ensures product reliability and performance
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-brand-50 dark:bg-brand-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-brand-100 dark:group-hover:bg-brand-600/30 transition-colors duration-200">
                <Shield className="h-10 w-10 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Performance Guarantee
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Backed by our commitment to excellence and customer satisfaction
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Products;