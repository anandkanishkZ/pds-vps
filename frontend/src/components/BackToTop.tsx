import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-brand-600 hover:bg-brand-700 dark:bg-brand-600 dark:hover:bg-brand-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label="Back to top"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default BackToTop;
