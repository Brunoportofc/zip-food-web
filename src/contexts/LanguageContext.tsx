'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations } from '@/locales/translations';

type Language = 'he' | 'pt';
type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  changeLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Configurar direção RTL para hebraico
    document.dir = 'rtl';
    document.documentElement.lang = 'he';
    document.documentElement.setAttribute('data-language', 'he');
  }, []);

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    try {
      // Navegar pelo objeto de traduções usando a chave com pontos
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      // Se o valor final não for string, retornar a chave
      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      // Substituir parâmetros se fornecidos
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return params[param]?.toString() || match;
        });
      }

      return value;
    } catch (error) {
      console.error(`Error translating key: ${key}`, error);
      return key;
    }
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    const direction = lang === 'he' ? 'rtl' : 'ltr';
    document.dir = direction;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-language', lang);
    localStorage.setItem('language', lang);
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

