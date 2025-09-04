import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: string;
  error?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  icon,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = () => {
    if (secureTextEntry && !showPassword) return 'password';
    if (keyboardType === 'email-address') return 'email';
    if (keyboardType === 'numeric') return 'number';
    if (keyboardType === 'phone-pad') return 'tel';
    if (keyboardType === 'url') return 'url';
    return 'text';
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-body-responsive font-quicksand-medium text-black mb-2">
          {label}
        </label>
      )}
      <div className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-black relative">
        {icon && (
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black">
            {/* Ícone genérico - pode ser customizado conforme necessário */}
            <div className="w-5 h-5" />
          </span>
        )}
        <input
          className={`flex-1 ${icon ? 'ml-8' : ''} text-body-responsive font-quicksand-medium text-black w-full bg-transparent outline-none`}
          type={inputType()}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CustomInput;