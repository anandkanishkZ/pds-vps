import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BackToTop from '../components/BackToTop';
import { getDieselProductById } from '../data/dieselEngineOilProducts';

const DieselProductDetail = () => {
  const { dieselId } = useParams<{ dieselId: string }>();
  const product = dieselId ? getDieselProductById(dieselId) : undefined;

  if (!product) return <Navigate to="/products/diesel-engine-oil" replace />;

  return (
    <div className="pt-16">
      <section className="bg-gray-50 dark:bg-gray-900 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">Products</Link>
            <span className="text-gray-400">/</span>
            <Link to="/products/diesel-engine-oil" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">Diesel Engine Oils</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/products/diesel-engine-oil" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition mb-8 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Diesel Oils
          </Link>

          <div className="grid md:grid-cols-[320px_1fr] gap-10 items-start">
            <div className="relative w-full flex justify-center">
              <div className="relative w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-xl bg-gradient-to-b from-[#f0f6fb] to-[#dfeaf2] dark:from-[#0d2740] dark:to-[#02182c] shadow-2xl ring-1 ring-gray-200/60 dark:ring-white/10 overflow-hidden">
                <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="font-poppins text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">
                  {product.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base md:text-lg">{product.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.features.map(f => (
                  <span key={f} className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] tracking-wide uppercase font-medium text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-white/70">
                    {f}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="block text-gray-500 dark:text-gray-400">Viscosity</span>
                  <span className="block font-semibold text-gray-900 dark:text-white">{product.viscosity}</span>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="block text-gray-500 dark:text-gray-400">API Grade</span>
                  <span className="block font-semibold text-gray-900 dark:text-white">{product.apiGrade}</span>
                </div>
              </div>
              {product.availablePacks && (
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Available Packs</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.availablePacks.map(p => (
                      <span key={p} className="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 text-xs font-medium tracking-wide">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Applications</h2>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                  {product.applications.map(a => (
                    <li key={a} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06477f] dark:bg-[#ffd347]"></span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              {product.healthSafety && (
                <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-2 mt-6">Health, Safety, Storage & Environmental</h2>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {product.healthSafety}
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/contact" className="flex-1 inline-flex items-center justify-center bg-[#06477f] text-white font-semibold tracking-wide text-sm px-8 py-3 rounded-md shadow hover:bg-[#053d6e] transition">Get Quote</Link>
                <button className="flex-1 inline-flex items-center justify-center border border-gray-300 dark:border-white/20 text-gray-700 dark:text-white font-semibold tracking-wide text-sm px-8 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-white/10 transition">Download Spec</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <BackToTop />
    </div>
  );
};

export default DieselProductDetail;
