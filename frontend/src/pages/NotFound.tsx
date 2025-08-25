import { Link } from 'react-router-dom';
import { Home, Briefcase, Search, Phone, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

const NotFound = () => {
  const [isAnimated, setIsAnimated] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  const quickLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Products', path: '/products', icon: Search },
    { name: 'Gallery', path: '/gallery', icon: Camera },
    { name: 'Career', path: '/career', icon: Briefcase },
    { name: 'Contact', path: '/contact', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        {/* 404 Animation */}
        <div className={`mb-8 transition-all duration-1000 ${isAnimated ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-90'}`}>
          <div className="relative">
            <h1 className="text-[12rem] md:text-[16rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06477f] via-[#fec216] to-[#06477f] leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 text-[12rem] md:text-[16rem] font-bold text-[#06477f]/10 dark:text-white/5 leading-none animate-pulse">
              404
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className={`mb-12 transition-all duration-1000 delay-300 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
            Don't worry, even the best engines need a little direction sometimes!
          </p>
        </div>

        {/* Logo and Brand */}
        <div className={`mb-12 transition-all duration-1000 delay-500 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <div className="flex items-center justify-center mb-6">
            <Logo 
              size="lg" 
              variant={theme === 'dark' ? 'color' : 'black'}
              showText={true} 
              withTagline={true}
              plainColor={theme === 'dark' ? '#ffffff' : '#06477f'}
              taglineColor="#fec216"
              className="scale-110"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className={`mb-12 transition-all duration-1000 delay-700 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            Where would you like to go?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {quickLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700 hover:border-[#fec216] dark:hover:border-[#fec216]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-[#06477f] dark:text-[#fec216] mb-3 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 mx-auto" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-[#06477f] dark:group-hover:text-[#fec216] transition-colors duration-300">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Back to Home Button */}
        <div className={`transition-all duration-1000 delay-900 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#06477f] to-[#053d6e] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#06477f]/30 group"
          >
            <Home className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Home
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              →
            </div>
          </Link>
        </div>

        {/* Search Suggestion */}
        <div className={`mt-12 transition-all duration-1000 delay-1100 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Looking for our products? Try our{' '}
            <Link 
              to="/products" 
              className="text-[#06477f] dark:text-[#fec216] font-medium hover:underline"
            >
              Products page
            </Link>
            {' '}or{' '}
            <Link 
              to="/contact" 
              className="text-[#06477f] dark:text-[#fec216] font-medium hover:underline"
            >
              contact us
            </Link>
            {' '}for assistance.
          </p>
        </div>

        {/* Floating Elements for Visual Appeal */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-[#fec216]/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#06477f]/10 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-5 w-16 h-16 bg-gradient-to-r from-[#06477f]/10 to-[#fec216]/10 rounded-full blur-xl animate-pulse"></div>
      </div>
    </div>
  );
};

export default NotFound;
