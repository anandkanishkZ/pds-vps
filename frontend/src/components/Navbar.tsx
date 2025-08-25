import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen]);

  // no admin/auth controls in public navbar

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Career', path: '/career' },
  { name: 'Contact', path: '/contact' },
  ];

  // Handle navigation click - scroll to top if already on the same page
  const handleNavClick = (item: { name: string; path: string }, event: React.MouseEvent) => {
    if (location.pathname === item.path) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ...

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled ? 'shadow-lg shadow-black/30' : 'shadow-md'
      }`}
      style={{
        background: 'linear-gradient(135deg,#06477f 0%,#053d6e 60%,#032f55 100%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isScrolled ? 'h-16' : 'h-20'} transition-all duration-500`}>
          <Link 
            to="/" 
            className="group flex items-center space-x-3"
            onClick={(e) => handleNavClick({ name: 'Home', path: '/' }, e)}
          >
            <Logo size="md" variant="color" plainColor="#ffd347" showText={false} />
            <div className="hidden md:flex flex-col">
              <h1 className="text-white font-bold text-xl tracking-wide">Power Drive Solution</h1>
              <p className="text-[#ffd347] text-sm font-medium tracking-wide">Your Drive, Our Support</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => handleNavClick(item, e)}
                  className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded-lg group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 ${
                    location.pathname === item.path
                      ? 'text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">
                    {item.name}
                    {location.pathname === item.path && (
                      <span className="block mt-1 h-[3px] w-full rounded-full bg-gradient-to-r from-[#fec216] via-[#ffd347] to-[#fec216]" />
                    )}
                  </span>
                  <div className={`absolute inset-0 transition-all duration-500 rounded-lg pointer-events-none ${
                    location.pathname === item.path
                      ? 'bg-white/10 backdrop-blur-sm'
                      : 'opacity-0 group-hover:opacity-20 bg-white/5'
                  }`} />
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Link
              to="/dealership-inquiry"
              className="bg-[#fec216] text-[#06477f] px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-[#ffd347] hover:scale-[1.04] shadow-lg shadow-black/30 hover:shadow-xl flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70"
            >
              <span>Dealership Inquiry</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {/* Admin controls removed from public navbar */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              aria-label="Toggle navigation"
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/10 hover:ring-white/30 overflow-hidden group transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/0 via-white/10 to-white/0 transition-opacity" />
              <div className="space-y-1.5 relative z-10">
                <span className={`block h-0.5 w-6 bg-white transition-all duration-500 ease-in-out ${isOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-500 ease-in-out ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}></span>
                <span className={`block h-0.5 w-6 bg-white transition-all duration-500 ease-in-out ${isOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Off-Canvas */}
      <div className={`md:hidden fixed inset-0 z-40 pointer-events-none ${isOpen ? '' : 'hidden'}`}> 
        {/* Overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'} pointer-events-auto`}
        />
        {/* Sliding Panel */}
  <div className={`absolute top-0 left-0 h-full w-[78%] max-w-sm flex flex-col bg-gradient-to-b from-[#06477f] via-[#053d6e] to-[#032f55] shadow-2xl ring-1 ring-white/10 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} pointer-events-auto`}>          
          <div className="flex items-center justify-between px-5 pt-5 pb-4 sticky top-0 z-10 bg-gradient-to-b from-[#06477f] via-[#053d6e] to-[#032f55] backdrop-blur-sm">
            <Logo size="sm" variant="color" plainColor="#ffd347" showText={false} />
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 hover:ring-white/30 transition"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
            {navItems.map((item, index) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => {
                  handleNavClick(item, e);
                  setIsOpen(false);
                }}
                className={`block px-4 py-3 rounded-xl font-medium text-base tracking-wide relative group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 transition-all duration-300 transform ${
                  isOpen 
                    ? 'translate-x-0 opacity-100' 
                    : 'translate-x-8 opacity-0'
                } ${location.pathname === item.path ? 'text-white bg-white/10 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                style={{
                  transitionDelay: isOpen ? `${index * 100}ms` : '0ms'
                }}
              >
                <span className="relative z-10 flex items-center justify-between">
                  {item.name}
                  {location.pathname === item.path && <span className="w-2 h-2 rounded-full bg-[#fec216]" />}
                </span>
                <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-white/5 transition`}></span>
              </Link>
            ))}
            {/* Admin link removed from mobile menu */}
          </div>
          <div className="px-5 pb-8">
            <Link
              to="/dealership-inquiry"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center justify-center gap-2 bg-[#fec216] text-[#06477f] py-3 rounded-xl font-semibold tracking-wide text-sm shadow-lg shadow-black/30 hover:bg-[#ffd347] hover:scale-[1.03] transition-all duration-300 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 ${
                isOpen 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}
              style={{
                transitionDelay: isOpen ? '400ms' : '0ms'
              }}
            >
              <span>Dealership Inquiry</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            {/* Logout removed from mobile menu */}
            <p className={`mt-4 text-[10px] text-white/40 text-center transition-all duration-300 transform ${
              isOpen 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-4 opacity-0'
            }`}
            style={{
              transitionDelay: isOpen ? '500ms' : '0ms'
            }}>© 2025 PDS</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;