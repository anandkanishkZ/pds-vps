import { Link } from 'react-router-dom';
import { Shield, Zap, Award, Thermometer } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import BackToTop from '../components/BackToTop';
import { dieselEngineOilProducts } from '../data/dieselEngineOilProducts';

const DieselEngineOil = () => {
  useTheme(); // retained call if theme context effects are needed; value unused
  
  // data imported above

  const benefits = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Superior Protection',
      description: 'Advanced additives protect against wear, corrosion, and deposits'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Enhanced Performance',
      description: 'Optimized formulations for maximum engine power and efficiency'
    },
    {
      icon: <Thermometer className="h-8 w-8" />,
      title: 'Temperature Stability',
      description: 'Maintains viscosity across extreme temperature ranges'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Industry Standards',
      description: 'Meets and exceeds API and industry certification requirements'
    }
  ];
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-gradient pt-28 pb-24">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_18%_22%,#ffd34733,transparent_60%),radial-gradient(circle_at_82%_70%,#ffffff26,transparent_65%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 text-[13px] tracking-wide text-white/70 font-medium">
              <Link to="/products" className="hover:text-white transition-colors">Products</Link>
              <span className="opacity-50">/</span>
              <span className="text-white/90">Diesel Engine Oils</span>
            </div>
            <h1 className="text-center text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white relative">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-[#ffe48a] to-white">Diesel Engine Oils</span>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-[5px] w-44 bg-gradient-to-r from-[#ffd347] via-[#fec216] to-transparent rounded-full opacity-90" />
            </h1>
            <p className="text-center text-base md:text-xl text-white/85 dark:text-gray-200 max-w-3xl leading-relaxed font-light">
              High-performance diesel engine lubrication engineered for durability, protection, efficiency and extended service life across demanding operating environments.
            </p>
            {/* Stats grid removed as requested */}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-[#f5f9fd] via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#06477f]/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Why Choose Our Diesel Oils</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">Engineered with advanced additive chemistry delivering multi-dimensional protection and sustained performance across operating extremes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-200/70 dark:ring-gray-700 transition-colors transition-shadow duration-300 ease-out hover:shadow-md hover:ring-[#06477f]/30 dark:hover:ring-[#06477f]/40"
              >
                <div className="relative flex flex-col items-center">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[#06477f]/90 dark:bg-gradient-to-br dark:from-[#06477f] dark:to-[#032f55] text-[#ffd347] shadow-sm ring-1 ring-white/10">
                    {benefit.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 tracking-wide">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                  <span className="mt-6 h-[3px] w-8 rounded-full bg-[#ffd347]/70 transition-all duration-300 group-hover:w-14 group-hover:bg-[#ffd347]" />
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] bg-[linear-gradient(to_bottom,rgba(6,71,127,0.06),rgba(6,71,127,0))] dark:bg-[linear-gradient(to_bottom,rgba(255,211,71,0.07),rgba(255,211,71,0))]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Horizontal List */}
      <section className="py-14 md:py-20 bg-white dark:bg-[#060606] text-gray-900 dark:text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="sr-only">Diesel Oil Products</h2>
          <div className="divide-y divide-gray-200 dark:divide-white/10">
            {dieselEngineOilProducts.map((product, idx) => {
              const imageLeft = idx % 2 === 0;
              return (
                <div key={product.id} className="py-12 md:py-16">
                  <div className={`grid gap-10 items-start ${imageLeft ? 'md:grid-cols-[320px_1fr]' : 'md:grid-cols-[1fr_320px]'} md:items-center`}>
                    {/* Image / Mock Pack */}
                    <div className={`${imageLeft ? '' : 'md:order-last'} relative w-full flex justify-center`}>
                      <div className="relative w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-xl bg-gradient-to-b from-[#f0f6fb] to-[#dfeaf2] dark:from-[#0d2740] dark:to-[#02182c] shadow-2xl ring-1 ring-gray-200/60 dark:ring-white/10 overflow-hidden">
                        <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,211,71,0.18),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,211,71,0.10),transparent_70%)] pointer-events-none" />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-gradient-to-t from-gray-500/30 to-transparent dark:from-black/40 blur-md opacity-50" />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className={`${imageLeft ? '' : 'md:pr-4'} max-w-2xl font-roboto`}> 
                      <h3 className="font-poppins text-[1.35rem] md:text-[1.55rem] font-semibold tracking-tight mb-5 leading-snug text-gray-900 dark:text-white">{product.name}</h3>
                      <div className="space-y-4 mb-7 text-[15px] leading-relaxed text-gray-600/90 dark:text-white/80">
                        <p className="[&_span]:font-semibold"><span className="text-gray-900 dark:text-white">Description:</span><br />{product.description}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {product.features.slice(0,4).map(f => (
                            <span key={f} className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[11px] tracking-wide uppercase font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:bg-white/5 dark:border-white/10 dark:text-white/70 dark:hover:text-white dark:hover:border-white/25 transition-colors">{f}</span>
                          ))}
                        </div>
                      </div>
                      <Link
                        to={`/products/diesel-engine-oil/${product.id}`}
                        className="inline-block bg-[#ffd347] text-[#06477f] font-semibold tracking-wide text-[12px] px-8 py-3 rounded-sm shadow hover:shadow-lg hover:bg-[#fec216] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd347]/60"
                      >
                        VIEW DETAILS
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section (Minimal Style) */}
      <section className="relative py-24 bg-gradient-to-b from-[#f7f9fb] via-white to-white dark:from-[#0d141b] dark:via-[#0b1218] dark:to-[#0a1016] overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,#ffffff_0%,#ffffff00_40%),radial-gradient(circle_at_25%_30%,#e5edf3_0%,transparent_55%)] dark:bg-[linear-gradient(115deg,#0e1822_0%,#0e182200_40%),radial-gradient(circle_at_25%_30%,#11202c_0%,transparent_55%)]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-white/90 dark:to-white">Need Help Choosing the Right Oil?</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal mb-10">
              Our lubrication specialists align the optimal formulation with your duty cycles, emission systems and maintenance strategy—reducing downtime & total operating cost.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="group relative inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-white bg-gradient-to-r from-[#06477f] to-[#032f55] shadow-sm hover:shadow-md hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#06477f] dark:focus-visible:ring-offset-0 transition-all"
              >
                <span className="relative z-10">Contact Our Experts</span>
                <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35),transparent_70%)]" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-lg font-semibold text-[#06477f] dark:text-white border border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-sm hover:border-[#06477f] dark:hover:border-white/40 hover:bg-white hover:shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06477f]/40 dark:focus-visible:ring-white/30"
              >
                View All Products
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/10" />
      </section>
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default DieselEngineOil;
