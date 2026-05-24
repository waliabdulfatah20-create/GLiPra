/* eslint-disable react-refresh/only-export-components */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import type { Language } from './resources';
import { resources } from './resources';
import { getLanguage } from './utils';

export * from './utils';

/** Languages supported by DosePath. Extend this list when adding a new locale. */
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es'];

/**
 * Resolve the startup language asynchronously:
 *   1. User-persisted preference (AsyncStorage via getLanguage)
 *   2. Device locale — extract the two-letter language code and check support
 *   3. Fall back to English
 *
 * i18next accepts a Promise<string> for `lng`, so we return one here.
 */
async function resolveStartupLanguage(): Promise<string> {
  const saved = await getLanguage();
  if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) return saved as string;

  const deviceCode = (getLocales()[0]?.languageCode ?? 'en').split('-')[0];
  return SUPPORTED_LANGUAGES.includes(deviceCode as Language) ? deviceCode : 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // start synchronously with English; real locale applied below
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
});

// Resolve the user's preferred/device language and switch to it.
// Done after init so i18next never receives a Promise as `lng`.
resolveStartupLanguage().then((lang) => {
  if (lang !== i18n.language) {
    i18n.changeLanguage(lang);
  }
});

// Is it a RTL language?
export const isRTL: boolean = i18n.dir() === 'rtl';

I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

export default i18n;
