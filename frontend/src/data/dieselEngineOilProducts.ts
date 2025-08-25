// Central dataset for Diesel Engine Oil products used by listing & detail pages
export interface DieselEngineOilProduct {
  id: string;
  name: string;
  image: string;
  description: string;
  features: string[];
  viscosity: string;
  apiGrade: string;
  applications: string[];
  availablePacks?: string[]; // e.g. ["15 Ltr", "55 Ltr", "210 Ltr"]
  healthSafety?: string; // health / safety / storage / environmental note
}

export const dieselEngineOilProducts: DieselEngineOilProduct[] = [
  {
    id: 'fleet-master-green',
    name: 'FLEET MASTER GREEN 15W-40 CI-4+/SM',
    image: 'https://images.pexels.com/photos/97075/pexels-photo-97075.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: "Fleet Master Genuine CI-4 PLUS Oil 15W-40 GREEN is an extra high performance diesel engine oil that provides excellent lubrication of today’s diesel engines promoting extended engine life. This extra high performance has been proven in the field in a wide variety of industries, applications, and mixed fleets.",
    features: [
      'High thermal & oxidation stability',
      'Stay-in-grade shear stability',
      'Improved soot handling',
      'Start-up wear protection',
      'Improved viscosity control & used oil pumpability'
    ],
    viscosity: '15W-40',
    apiGrade: 'CI-4+/SM',
    applications: ['Heavy Duty Trucks', 'Construction Equipment', 'Agricultural Machinery', 'Marine Engines'],
    availablePacks: ['15 Ltr', '55 Ltr', '210 Ltr'],
    healthSafety: 'Based on current available information, this product is not expected to produce adverse effects on health when used for the intended application and in accordance with the recommendations provided in the Material Safety Data Sheet (MSDS). MSDSs are available upon request through your local sales office, or via the Internet. This product should not be used for purposes other than its intended use. When disposing of used product, take care to protect the environment and follow local legislation.'
  },
  {
    id: 'pride-ultra-diesel',
    name: 'PRIDE ULTRA-DIESEL 15W-40 CI-4/SM',
    // Replaced external image 279949 with local asset reference path (served from public folder)
    image: '/images/category/pcmo.jpg',
    description: 'SiBoil Diesel 15W-40 is a multi-grade engine oil with mineraloid synthesis basis for high-augmented diesel engines of passenger cars and trucks with turbocharge. Perfectly balanced additives effectively protect from wear-out and prevent corrosion. Reduces scooting and carbon formation. Provides safe lubrication and engine cleanliness at any usage conditions.',
    features: ['Multi-Grade Formula', 'Turbocharge Compatible', 'Anti-Corrosion', 'Reduced Carbon Formation'],
    viscosity: '15W-40',
    apiGrade: 'CI-4/SM',
    applications: ['Passenger Cars', 'Light Trucks', 'Turbocharged Engines', 'Commercial Vehicles']
  },
  {
    id: 'super-sonic-static',
    name: 'SUPER SONIC-STATIC 15W-40 CF-4/SL',
    image: 'https://images.pexels.com/photos/1118448/pexels-photo-1118448.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'SiBoil Static15W-40 is a multi-grade engine oil with mineral basis for high-augmented diesel engines of passenger cars and trucks with turbocharge. Perfectly balanced additives effectively protect from wear-out and prevent corrosion. Reduces scooting and carbon formation.',
    features: ['Multi-Grade Performance', 'Mineral Base', 'Wear Protection', 'Corrosion Prevention'],
    viscosity: '15W-40',
    apiGrade: 'CF-4/SL',
    applications: ['Diesel Engines', 'Truck Fleets', 'Industrial Equipment', 'Generator Sets']
  },
  {
    id: 'turbo-force-diesel',
    name: 'TURBO FORCE DIESEL 20W-50 CF-4',
    image: 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Premium heavy-duty diesel engine oil designed for turbocharged and naturally aspirated diesel engines. Provides excellent protection against wear, deposits, and oil degradation under severe operating conditions.',
    features: ['Heavy Duty Protection', 'Turbo Compatible', 'High Temperature Stability', 'Extended Drain Intervals'],
    viscosity: '20W-50',
    apiGrade: 'CF-4',
    applications: ['Heavy Duty Trucks', 'Mining Equipment', 'Power Generation', 'Marine Applications']
  },
  {
    id: 'economy-diesel-plus',
    name: 'ECONOMY DIESEL PLUS 15W-40 CH-4',
    image: 'https://images.pexels.com/photos/162553/keys-workshop-mechanic-tools-162553.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Cost-effective diesel engine oil that delivers reliable performance for conventional diesel engines. Formulated with quality base oils and additives to provide adequate protection for standard operating conditions.',
    features: ['Cost Effective', 'Reliable Performance', 'Standard Protection', 'Wide Compatibility'],
    viscosity: '15W-40',
    apiGrade: 'CH-4',
    applications: ['Conventional Engines', 'Fleet Operations', 'Agricultural Equipment', 'Construction Machinery']
  },
  {
    id: 'premium-diesel-elite',
    name: 'PREMIUM DIESEL ELITE 5W-30 CK-4',
    image: 'https://images.pexels.com/photos/919073/pexels-photo-919073.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Advanced synthetic blend diesel engine oil meeting the latest CK-4 specifications. Provides superior fuel economy, extended drain intervals, and exceptional protection for modern diesel engines with advanced emission control systems.',
    features: ['Synthetic Blend', 'Fuel Economy', 'CK-4 Specification', 'Emission Compatible'],
    viscosity: '5W-30',
    apiGrade: 'CK-4',
    applications: ['Modern Diesel Engines', 'Low Emission Vehicles', 'Highway Trucks', 'Urban Delivery']
  }
];

export const getDieselProductById = (id: string) => dieselEngineOilProducts.find(p => p.id === id);
