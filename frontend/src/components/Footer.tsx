import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  return (
  <footer
    className="relative overflow-hidden text-white/90 selection:bg-[#fec216]/30"
    style={{
      background: `radial-gradient(circle at 18% 28%, rgba(0, 0, 0, 0.55), transparent 60%),
                  radial-gradient(circle at 82% 70%, rgba(0, 0, 0, 0.45), transparent 65%),
                  linear-gradient(135deg,#06477f 0%,#043a68 55%,#032f55 100%)`,
      backgroundBlendMode: 'overlay'
    }}
  >
      {/* Top accent bar */}
      <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fec216] via-[#ffd347] to-[#fec216] opacity-90" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-5">
            <Logo size="md" variant="color" withTagline={false} plainColor="#fec216" />
            <p className="text-sm leading-relaxed text-white/75">
              Leading manufacturer of premium automobile oils & lubricants engineered for performance, reliability and long-term protection.
            </p>
            <div className="flex space-x-3 pt-1">
              {[
                { Icon: Facebook, label: 'Facebook' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' }
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/10 hover:bg-white/15 hover:ring-white/30 transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70"
                >
                  <Icon className="h-5 w-5 text-white/80 group-hover:text-[#fec216] transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Products', path: '/products' },
                { name: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.name} className="group">
                  <Link
                    to={item.path}
                    className="inline-flex items-center gap-2 text-white/70 hover:text-[#fec216] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 rounded"
                  >
                    <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#fec216] after:to-[#ffd347] after:transition-all after:duration-300 group-hover:after:w-full">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
      <div>
    <h3 className="footer-heading">Our Products</h3>
      <ul className="space-y-2.5 text-sm">
              {[
                'Diesel Engine Oils',
                'Petrol Engine Oils',
                'Gear Oils',
                'Hydraulic Oils',
                'Industrial Lubricants'
              ].map((item) => (
    <li key={item} className="group">
                  <Link
                    to="/products"
  className="inline-block text-white/70 hover:text-[#fec216] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 rounded"
                  >
        <span className="relative after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#fec216]/90 after:transition-all after:duration-300 group-hover:after:w-full">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="footer-heading">Contact Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3 group">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 group-hover:bg-white/15 group-hover:ring-white/30 transition"><MapPin className="h-5 w-5 text-[#fec216]" /></span>
                <span className="pt-0.5 text-white/75 group-hover:text-white transition-colors">Jwagal 11, Lalitpur, Nepal</span>
              </div>
              <div className="flex items-start space-x-3 group">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 group-hover:bg-white/15 group-hover:ring-white/30 transition"><Phone className="h-5 w-5 text-[#fec216]" /></span>
                <span className="pt-0.5 text-white/75 group-hover:text-white transition-colors">01-5404222</span>
              </div>
              <div className="flex items-start space-x-3 group">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 group-hover:bg-white/15 group-hover:ring-white/30 transition"><Mail className="h-5 w-5 text-[#fec216]" /></span>
                <span className="pt-0.5 text-white/75 group-hover:text-white transition-colors">info@powerdrivesolution.com.np</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-white/10 relative">
          <span className="absolute -top-[2px] left-0 h-0.5 w-32 bg-gradient-to-r from-[#fec216] via-[#ffd347] to-transparent" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs md:text-sm text-white/60 order-1 md:order-none">© 2025 Power Drive Solution. All rights reserved.</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-xs md:text-sm order-2 md:order-none">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3 justify-center">
                <Link
                  to="/privacy"
                  className="relative text-white/60 hover:text-[#fec216] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 rounded px-0.5 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#fec216] after:transition-all after:duration-300 hover:after:w-full"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="relative text-white/60 hover:text-[#fec216] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 rounded px-0.5 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0 after:bg-[#fec216] after:transition-all after:duration-300 hover:after:w-full"
                >
                  Terms of Service
                </Link>
              </div>
              <div className="text-white/60 text-center flex items-center justify-center gap-1 whitespace-nowrap">
                <span>Developed by</span>
                <a
                  href="https://anayainfotech.com.np" target="_blank" rel="noopener noreferrer"
                  className="text-[#fec216] hover:text-[#ffd347] font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 rounded"
                >Anaya Infotech</a>
              </div>
            </div>
          </div>
        </div>
        {/* Utility heading style */}
        <style>{`
          .footer-heading { font-size:15px; font-weight:600; letter-spacing:.025em; margin-bottom:1.25rem; position:relative; display:inline-block; }
          .footer-heading:after { content:''; position:absolute; left:0; bottom:-4px; height:3px; width:48px; background:linear-gradient(90deg,#fec216,#ffd347,transparent); border-radius:9999px; }
        `}</style>
      </div>
    </footer>
  );
};

export default Footer;