import React, { createContext, useState, useContext, useEffect } from 'react';
import en from '../locales/en';
import vi from '../locales/vi';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Lấy ngôn ngữ từ localStorage hoặc mặc định là 'en'
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'en'
  );

  // Lưu ngôn ngữ vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const translations = {
    en,
    vi
  };

  const t = (key) => {
    const keys = key.split('.');
    let translation = translations[currentLanguage];
    
    for (const k of keys) {
      translation = translation?.[k];
    }
    
    return translation || key;
  };

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === 'en' ? 'vi' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 