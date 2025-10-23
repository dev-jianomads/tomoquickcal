import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = '',
  type = 'button',
  ...rest
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
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;