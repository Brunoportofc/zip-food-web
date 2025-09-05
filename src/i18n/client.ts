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

// Configurar com React e forçar idioma português (sem detecção automática)
clientI18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt', // Força o idioma português
    fallbackLng: 'pt',
    debug: false, // Debug desativado
    interpolation: {
      escapeValue: false, // não é necessário para React
    },
    // Removido LanguageDetector e detection para evitar mudança automática de idioma
  })
  .then(() => {
    // Força o idioma português após a inicialização
    clientI18n.changeLanguage('pt');
    
    // Limpa qualquer configuração de idioma no localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('i18nextLng');
      localStorage.removeItem('i18next');
      sessionStorage.removeItem('i18nextLng');
      sessionStorage.removeItem('i18next');
    }
  });

export default clientI18n;