import React, { ReactNode } from 'react';

interface WebSafeKeyboardAvoidingViewProps {
  children: ReactNode;
  className?: string;
}

/**
 * Um componente que adapta o comportamento do KeyboardAvoidingView do React Native para web
 * Em ambientes web, funciona como um div normal com as classes fornecidas
 */
export const WebSafeKeyboardAvoidingView: React.FC<WebSafeKeyboardAvoidingViewProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};