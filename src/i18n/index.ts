import i18n from 'i18next';

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

// Configuração básica do i18n (sem React)
i18n.init({
  resources,
  fallbackLng: 'pt',
  debug: false,
  interpolation: {
    escapeValue: false, // não é necessário para React
  },
});

// Exporta a instância do i18n para uso em componentes
export default i18n;