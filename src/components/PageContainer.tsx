import React, { ReactNode, useState, useEffect } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
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
    </div>
  );
};

export default PageContainer;