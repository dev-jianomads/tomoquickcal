import React, { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = ''
}) => {
  const baseClasses = `
    w-full max-w-80 px-6 py-3 rounded-lg font-medium
    transition-all duration-200 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variantClasses = {
    primary: `
      bg-indigo-600 text-white hover:bg-indigo-700 
      focus:ring-indigo-500 shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-gray-200 text-gray-800 hover:bg-gray-300 
      focus:ring-gray-500 border border-gray-300
    `
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;