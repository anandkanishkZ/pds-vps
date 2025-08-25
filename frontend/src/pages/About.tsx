import { useEffect, useState } from 'react';
import { Shield, Award, Beaker, Zap, Users, Target, Rocket, ArrowRight, CheckCircle, Maximize2 } from 'lucide-react';
import BackToTop from '../components/BackToTop';

interface LeadershipProfile {
  id: string;
  name: string;
  title?: string | null;
  shortBio?: string | null;
  fullBio?: string | null;
  imageUrl?: string | null;
  status: 'active' | 'archived';
  sortOrder: number;
}
import { listLeadership, API_BASE } from '../lib/api';

const About = () => {
  const getInitials = (name: string) =>
    name
      .replace(/Mr\.?\s+/gi, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  const coreValues = [
    {
      icon: <Shield className="h-7 w-7" />,
      title: 'Reliability',
      description: 'Long-term partnerships built on consistency, trust and dependable delivery.'
    },
    {
      icon: <Award className="h-7 w-7" />,
      title: 'Quality',
      description: 'Every product we trade is vetted against rigorous performance standards.'
    },
    {
      icon: <Beaker className="h-7 w-7" />,
      title: 'Innovation',
      description: 'Forward-looking mindset embracing ideas and technologies that add real value.'
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: 'Efficiency',
      description: 'Streamlined, timely and cost-effective operations across the supply chain.'
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: 'Supportive Partnership',
      description: 'Working hand‑in‑hand to empower customer growth and progress.'
    }
  ];

  /*
   Preserved texts (not rendered) per request:
   - Regional Reach — Expanding presence with dependable supply and support.
   - Assured Quality — Products and processes aligned to rigorous standards.
   - Partner‑Centric — Collaboration that prioritizes uptime and outcomes.
  */

  const [leaders, setLeaders] = useState<LeadershipProfile[]>([]);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<LeadershipProfile | null>(null);
  const [modalEntering, setModalEntering] = useState(false);

  const openLeader = (person: LeadershipProfile) => {
    setSelectedLeader(person);
    // Next tick to allow mount before applying enter classes
    setTimeout(() => setModalEntering(true), 0);
  };
  // Load leadership members
  useEffect(() => {
    (async () => {
      try {
        setLoadingLeaders(true);
        const res = await listLeadership();
        setLeaders(res.data);
      } catch (e) {
        console.error('Failed to load leadership', e);
      } finally { setLoadingLeaders(false); }
    })();
  }, []);

  const closeLeader = () => {
    setModalEntering(false);
    // Wait for transition to complete before unmount
    setTimeout(() => setSelectedLeader(null), 200);
  };

  return (
    <div className="pt-16">
      {/* Hero (title only, solid background) */}
      <section className="relative overflow-hidden bg-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <h1 className="font-poppins text-4xl md:text-6xl font-bold tracking-tight">About Us</h1>
          <div className="mx-auto mt-5 h-1.5 w-28 rounded-full bg-[#ffd347]" />
          <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg text-white/90">
            Pds trusted for its innovation, performance and reliability.
          </p>
        </div>
      </section>

      {/* Intro Narrative */}
      <section className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-10 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-sm">
                <div className="absolute left-8 right-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd347] to-transparent" />
                <div className="space-y-6 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  <div>
                    <span className="inline-flex items-center rounded-full bg-[#06477f]/10 text-[#06477f] dark:text-[#ffd347] ring-1 ring-[#06477f]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      About Us
                    </span>
                    <h3 className="mt-4 font-poppins text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Power Drive Solution (PDS)</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Trusted for innovation, performance and reliability.</p>
                    <div className="mt-4 h-1 w-16 rounded-full bg-[#ffd347]" />
                  </div>
                  <p>
                    At <span className="text-brand-600 dark:text-brand-400 font-semibold">Power Drive Solution (PDS)</span>, we exist to support your drive—literally and figuratively. We trade and supply essential products that keep vehicles moving, industries operating and ambitions advancing.
                  </p>
                  <p>
                    Mobility sits at the heart of everything we do. Just as high‑quality engine oil ensures smooth movement and lasting performance, PDS is committed to being a reliable, efficient and innovative partner in every customer journey.
                  </p>
                  <p>
                    We specialize in trading and supplying products that drive both machines and industries—delivering not just goods, but value, trust and performance. Our aim is to empower customers with solutions that meet the highest standards of quality, reliability and efficiency every time.
                  </p>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" />
                      <span className="text-[15px] text-gray-700 dark:text-gray-300">Reliable trading and supply excellence</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" />
                      <span className="text-[15px] text-gray-700 dark:text-gray-300">Efficient operations and timely delivery</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" />
                      <span className="text-[15px] text-gray-700 dark:text-gray-300">Partner‑first, long‑term relationships</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" />
                      <span className="text-[15px] text-gray-700 dark:text-gray-300">Products vetted to rigorous standards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm aspect-[4/3]">
                <img src="/images/logobg.jpg" alt="PDS brand background" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-900/60 transition-colors overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(560px_200px_at_20%_0%,#06477f12,transparent),radial-gradient(560px_200px_at_80%_100%,#ffd3471a,transparent)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          {/* Vision */}
          <div className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 md:p-10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#06477f] to-[#ffd347] opacity-30 blur-sm transition-opacity duration-300 group-hover:opacity-60" />
                <div className="relative w-14 h-14 rounded-full bg-white/90 dark:bg-gray-900/80 flex items-center justify-center shadow-md ring-1 ring-gray-200 dark:ring-gray-700 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
                  <Target className="h-7 w-7 text-[#06477f] dark:text-[#ffd347]" />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-[#06477f]/10 dark:bg-[#06477f]/20 text-[#06477f] dark:text-[#ffd347] ring-1 ring-[#06477f]/20 dark:ring-[#ffd347]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">Our Vision</span>
                <h2 className="mt-3 font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
                <p className="mt-3 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
                  To be the most trusted partner in powering mobility and industrial progress—delivering smart, reliable, and efficient solutions for every drive and direction.
                </p>
                <ul className="mt-5 space-y-2.5">
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Partner‑first, long‑term relationships</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Smart, reliable and efficient solutions</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Sustained impact across mobility & industry</span></li>
                </ul>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#06477f]/25 pointer-events-none" />
          </div>

          {/* Mission */}
          <div className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 md:p-10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#ffd347] via-[#ffd347] to-[#06477f] opacity-30 blur-sm transition-opacity duration-300 group-hover:opacity-60" />
                <div className="relative w-14 h-14 rounded-full bg-white/90 dark:bg-gray-900/80 flex items-center justify-center shadow-md ring-1 ring-gray-200 dark:ring-gray-700 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
                  <Rocket className="h-7 w-7 text-[#06477f] dark:text-[#ffd347]" />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center rounded-full bg-[#ffd347]/20 text-gray-900 ring-1 ring-[#ffd347]/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">Our Mission</span>
                <h2 className="mt-3 font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                <p className="mt-3 text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed">
                  We provide high-quality trading and supply chain solutions for the automotive and industrial sectors, driven by reliability, innovation, and a strong commitment to customer success.
                </p>
                <ul className="mt-5 space-y-2.5">
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Rigorous product standards & compliance</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Efficient operations, on‑time fulfilment</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-[#06477f] dark:text-[#ffd347] mt-0.5" /><span className="text-sm text-gray-700 dark:text-gray-300">Customer success as the outcome</span></li>
                </ul>
              </div>
            </div>
            <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-[#ffd347]/30 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Core Values</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">Principles that shape every decision, relationship and result at PDS.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {coreValues.map(v => (
              <div key={v.title} className="group relative rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-brand-600 group-hover:scale-110 transition-transform">{v.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                    {v.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {v.description}
                </p>
                <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-brand-500/30 pointer-events-none transition" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#06477f33,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-5">Leadership Team</h2>
            <p className="text-gray-300 text-lg leading-relaxed">Experienced, multi‑disciplinary leadership combining finance, automotive, lubricants, distribution, logistics and development sector expertise.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {loadingLeaders && <div className="col-span-full text-center text-gray-400 py-10">Loading leadership...</div>}
            {leaders.map(person => (
              <div
                key={person.id}
                role="button"
                tabIndex={0}
                onClick={() => openLeader(person)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLeader(person); } }}
                className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-850/90 border border-gray-700/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
              >
                {/* Photo */}
                <div className="relative aspect-[16/9] w-full">
                  {person.imageUrl ? (
                    <img src={person.imageUrl.startsWith('http') ? person.imageUrl : API_BASE.replace(/\/$/, '') + (person.imageUrl.startsWith('/') ? person.imageUrl : '/' + person.imageUrl)} alt={person.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-500">
                      <span className="font-poppins text-2xl font-semibold text-white">{getInitials(person.name)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white ring-1 ring-white/20">
                      <Maximize2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                {/* Content */}
                <div className="p-6">
                  <h3 className="font-poppins text-2xl font-semibold tracking-tight text-white">
                    {person.name}
                  </h3>
                  <p className="text-brand-300 font-medium uppercase text-xs tracking-wider mt-1">{person.title}</p>
                  <p className="mt-4 text-sm md:text-[15px] text-gray-300 leading-relaxed line-clamp-4">
                    {person.shortBio || person.fullBio}
                  </p>
                  {/* Card is clickable; button removed */}
                </div>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-brand-500/40 transition pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leader Modal */}
      {selectedLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${modalEntering ? 'opacity-100' : 'opacity-0'}`} onClick={closeLeader} />
          <div role="dialog" aria-modal="true" className={`relative z-10 w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 p-5 md:p-6 shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 transform transition-all duration-200 ${modalEntering ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-poppins text-2xl font-bold text-gray-900 dark:text-white">{selectedLeader.name}</h3>
                <p className="text-brand-600 dark:text-brand-300 font-medium uppercase text-xs tracking-wider mt-1">{selectedLeader.title}</p>
              </div>
              <button onClick={closeLeader} aria-label="Close" className="rounded-md p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
                ✕
              </button>
            </div>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
        {selectedLeader.imageUrl && (
          <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800 aspect-[4/5] md:aspect-auto md:h-[50vh]">
          <img src={selectedLeader.imageUrl.startsWith('http') ? selectedLeader.imageUrl : API_BASE.replace(/\/$/, '') + (selectedLeader.imageUrl.startsWith('/') ? selectedLeader.imageUrl : '/' + selectedLeader.imageUrl)} alt={selectedLeader.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                )}
              </div>
        <div className="md:max-h-[50vh] overflow-y-auto pr-1">
        <p className="text-sm md:text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{selectedLeader.fullBio || selectedLeader.shortBio}</p>
              </div>
            </div>
          </div>
        </div>
      )}





      {/* CTA: Solid brand background, modern and simple */}
      <section className="py-16 bg-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Let’s build momentum together</h3>
          <p className="mt-3 text-white/90 max-w-2xl mx-auto">Talk to our team about supply, distribution or partnership opportunities tailored to your goals.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#06477f] font-semibold shadow hover:shadow-md transition">
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/dealership-inquiry" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition">
              Dealership Inquiry
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <BackToTop />
    </div>
  );
};

export default About;