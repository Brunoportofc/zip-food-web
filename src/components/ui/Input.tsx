'use client';

import React, { forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // Propriedades do CustomInput para compatibilidade
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    helperText,
    variant = 'default',
    inputSize = 'md',
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    // Propriedades do CustomInput
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'none',
    icon,
    value,
    onChange,
    placeholder,
    ...props
  },
  ref
) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getInputType = () => {
    if (secureTextEntry && !showPassword) return 'password';
    if (keyboardType === 'email-address') return 'email';
    if (keyboardType === 'numeric') return 'number';
    if (keyboardType === 'phone-pad') return 'tel';
    if (keyboardType === 'url') return 'url';
    return props.type || 'text';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChangeText) {
      onChangeText(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };
  
  const baseClasses = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black';
  
  const variantClasses = {
    default: 'border border-gray-300 rounded-lg bg-white',
    filled: 'border-0 rounded-lg bg-gray-100 focus:bg-white',
    outlined: 'border-2 border-gray-300 rounded-lg bg-white'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  };
  
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  const iconPadding = leftIcon || icon ? 'pl-10' : (rightIcon || secureTextEntry) ? 'pr-10' : '';
  
  return (
    <div className={cn('flex flex-col', fullWidth && 'w-full')}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {(leftIcon || icon) && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon || icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={getInputType()}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[inputSize],
            errorClasses,
            widthClasses,
            iconPadding,
            className
          )}
          {...props}
        />
        
        {secureTextEntry && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        )}
        
        {rightIcon && !secureTextEntry && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-gray-500 text-sm mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;