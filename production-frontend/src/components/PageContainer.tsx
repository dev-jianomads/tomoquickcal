import React, { ReactNode, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const checkScrollNeeded = () => {
      const hasVerticalScrollbar = document.documentElement.scrollHeight > window.innerHeight;
      const isNearTop = window.scrollY < 100;
      setShowScrollIndicator(hasVerticalScrollbar && isNearTop);
    };

    // Check on mount and resize
    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);
    window.addEventListener('scroll', checkScrollNeeded);

    return () => {
      window.removeEventListener('resize', checkScrollNeeded);
      window.removeEventListener('scroll', checkScrollNeeded);
    };
  }, []);

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative">
      <div className={`
        w-full max-w-md mx-auto
        flex flex-col items-center
        space-y-4 md:space-y-6
        p-6 md:p-8
        ${className}
      `}>
        {children}
      </div>
      
      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <button
          onClick={handleScrollDown}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10 
                     bg-white/90 backdrop-blur-sm border border-gray-200 
                     rounded-full p-3 shadow-lg hover:shadow-xl
                     transition-all duration-300 ease-in-out
                     animate-bounce hover:animate-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Scroll down to see more content"
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default PageContainer;