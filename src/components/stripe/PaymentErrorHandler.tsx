// Placeholder para Payment Error Handler
import React from 'react';

export const usePaymentErrorHandler = () => {
  return {
    handleError: (error: any) => {
      console.error('Payment error:', error);
    },
  };
};

const PaymentErrorHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default PaymentErrorHandler;
