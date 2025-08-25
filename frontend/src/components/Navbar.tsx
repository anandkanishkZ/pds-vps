import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Added Layers icon for the new design
import { X, ArrowRight, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Product categories state
  type Category = { id: string | number; name: string; slug?: string; status?: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const catMenuRef = useRef<HTMLDivElement | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    setCatLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/products/categories`)
      .then(res => res.json())
      .then((data: { data: Category[] }) => {
        if (Array.isArray(data?.data)) {
          setCategories(data.data);
          if (data.data.length === 0) {
            setCatError('No categories found');
          }
        } else {
          setCategories([]);
          setCatError('No categories found');
        }
        setCatLoading(false);
      })
      .catch(() => {
        setCatError('Failed to load categories');
        setCatLoading(false);
      });
  }, []);

  // Close submenu on outside click
  useEffect(() => {
    if (!catMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (catMenuRef.current && e.target instanceof Node && !catMenuRef.current.contains(e.target)) {
        setCatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [catMenuOpen]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products', isProducts: true },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Career', path: '/career' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleNavClick = (item: { name: string; path: string }, event: React.MouseEvent) => {
    if (location.pathname === item.path) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // --- Animation Variants for Framer Motion ---

  // Main dropdown container animation
  const menuVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2, ease: 'easeInOut' as const } },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: 'easeInOut' as const } }
  };

  // Staggered list container
  const listContainerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.06, // Each item will animate 60ms after the previous one
      }
    }
  };
  
  // Staggered list item animation
  const listItemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeInOut' as const } }
  };

  const mobileSubMenuVariants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0 },
    open: { 
      height: 'auto', 
      opacity: 1, 
      marginTop: '0.25rem',
      transition: { duration: 0.4, ease: 'easeInOut' as const }
    }
  };

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
              {navItems.map((item) =>
                item.isProducts ? (
                  // --- START: REDESIGNED DESKTOP PRODUCTS SUBMENU ---
                  <div 
                    key={item.name} 
                    className="relative" 
                    onMouseEnter={() => setCatMenuOpen(true)}
                    onMouseLeave={() => setCatMenuOpen(false)}
                    ref={catMenuRef}
                  >
                    <Link
                      to={item.path}
                      aria-haspopup="menu"
                      aria-expanded={catMenuOpen}
                      className={`relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 rounded-lg group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 flex items-center gap-1.5 ${
                        location.pathname.startsWith('/products')
                          ? 'text-white'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10">{item.name}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${catMenuOpen ? 'rotate-180' : ''}`} />
                       <div className={`absolute inset-0 transition-all duration-500 rounded-lg pointer-events-none ${
                        location.pathname.startsWith('/products') || catMenuOpen
                          ? 'bg-white/10 backdrop-blur-sm'
                          : 'opacity-0 group-hover:opacity-20 bg-white/5'
                      }`} />
                    </Link>

                    <AnimatePresence>
                      {catMenuOpen && (
                        <motion.div
                          variants={menuVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="absolute left-0 top-full mt-3 w-72 rounded-xl bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl ring-1 ring-white/10 p-3 border border-slate-700/50 z-50"
                          role="menu"
                        >
                          <motion.div
                            variants={listContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1"
                          >
                            <motion.div variants={listItemVariants}>
                                <div className="px-3 py-1 text-xs font-bold uppercase text-[#ffd347] tracking-wider">
                                  Categories
                                </div>
                            </motion.div>
                            
                            {catLoading && <div className="px-3 py-2 text-xs text-slate-400">Loading...</div>}
                            {catError && <div className="px-3 py-2 text-xs text-rose-400">{catError}</div>}
                            
                            <motion.div variants={listItemVariants}>
                              <Link to="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-[#fec216]/20 transition group" onClick={()=>setCatMenuOpen(false)}>
                                <Layers className="h-4 w-4 text-[#fec216]/80" />
                                <span className="flex-1">All Products</span>
                                <ArrowRight className="h-4 w-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            </motion.div>

                            {categories.map((cat) => (
                              <motion.div variants={listItemVariants} key={cat.id}>
                                <Link
                                  to={`/products/category/${cat.slug || cat.id}`}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:bg-[#fec216]/20 transition group"
                                  onClick={()=>setCatMenuOpen(false)}
                                >
                                  <span className="w-4 h-4 flex items-center justify-center">
                                    <span className="block w-1.5 h-1.5 bg-white/50 rounded-full group-hover:bg-[#ffd347] transition-colors"></span>
                                  </span>
                                  <span className="flex-1">{cat.name}</span>
                                  <ArrowRight className="h-4 w-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  // --- END: REDESIGNED DESKTOP PRODUCTS SUBMENU ---
                ) : (
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
                )
              )}
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
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'} pointer-events-auto`}
        />
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
            {navItems.map((item, index) =>
              item.isProducts ? (
                // --- Mobile Products Submenu (Unchanged, but still good) ---
                <div key={item.name}>
                  <div
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-medium text-base tracking-wide relative group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 transition-all duration-300 transform ${
                      isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                    } ${location.pathname.startsWith('/products') ? 'text-white bg-white/10 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    style={{ transitionDelay: isOpen ? `${index * 100}ms` : '0ms' }}
                  >
                    <Link
                      to={item.path}
                      className="flex-grow"
                      onClick={() => { setIsOpen(false); }}
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      aria-label="Show product categories"
                      onClick={() => setCatMenuOpen((v) => !v)}
                      className="p-2 -mr-2 rounded-full hover:bg-white/20 transition-colors"
                      aria-expanded={catMenuOpen}
                    >
                       <motion.div animate={{ rotate: catMenuOpen ? 180 : 0 }}>
                        <ChevronDown className="h-5 w-5"/>
                      </motion.div>
                    </button>
                  </div>

                  <AnimatePresence>
                    {catMenuOpen && (
                      <motion.div
                        key="mobile-cat-submenu"
                        variants={mobileSubMenuVariants}
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        className="overflow-hidden pl-5"
                      >
                        <div className="border-l-2 border-[#fec216]/30 pl-4 mt-1 space-y-1">
                          {catLoading && <div className="px-3 py-2 text-xs text-white/60">Loading...</div>}
                          {catError && <div className="px-3 py-2 text-xs text-rose-300">{catError}</div>}
                          <Link to="/products" className="block py-2 text-sm text-white/80 hover:text-white" onClick={() => setIsOpen(false)}>All Products</Link>
                          {categories.map((cat) => (
                            <Link
                              key={cat.id}
                              to={`/products/category/${cat.slug || cat.id}`}
                              className="block py-2 text-sm text-white/80 hover:text-white"
                              onClick={() => setIsOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => {
                    handleNavClick(item, e);
                    setIsOpen(false);
                  }}
                  className={`block px-4 py-3 rounded-xl font-medium text-base tracking-wide relative group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 transition-all duration-300 transform ${
                    isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                  } ${location.pathname === item.path ? 'text-white bg-white/10 shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  style={{ transitionDelay: isOpen ? `${index * 100}ms` : '0ms' }}
                >
                  <span className="relative z-10 flex items-center justify-between">
                    {item.name}
                    {location.pathname === item.path && <span className="w-2 h-2 rounded-full bg-[#fec216]" />}
                  </span>
                  <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-white/5 transition`}></span>
                </Link>
              )
            )}
          </div>
          <div className="px-5 pb-8">
            <Link
              to="/dealership-inquiry"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center justify-center gap-2 bg-[#fec216] text-[#06477f] py-3 rounded-xl font-semibold tracking-wide text-sm shadow-lg shadow-black/30 hover:bg-[#ffd347] hover:scale-[1.03] transition-all duration-300 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fec216]/70 ${
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: isOpen ? '400ms' : '0ms' }}
            >
              <span>Dealership Inquiry</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className={`mt-4 text-[10px] text-white/40 text-center transition-all duration-300 transform ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: isOpen ? '500ms' : '0ms' }}>© 2025 PDS</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;