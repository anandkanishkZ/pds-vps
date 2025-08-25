import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  useEffect(()=>{ if(typeof window!=='undefined'){ window.scrollTo({top:0,behavior:'smooth'});} },[]);
  const sections: Array<{ id:string; title:string; content: JSX.Element }> = [
    { id:'introduction', title:'1. Introduction', content:(<p>Welcome to Power Drive Solution ("we," "our," "us"). We value your privacy and have crafted this policy to explain how we collect, use, store, and protect your personal information. By using our website, you agree to the terms of this policy.</p>) },
    { id:'information-we-collect', title:'2. Information We Collect', content:(<div className="space-y-4"><div><p className="font-semibold text-sm tracking-wide text-slate-700 dark:text-slate-300">Personal Information:</p><p>Includes data you voluntarily provide, such as your name, email address, phone number, company name, and inquiry details.</p></div><div><p className="font-semibold text-sm tracking-wide text-slate-700 dark:text-slate-300">Non-Personal Information:</p><p>Automatically collected information such as your IP address, browser type, device type, operating system, pages visited, and referral source.</p></div></div>) },
    { id:'how-we-use', title:'3. How We Use Your Information', content:(<ul className="list-disc pl-6 space-y-2">{['Respond to inquiries or fulfill requests (e.g., quotes or contact forms).','Provide and improve our services and website functionality.','Communicate with you regarding your requests or updates about our services (if you opt in).','Monitor usage patterns and enhance user experience.'].map(i=> <li key={i}>{i}</li>)}</ul>) },
    { id:'cookies', title:'4. Cookies and Tracking Technologies', content:(<p>Our website may use cookies or similar technologies to improve navigation and performance. You can configure your browser settings to reject cookies, although this may limit certain site functionalities.</p>) },
    { id:'sharing', title:'5. Information Sharing', content:(<p>We do not sell, rent, or trade your personal information to third parties. We may share aggregated (non-identifiable) data with trusted partners for analytic or promotional purposes.</p>) },
    { id:'security', title:'6. Data Security', content:(<p>We employ reasonable security measures to protect data from unauthorized access, alteration, or disclosure. However, no method is entirely foolproof.</p>) },
    { id:'retention', title:'7. Retention of Data', content:(<p>We retain personal information only as long as necessary to fulfill the purposes outlined in this policy or as required by law.</p>) },
    { id:'external-links', title:'8. External Links', content:(<p>Our website may include links to external sites. This Privacy Policy applies only to our site. Please review the privacy practices of any linked website.</p>) },
    { id:'children', title:"9. Children's Privacy", content:(<p>We do not knowingly collect any personal information from children under 13 years of age. If we become aware of such data, we will take steps to promptly delete it.</p>) },
    { id:'changes', title:'10. Changes to This Policy', content:(<p>We may update this Privacy Policy at our discretion. Changes will be posted here with a revised effective date. Continued use of our site after changes indicates your acceptance of those changes.</p>) },
    { id:'contact', title:'11. Contact Us', content:(<div className="space-y-2"><p>For any questions or concerns regarding this policy or your personal data, please contact us:</p><p className="font-medium">Power Drive Solution</p><p>Email: <a href="mailto:info@powerdrivesolution.com.np" className="text-brand-600 dark:text-brand-400 hover:underline">info@powerdrivesolution.com.np</a></p><p>Address: Jwagal 11, Lalitpur, Nepal</p></div>) }
  ];
  return (
    <div className="pt-16">
      <SEO
        title="Privacy Policy | Power Drive Solution"
        description="Read the Privacy Policy for Power Drive Solution detailing how we collect, use, and protect your personal information."
        canonical="https://powerdrivesolution.com.np/privacy"
        noIndex={false}
      />
      <section className="py-14 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs mb-4 text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Privacy Policy</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed text-sm md:text-base">This Privacy Policy explains how we handle your information when you interact with Power Drive Solution online.</p>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 order-last lg:order-first">
            <div className="sticky top-28 space-y-1 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm">
              {sections.map(s=> (
                <a key={s.id} href={`#${s.id}`} className="block px-3 py-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-gray-800 transition-colors">{s.title.replace(/^[0-9]+\.\s*/, '')}</a>
              ))}
            </div>
          </aside>
          <div className="prose dark:prose-invert max-w-none lg:col-span-8">
            {sections.map(s=> (
              <section id={s.id} key={s.id} className="scroll-mt-24 mb-10">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-4">{s.title}</h2>
                <div className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300 space-y-4">
                  {s.content}
                </div>
              </section>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-12">Effective Date: {new Date().getFullYear()}-08-01 (Update this date when the policy changes)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
