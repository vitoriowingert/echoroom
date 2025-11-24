import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Translations } from './translations';
import { useProfile } from '../hooks/useProfile';

interface TranslationContextType {
  t: Translations;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  
  // Use profile hook but don't block rendering
  const { profile } = useProfile();

  // Load language from user preferences
  useEffect(() => {
    if (profile?.preferences?.language) {
      const prefLang = profile.preferences.language as Language;
      if (translations[prefLang]) {
        setLanguageState(prefLang);
      }
    }
  }, [profile]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Optionally save to preferences immediately
    // This will be handled when user saves preferences in the modal
  };

  const t = translations[language];

  // Always provide context value immediately
  const contextValue = { t, language, setLanguage };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

