import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Zap, Droplets, Thermometer, Settings, Award, ChevronDown, ChevronUp } from 'lucide-react';
import BackToTop from '../components/BackToTop';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Diesel Engine Oil Products Data
  const dieselOilProducts = [
    {
      id: 'HD-15W40',
      name: 'HD-15W40 (Heavy Duty)',
      grade: '15W-40',
      category: 'Diesel Engine Oils',
      shortDescription: 'Premium heavy-duty diesel engine oil formulated for commercial vehicles, buses, and industrial equipment operating under severe conditions.',
      longDescription: 'Our HD-15W40 Heavy Duty diesel engine oil delivers exceptional performance for commercial vehicles operating under severe conditions. Formulated with advanced additive technology and high-quality base oils, it provides outstanding protection against wear, oxidation, and deposits while maintaining optimal viscosity across a wide temperature range. Specifically designed for heavy-duty trucks, buses, and industrial equipment that require extended drain intervals and superior engine protection.',
      description: 'Premium heavy-duty diesel engine oil formulated for commercial vehicles, buses, and industrial equipment operating under severe conditions.',
      image: '/api/placeholder/600/600',
      price: 'Contact for pricing',
      inStock: true,
      features: ['Enhanced Protection', 'Extended Drain', 'All Season', 'Heavy Duty'],
      specifications: [
        { label: 'Viscosity Grade', value: '15W-40' },
        { label: 'API Classification', value: 'API CI-4/SL' },
        { label: 'Density at 15°C', value: '0.875 g/cm³' },
        { label: 'Flash Point', value: '≥ 210°C' },
        { label: 'Pour Point', value: '≤ -27°C' },
        { label: 'Viscosity Index', value: '≥ 125' }
      ],
      benefits: [
        {
          icon: <Shield className="h-6 w-6" />,
          title: 'Superior Protection',
          description: 'Advanced anti-wear additives protect critical engine components in extreme conditions.'
        },
        {
          icon: <Zap className="h-6 w-6" />,
          title: 'Extended Performance',
          description: 'Maintains performance over extended drain intervals, reducing maintenance costs.'
        },
        {
          icon: <Droplets className="h-6 w-6" />,
          title: 'Thermal Stability',
          description: 'Excellent thermal stability prevents oil breakdown in high-temperature operations.'
        },
        {
          icon: <Thermometer className="h-6 w-6" />,
          title: 'All Season',
          description: 'Performs consistently across wide temperature ranges and seasonal variations.'
        }
      ],
      applications: [
        'Heavy-duty trucks and buses',
        'Construction and mining equipment',
        'Agricultural machinery',
        'Marine diesel engines',
        'Industrial generators',
        'Commercial vehicle fleets'
      ],
      certifications: [
        'API CI-4/SL Certified',
        'ACEA E7 Approved',
        'OEM Manufacturer Approvals',
        'ISO 9001:2015 Quality Management'
      ]
    },
    {
      id: 'PREMIUM-5W30',
      name: 'Premium 5W-30 (Multi-Grade)',
      grade: '5W-30',
      category: 'Diesel Engine Oils',
      shortDescription: 'Advanced multi-grade diesel engine oil designed for modern Euro 5/6 engines with emission control systems.',
      longDescription: 'Our Premium 5W-30 Multi-Grade diesel engine oil represents the pinnacle of modern lubrication technology, specifically engineered for Euro 5/6 compliant engines with advanced emission control systems. This premium formulation combines synthetic base oils with cutting-edge additive packages to deliver superior fuel economy, reduced emissions, and enhanced cold-start performance while maintaining exceptional engine protection.',
      description: 'Advanced multi-grade diesel engine oil designed for modern Euro 5/6 engines with emission control systems.',
      image: '/api/placeholder/600/600',
      price: 'Contact for pricing',
      inStock: true,
      features: ['Low Emission', 'Fuel Economy', 'Multi-Grade', 'Euro 6 Ready'],
      specifications: [
        { label: 'Viscosity Grade', value: '5W-30' },
        { label: 'API Classification', value: 'API CK-4/SN' },
        { label: 'Density at 15°C', value: '0.855 g/cm³' },
        { label: 'Flash Point', value: '≥ 220°C' },
        { label: 'Pour Point', value: '≤ -35°C' },
        { label: 'Viscosity Index', value: '≥ 155' }
      ],
      benefits: [
        {
          icon: <Shield className="h-6 w-6" />,
          title: 'Emission Control',
          description: 'Low ash formulation protects DPF and emission control systems from clogging.'
        },
        {
          icon: <Zap className="h-6 w-6" />,
          title: 'Fuel Economy',
          description: 'Advanced low-friction formula improves fuel efficiency and reduces operating costs.'
        },
        {
          icon: <Droplets className="h-6 w-6" />,
          title: 'Cold Start',
          description: 'Superior cold-start performance ensures reliable operation in cold conditions.'
        },
        {
          icon: <Thermometer className="h-6 w-6" />,
          title: 'Engine Life',
          description: 'Extended engine life through advanced wear protection and deposit control.'
        }
      ],
      applications: [
        'Euro 5/6 diesel engines',
        'Light commercial vehicles',
        'Passenger car diesels',
        'Modern truck fleets',
        'Hybrid diesel systems',
        'Low emission zones'
      ],
      certifications: [
        'API CK-4/SN Certified',
        'ACEA C3 Approved',
        'Euro 6 Compliant',
        'Low SAPS Formula'
      ]
    },
    {
      id: 'TURBO-10W40',
      name: 'Turbo 10W-40 (Turbocharged)',
      grade: '10W-40',
      category: 'Diesel Engine Oils',
      shortDescription: 'Specialized formulation for turbocharged diesel engines providing superior protection under high-temperature, high-stress conditions.',
      longDescription: 'Our Turbo 10W-40 diesel engine oil is specifically engineered for turbocharged diesel engines operating under extreme conditions. This specialized formulation provides exceptional protection for turbocharger components while maintaining superior viscosity stability under high-temperature, high-stress operations. Ideal for performance-oriented applications where maximum protection and reliability are essential.',
      description: 'Specialized formulation for turbocharged diesel engines providing superior protection under high-temperature, high-stress conditions.',
      image: '/api/placeholder/600/600',
      price: 'Contact for pricing',
      inStock: true,
      features: ['Turbo Protection', 'High Temperature', 'Anti-Wear', 'Oxidation Stable'],
      specifications: [
        { label: 'Viscosity Grade', value: '10W-40' },
        { label: 'API Classification', value: 'API CI-4/SL' },
        { label: 'Density at 15°C', value: '0.870 g/cm³' },
        { label: 'Flash Point', value: '≥ 215°C' },
        { label: 'Pour Point', value: '≤ -30°C' },
        { label: 'Viscosity Index', value: '≥ 140' }
      ],
      benefits: [
        {
          icon: <Shield className="h-6 w-6" />,
          title: 'Turbo Protection',
          description: 'Specialized additives protect turbocharger bearings and components from damage.'
        },
        {
          icon: <Zap className="h-6 w-6" />,
          title: 'High Performance',
          description: 'Maintains performance under extreme temperature and pressure conditions.'
        },
        {
          icon: <Droplets className="h-6 w-6" />,
          title: 'Anti-Wear',
          description: 'Superior anti-wear properties protect engine components from metal-to-metal contact.'
        },
        {
          icon: <Thermometer className="h-6 w-6" />,
          title: 'Oxidation Stable',
          description: 'Resists oxidation and maintains viscosity under high-stress operations.'
        }
      ],
      applications: [
        'Turbocharged diesel engines',
        'High-performance commercial vehicles',
        'Industrial generators',
        'Marine applications',
        'Racing and performance vehicles',
        'Heavy-duty equipment'
      ],
      certifications: [
        'API CI-4/SL Certified',
        'ACEA E4/E7 Approved',
        'Turbocharger OEM Approved',
        'High Temperature Tested'
      ]
    }
  ];

  // Find the product based on the ID from URL
  const product = dieselOilProducts.find(p => p.id === id);

  // If product not found, redirect to diesel engine oil page
  if (!product) {
    return <Navigate to="/products/diesel-engine-oil" replace />;
  }

  // Common FAQ data
  const faqs = [
    {
      question: 'What makes this diesel oil different from conventional oils?',
      answer: 'Our Premium Diesel Engine Oil features advanced synthetic blend technology with superior additive packages that provide better protection, longer drain intervals, and improved fuel economy compared to conventional oils.'
    },
    {
      question: 'How often should I change this oil?',
      answer: 'Depending on operating conditions, this oil can extend drain intervals up to 50,000 km. However, we recommend following your equipment manufacturer\'s guidelines and conducting oil analysis for optimal maintenance scheduling.'
    },
    {
      question: 'Is this oil compatible with modern emission systems?',
      answer: 'Yes, this oil is specifically formulated to be compatible with modern diesel emission control systems including DPF, SCR, and EGR systems. It meets the latest API CK-4 and ACEA E9 specifications.'
    },
    {
      question: 'What packaging sizes are available?',
      answer: 'We offer this product in various packaging options including 1L, 4L, 20L, 208L drums, and bulk quantities. Contact us for specific packaging requirements and availability.'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'applications', label: 'Applications' },
    { id: 'certifications', label: 'Certifications' }
  ];

  return (
    <div className="pt-16">
      {/* Breadcrumb */}
      <section className="bg-gray-50 dark:bg-gray-900 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/products" className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition">
              Products
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{product.category}</span>
          </nav>
        </div>
      </section>

      {/* Product Hero */}
      <section className="py-12 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition mb-8 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-lg">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {product.grade}
                </span>
              </div>
              {product.inStock && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    In Stock
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-brand-600 dark:text-brand-400 font-medium text-sm tracking-wide uppercase mb-2">
                  {product.category}
                </p>
                <h1 className="font-poppins text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {product.name}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              <div className="flex items-center gap-4 py-4 border-y border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.price}
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-brand-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">API CK-4 Certified</span>
                </div>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Key Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contact"
                  className="flex-1 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-all duration-200 hover:scale-105 shadow-lg text-center"
                >
                  Request Quote
                </Link>
                <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center">
                  Download Datasheet
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-poppins text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Product Overview
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                    {product.longDescription}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">All Features</h4>
                    <ul className="space-y-3">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-600 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Key Specifications</h4>
                    <div className="space-y-3">
                      {product.specifications.slice(0, 4).map((spec, index) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400">{spec.label}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                <h3 className="font-poppins text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Technical Specifications
                </h3>
                <div className="grid gap-4">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{spec.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <h3 className="font-poppins text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Recommended Applications
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {product.applications.map((application, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Settings className="h-5 w-5 text-brand-600 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{application}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'certifications' && (
              <div>
                <h3 className="font-poppins text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Certifications & Approvals
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {product.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Award className="h-5 w-5 text-brand-600 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our Diesel Engine Oil?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Advanced engineering meets proven performance for your most demanding applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {product.benefits.map((benefit, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 text-white rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  {benefit.icon}
                </div>
                <h3 className="font-poppins text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get answers to common questions about our diesel engine oil.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition rounded-xl"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 rounded-2xl p-8 md:p-12">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Experience Superior Performance?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Contact our technical experts for personalized recommendations and competitive pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-brand-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-brand-700 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Get Quote Now
              </Link>
              <button className="border border-brand-600 text-brand-600 dark:text-brand-400 py-3 px-8 rounded-xl font-semibold hover:bg-brand-600 hover:text-white dark:hover:text-white transition-all duration-200">
                Technical Support
              </button>
            </div>
          </div>
        </div>
      </section>

      <BackToTop />
    </div>
  );
};

export default ProductDetail;