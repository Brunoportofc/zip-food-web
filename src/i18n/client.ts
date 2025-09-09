'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importações de traduções
import translationPT from './locales/pt.json';
import translationEN from './locales/en.json';
import translationHE from './locales/he.json';

const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  he: {
    translation: translationHE
  }
};

// Criar uma nova instância do i18n para o cliente
const clientI18n = i18n.createInstance();

// Configurar com React e permitir seleção de idioma
clientI18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt', // Idioma padrão português
    fallbackLng: 'pt',
    debug: false, // Debug desativado
    interpolation: {
      escapeValue: false, // não é necessário para React
    },
    // Configurações de namespace - remover para usar estrutura aninhada
    // defaultNS: 'translation',
    // ns: ['translation'],
    // Permitir detecção e mudança de idioma
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    // Configurações de carregamento
    load: 'languageOnly',
    cleanCode: true
  });

export default clientI18n;