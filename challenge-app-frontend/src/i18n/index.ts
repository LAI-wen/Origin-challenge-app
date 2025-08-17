import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './translations/en.json';
import zh from './translations/zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: Localization.getLocales()[0]?.languageCode || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;