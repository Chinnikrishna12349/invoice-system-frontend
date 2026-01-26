import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from './locales/en.json';
import jaTranslations from './locales/ja.json';

// Initialize i18next
export const initializeI18n = () => {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enTranslations },
        ja: { translation: jaTranslations },
      },
      lng: 'en',
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
    });

  return i18n;
};

// Initialize and export the instance
const i18nInstance = initializeI18n();
export default i18nInstance;
