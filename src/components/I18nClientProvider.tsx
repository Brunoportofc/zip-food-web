'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import clientI18n from '@/i18n/client';

interface I18nClientProviderProps {
  children: ReactNode;
}

export default function I18nClientProvider({ children }: I18nClientProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Garantir que o i18n está inicializado
    if (clientI18n.isInitialized) {
      setIsInitialized(true);
    } else {
      clientI18n.on('initialized', () => {
        setIsInitialized(true);
      });
    }
  }, []);

  if (!isInitialized) {
    return <div>Carregando...</div>;
  }

  return (
    <I18nextProvider i18n={clientI18n}>
      {children}
    </I18nextProvider>
  );
}