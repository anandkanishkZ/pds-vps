import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function TermsOfService(){
  useEffect(()=>{ if(typeof window!=='undefined'){ window.scrollTo({top:0,behavior:'smooth'});} },[]);

  const year = new Date().getFullYear();
  const sections: Array<{id:string; title:string; body: JSX.Element}> = [
    { id:'acceptance', title:'1. Acceptance of Terms', body:(<p>By accessing or using the Power Drive Solution ("PDS") website, products, media assets, or submitting inquiries, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must discontinue use immediately.</p>) },
    { id:'changes', title:'2. Changes to These Terms', body:(<p>We may update or modify these Terms at any time at our discretion. The updated version will be indicated by a revised effective date. Continued use after changes constitutes acceptance.</p>) },
    { id:'use-of-site', title:'3. Permitted Use of the Site', body:(<ul className="list-disc pl-6 space-y-2"><li>Browse product categories and related informational content.</li><li>Submit contact, dealership, or career inquiries using provided forms.</li><li>Access publicly available resources solely for personal or internal business evaluation.</li></ul>) },
    { id:'prohibited', title:'4. Prohibited Conduct', body:(<ul className="list-disc pl-6 space-y-2"><li>Reverse engineering, scraping, automated harvesting, or excessive API calls.</li><li>Uploading, transmitting, or linking to malware or harmful code.</li><li>Misrepresenting affiliation or impersonating another person or entity.</li><li>Using the platform to solicit unlawful activity or spam.</li><li>Removing or obscuring proprietary notices.</li></ul>) },
    { id:'accounts', title:'5. Accounts & Security (If/When Enabled)', body:(<p>Administrative or restricted areas may require authentication. You are responsible for safeguarding credentials and for all activities under your account. Notify us promptly of any unauthorized access.</p>) },
    { id:'inquiries', title:'6. Inquiries & Submissions', body:(<p>Information submitted through contact, dealership, or career forms must be truthful and lawfully yours to provide. You grant us a non-exclusive, worldwide, royalty-free license to process and store submitted content for operational, evaluation, or follow-up purposes.</p>) },
    { id:'product-info', title:'7. Product & Technical Information Disclaimer', body:(<p>Product descriptions, specifications, pack sizes, certifications, and technical data are provided for general informational purposes only and may change without notice. They do not constitute a binding offer, performance guarantee, or professional recommendation. Always consult a qualified technical representative for application-specific advice.</p>) },
    { id:'ip', title:'8. Intellectual Property', body:(<p>All trademarks, logos, brand elements, textual content, compiled data, custom UI components, and design assets are owned by Power Drive Solution or its licensors unless otherwise indicated. Unauthorized reproduction, redistribution, or derivative use is prohibited except as permitted under applicable law (e.g., fair use).</p>) },
    { id:'images', title:'9. Images & Third-Party Media Notice', body:(<div className="space-y-3"><p>The site may display images sourced from internal photography, licensed stock, manufacturer materials, or publicly available references (including images discovered via third-party search engines such as Google). Such imagery is used for illustrative purposes only.</p><ul className="list-disc pl-6 space-y-2"><li>We do not claim ownership over third-party marks or proprietary images unless explicitly stated.</li><li>If you are a rights holder and believe an asset is used improperly, contact us at <a href="mailto:info@powerdrivesolution.com.np" className="text-brand-600 dark:text-brand-400 hover:underline">info@powerdrivesolution.com.np</a> for prompt review or removal.</li><li>End users may not republish, redistribute, or commercially exploit images unless they have obtained the necessary rights or licenses.</li><li>We encourage transitioning any non-licensed or placeholder imagery to properly licensed or original media; updates may occur over time.</li></ul></div>) },
    { id:'privacy', title:'10. Privacy & Data Protection', body:(<p>Your use of the site is also governed by our <Link to="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</Link>, which explains how we collect, use, and safeguard personal information.</p>) },
    { id:'security', title:'11. Security Practices', body:(<p>We implement reasonable technical and organizational measures (including rate limiting, security headers, and controlled media serving) to mitigate risk. However, no platform is immune to vulnerabilities. You assume risk associated with internet transmission.</p>) },
    { id:'third-party', title:'12. Third-Party Links & Integrations', body:(<p>External links (social media, documents, or partner sites) are provided for convenience. We do not control and are not responsible for third-party content, availability, or practices.</p>) },
    { id:'disclaimers', title:'13. Disclaimers', body:(<div className="space-y-3"><p>The site and content are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including but not limited to merchantability, fitness for a particular purpose, title, or non-infringement.</p><p>We do not warrant uninterrupted availability, accuracy, completeness, or that defects will be corrected.</p></div>) },
    { id:'liability', title:'14. Limitation of Liability', body:(<p>To the maximum extent permitted by law, Power Drive Solution shall not be liable for any indirect, incidental, consequential, exemplary, or special damages (including lost profits, data loss, or business interruption) arising from or relating to your use of the site, even if advised of the possibility of such damages.</p>) },
    { id:'indemnity', title:'15. Indemnification', body:(<p>You agree to indemnify and hold harmless Power Drive Solution, its directors, employees, and partners from claims, liabilities, losses, or expenses (including reasonable legal fees) arising out of your misuse of the site, violation of these Terms, or infringement of third-party rights.</p>) },
    { id:'termination', title:'16. Suspension / Termination', body:(<p>We reserve the right to suspend or terminate access (including administrative accounts) at any time for violation of these Terms, suspected abuse, unlawful activity, or to protect system integrity.</p>) },
    { id:'governing-law', title:'17. Governing Law & Jurisdiction', body:(<p>Unless otherwise required by local law, these Terms are governed by the laws of Nepal. Any dispute shall be subject to the exclusive jurisdiction of the competent courts located in Nepal.</p>) },
    { id:'severability', title:'18. Severability', body:(<p>If any provision of these Terms is held unenforceable, the remaining provisions shall remain in full force and effect.</p>) },
    { id:'contact', title:'19. Contact Information', body:(<div className="space-y-2"><p>Questions about these Terms may be sent to:</p><p className="font-medium">Power Drive Solution</p><p>Email: <a href="mailto:info@powerdrivesolution.com.np" className="text-brand-600 dark:text-brand-400 hover:underline">info@powerdrivesolution.com.np</a></p><p>Address: Jwagal 11, Lalitpur, Nepal</p></div>) },
    { id:'legal-disclaimer', title:'20. Not Legal Advice', body:(<p>These Terms are provided for operational clarity and do not constitute legal advice. Consult qualified counsel to adapt for specific regulatory obligations (e.g., sector compliance, international data transfer, consumer protection).</p>) }
  ];

  return (
    <div className="pt-16">
      <SEO
        title="Terms of Service | Power Drive Solution"
        description="Terms governing use of the Power Drive Solution website, products, media, and inquiries. Read before using the site."
        canonical="https://powerdrivesolution.com.np/terms"
        noIndex={false}
      />
      <section className="py-14 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs mb-4 text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">Home</Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Terms of Service</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed text-sm md:text-base">These Terms govern your use of the Power Drive Solution website and related services. Review them carefully before continuing.</p>
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
                <div className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300 space-y-4">{s.body}</div>
              </section>
            ))}
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-12">Effective Date: {year}-08-01 (Update this date when changes are made)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
