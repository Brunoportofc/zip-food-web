import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importações de traduções
import translationPT from './locales/pt.json';
import translationEN from './locales/en.json';

const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  }
};

// Configuração do i18n sem inicialização do React
const i18nInstance = i18n
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // não é necessário para React
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Exporta a instância do i18n para uso em componentes
export default i18n;

// Função para inicializar o i18n com React em componentes client-side
export function initI18nForClient() {
  // Esta função deve ser chamada apenas no lado do cliente
  if (typeof window !== 'undefined') {
    import('react-i18next').then(({ initReactI18next }) => {
      i18n.use(initReactI18next);
    });
  }
  return i18n;
}