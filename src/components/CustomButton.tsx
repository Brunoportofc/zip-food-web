import React from 'react';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'black' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  const getButtonStyle = () => {
    const baseStyle = 'rounded-2xl py-4 px-6 font-quicksand-bold text-body-responsive border-2 transition-colors';
    
    switch (variant) {
      case 'primary':
        return `${baseStyle} bg-primary border-black text-black hover:bg-yellow-400`;
      case 'secondary':
        return `${baseStyle} bg-secondary border-black text-white hover:bg-blue-700`;
      case 'black':
        return `${baseStyle} bg-black border-primary text-primary hover:bg-zinc-800`;
      case 'outline':
        return `${baseStyle} bg-transparent border-primary text-primary hover:bg-primary/10`;
      default:
        return `${baseStyle} bg-primary border-black text-black hover:bg-yellow-400`;
    }
  };

  return (
    <button
      onClick={onPress}
      disabled={disabled || isLoading}
      className={`${getButtonStyle()} w-full flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          <span>Carregando...</span>
        </div>
      ) : (
        title
      )}
    </button>
  );
};

export default CustomButton;