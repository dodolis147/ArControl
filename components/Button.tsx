
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon, 
  className = '', 
  disabled,
  style,
  ...props 
}) => {
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm";
  
  const variants = {
    // Dynamic Primary color using CSS Variable
    primary: "bg-[var(--theme-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--theme-primary-light)]",
    secondary: "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200",
    danger: "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700",
    success: "bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700",
    ghost: "bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      style={style}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
};

export default Button;
