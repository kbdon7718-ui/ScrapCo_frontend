import React, {createContext, useCallback, useEffect, useMemo, useState} from 'react';
import {Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  language: 'pref.language',
  themeMode: 'pref.themeMode',
};

export const PreferencesContext = createContext({
  language: 'en',
  setLanguage: () => {},
  themeMode: 'system',
  setThemeMode: () => {},
  resolvedTheme: 'light',
});

export function PreferencesProvider({children}) {
  const [language, setLanguageState] = useState('en');
  const [themeMode, setThemeModeState] = useState('system');
  const [systemTheme, setSystemTheme] = useState(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({colorScheme}) => {
      setSystemTheme(colorScheme || 'light');
    });
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [savedLang, savedThemeMode] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.language),
          AsyncStorage.getItem(STORAGE_KEYS.themeMode),
        ]);

        if (!mounted) return;

        if (savedLang === 'en' || savedLang === 'hi') setLanguageState(savedLang);
        if (savedThemeMode === 'system' || savedThemeMode === 'light' || savedThemeMode === 'dark') {
          setThemeModeState(savedThemeMode);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextLang) => {
    setLanguageState(nextLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.language, nextLang);
    } catch {
      // ignore
    }
  }, []);

  const setThemeMode = useCallback(async (nextMode) => {
    setThemeModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.themeMode, nextMode);
    } catch {
      // ignore
    }
  }, []);

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      themeMode,
      setThemeMode,
      resolvedTheme: resolvedTheme === 'dark' ? 'dark' : 'light',
    }),
    [language, setLanguage, themeMode, setThemeMode, resolvedTheme]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
