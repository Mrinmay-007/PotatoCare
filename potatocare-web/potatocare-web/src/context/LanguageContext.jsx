import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const LanguageContext = createContext({ language: "english", changeLanguage: () => {} });

function readStoredLanguage() {
  try {
    return localStorage.getItem("language") || "english";
  } catch {
    return "english";
  }
}

export function LanguageProvider({ children }) {
  // Read synchronously so the first paint is already in the saved language
  // (the mobile version flashed English first because AsyncStorage is async).
  const [language, setLanguage] = useState(readStoredLanguage);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem("language", lang);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ language, changeLanguage }), [language, changeLanguage]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
