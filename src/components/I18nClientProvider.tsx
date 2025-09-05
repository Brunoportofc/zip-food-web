'use client';

import { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import clientI18n from '@/i18n/client';

interface I18nClientProviderProps {
  children: ReactNode;
}

export default function I18nClientProvider({ children }: I18nClientProviderProps) {
  return (
    <I18nextProvider i18n={clientI18n}>
      {children}
    </I18nextProvider>
  );
}