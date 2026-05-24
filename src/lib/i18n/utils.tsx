import type TranslateOptions from 'i18next';
import type { Language, resources } from './resources';
import type { RecursiveKeyOf } from './types';
import i18n from 'i18next';
import memoize from 'lodash.memoize';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

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
  } else {
    I18nManager.forceRTL(false);
  }
  // Clear memoize cache so translate() calls outside hooks return updated strings.
  // No restart needed — i18n.changeLanguage() triggers re-renders on all
  // useTranslation() consumers automatically via react-i18next.
  translate.cache.clear?.();
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
      setItem(LOCAL, lang); // fire-and-forget — no restart, no race condition
      changeLanguage(lang); // triggers immediate re-render via i18next reactivity
    },
    [],
  );

  return { language: language ?? 'en', setLanguage };
}
