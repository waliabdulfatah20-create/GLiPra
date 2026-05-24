/**
 * LanguagePicker
 *
 * A settings row that lets users manually switch between supported app
 * languages (English / Español). The selected language is persisted to
 * AsyncStorage and applied immediately via i18next; the app reloads to
 * reconcile RTL layout if needed.
 *
 * Usage: drop <LanguagePicker /> into any settings list.
 */
export { LanguageItem as LanguagePicker } from './components/language-item';
