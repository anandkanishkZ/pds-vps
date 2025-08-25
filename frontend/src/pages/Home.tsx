import { Link } from 'react-router-dom';
import { Shield, Zap, Leaf, Award, ChevronRight, Target, Rocket, Sparkles } from 'lucide-react';
import HeroSlider from '../components/HeroSlider';
// Local category images
const imgGTO = '/images/category/gto.jpg';
const imgGreases = '/images/category/greases.jpg';
const imgIndustrial = '/images/category/industrial.jpg';
const imgDEO = '/images/category/deo.jpg';
const imgMCO = '/images/category/mco.jpg';
const imgPCMO = '/images/category/pcmo.jpg';
import BackToTop from '../components/BackToTop';
import SEO from '../components/SEO';

const Home = () => {
  // (Replaced former productCategories section with Industries We Serve)

  const benefits = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Engine Protection',
      description: 'Advanced formulation provides superior engine protection against wear and tear'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Fuel Efficiency',
      description: 'Optimized viscosity reduces friction and improves fuel economy'
    },
    {
      icon: <Leaf className="h-8 w-8" />,
      title: 'Low Emissions',
      description: 'Environmentally conscious formulas reduce harmful emissions'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Quality Certified',
      description: 'Meets international standards and industry certifications'
    }
  ];

  return (
    <div className="pt-16">
      <SEO
        title="Power Drive Solution | Premium Automotive & Industrial Lubricants"
        description="High-performance automotive & industrial lubricants: diesel engine oils, gear oils, greases, motorcycle & passenger car motor oils. Engine protection & efficiency."
        canonical="https://powerdrivesolution.com.np/"
      />
      {/* Hero Section with Slider */}
      <HeroSlider />

      {/* Vision & Mission */}
      <section className="relative py-24 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-70">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#ffd347]/30 to-[#06477f]/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-[#06477f]/25 to-[#ffd347]/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-10 text-[#06477f] dark:text-[#ffd347]">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wider uppercase">Built on Purpose</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Our Vision */}
            <div className="group relative p-8 md:p-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all">
              <div className="absolute -z-0 inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#06477f]/10" />
              <div className="relative z-10 flex items-start gap-5">
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#06477f] to-[#0a5aa0] text-white flex items-center justify-center shadow-md">
                    <Target className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Our Vision</h3>
                  <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    To be the most trusted partner in powering mobility and industrial progress—delivering smart, reliable, and efficient solutions for every drive and direction.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Trust', 'Reliability', 'Efficiency', 'Smart Solutions'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-300">{tag}</span>
                ))}
              </div>
            </div>

            {/* Our Mission */}
            <div className="group relative p-8 md:p-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all">
              <div className="absolute -z-0 inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#ffd347]/10" />
              <div className="relative z-10 flex items-start gap-5">
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#ffd347] to-[#e2b928] text-gray-900 flex items-center justify-center shadow-md">
                    <Rocket className="h-7 w-7" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h3>
                  <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    We provide high-quality trading and supply chain solutions for the automotive and industrial sectors, driven by reliability, innovation, and a strong commitment to customer success.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Customer Success', 'Innovation', 'Quality', 'Supply Excellence'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-300">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Subtle accent border */}
          <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
        </div>
      </section>

      {/* Product Categories Banner */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
      {/* Gears & Transmission Oils */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgGTO})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">GEARS & TRANSMISSION OILS [GTO]</h3>
              <Link
                to="/products/gear-oil"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Gears & Transmission Products
              </Link>
            </div>
          </div>

      {/* Greases */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgGreases})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">GREASES</h3>
              <Link
                to="/products/greases"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Greases Products
              </Link>
            </div>
          </div>

      {/* Industrial Grades */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgIndustrial})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">INDUSTRIAL GRADES [IG]</h3>
              <Link
                to="/products/industrial-grades"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Industrial Grades Products
              </Link>
            </div>
          </div>

      {/* Diesel Engine Oils */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgDEO})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">DIESEL ENGINE OILS [DEO]</h3>
              <Link
                to="/products/diesel-engine-oil"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Diesel Engine Oil Products
              </Link>
            </div>
          </div>

      {/* Motorcycle Oils */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgMCO})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">MOTORCYCLE OILS [MCO]</h3>
              <Link
                to="/products/motorcycle-oil"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Motorcycle Oil Products
              </Link>
            </div>
          </div>

      {/* Passenger Car Motor Oils */}
          <div className="relative h-80 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imgPCMO})` }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
              <h3 className="text-xl lg:text-2xl font-bold mb-2">PASSENGER CAR MOTOR OILS [PCMO]</h3>
              <Link
                to="/products/petrol-engine-oil"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded transition-colors duration-300 font-semibold"
              >
                Passenger Car Oil Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Power Drive Solution?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our advanced formulations deliver superior performance across all automotive applications
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
              >
                <div className="text-brand-600 mb-4 group-hover:scale-110 transition-transform duration-200">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-To-Action */}
      <section className="relative py-24 text-white overflow-hidden bg-brand-600 dark:bg-brand-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">Ready to power your performance?</h2>
            <p className="mt-4 text-lg md:text-xl text-white/90 leading-relaxed">
              Talk to our experts about the right solution for your fleet, plant, or performance needs.
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#06477f] font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Quote
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 hover:backdrop-blur transition-all duration-300"
            >
              View Products
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </section>

      {/**
       * CTA Section (Disabled)
       * -------------------------------------------------------
       * This call-to-action block has been commented out per request.
       * Restore by removing this wrapping comment.
       */}
      {false && (
        <section className="py-20 bg-brand-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Experience Superior Performance?
            </h2>
            <p className="text-xl text-brand-100 mb-8 max-w-2xl mx-auto">
              Get in touch with our experts to find the perfect lubrication solution for your needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-brand-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Get Quote
              </Link>
              <Link
                to="/products"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-brand-600 transition-all duration-200 hover:scale-105"
              >
                View Products
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Home;