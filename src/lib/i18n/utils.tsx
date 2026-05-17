import type TranslateOptions from 'i18next';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';

import RNRestart from 'react-native-restart';

import { getItem, setItem } from '@/lib/storage';

type DefaultLocale = typeof resources.en.translation;
export type TxKeyPath = RecursiveKeyOf<DefaultLocale>;

export const LOCAL = 'local';

export const getLanguage = () => getItem<Language>(LOCAL);

export const translate = memoize(
  (key: TxKeyPath, options = undefined) =>
    i18n.t(key, options) as unknown as string,
  (key: TxKeyPath, options: typeof TranslateOptions) =>
    options ? key + JSON.stringify(options) : key,
);

export function changeLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  if (lang === 'ar') {
    I18nManager.forceRTL(true);
  }
  else {
    I18nManager.forceRTL(false);
  }
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (__DEV__)
      NativeModules.DevSettings.reload();
    else RNRestart.restart();
  }
  else if (Platform.OS === 'web') {
    window.location.reload();
  }
}

export function useSelectedLanguage() {
  const [language, setLang] = useState<Language | undefined>(undefined);

  useEffect(() => {
    getItem<Language>(LOCAL).then((value) => {
      setLang(value ?? 'en');
    });
  }, []);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLang(lang);
      setItem(LOCAL, lang);
      changeLanguage(lang);
    },
    [],
  );

  return { language: language ?? 'en', setLanguage };
}
