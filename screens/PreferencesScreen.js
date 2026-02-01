import React, {useContext, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import Screen from '../components/Screen';
import GlassHeader from '../components/GlassHeader';
import Card from '../components/Card';
import {theme} from '../theme';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {t} from '../i18n/strings';
import {CheckCircle2} from 'lucide-react-native';
import {getAppColors} from '../theme/appColors';

function OptionRow({label, selected, onPress, colors}) {
  return (
    <Pressable onPress={onPress} style={[styles.optRow, {borderColor: colors.border}]}> 
      <Text style={[styles.optLabel, {color: colors.text}]}>{label}</Text>
      {selected ? <CheckCircle2 size={18} color={theme.colors.primary} strokeWidth={2.6} /> : null}
    </Pressable>
  );
}

export default function PreferencesScreen() {
  const prefs = useContext(PreferencesContext);
  const lang = prefs?.language || 'en';
  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  return (
    <Screen variant="soft">
      <GlassHeader title="Preferences" status="Language & Theme" />

      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <Text style={[styles.sectionTitle, {color: colors.textMuted}]}>LANGUAGE</Text>
          <OptionRow
            label={t(lang, 'preferences.english')}
            selected={prefs?.language === 'en'}
            onPress={() => prefs?.setLanguage?.('en')}
            colors={colors}
          />
          <OptionRow
            label={t(lang, 'preferences.hindi')}
            selected={prefs?.language === 'hi'}
            onPress={() => prefs?.setLanguage?.('hi')}
            colors={colors}
          />
        </Card>

        <View style={{marginTop: theme.spacing.md}}>
          <Card>
            <Text style={[styles.sectionTitle, {color: colors.textMuted}]}>THEME</Text>
            <OptionRow
              label={t(lang, 'preferences.themeSystem')}
              selected={prefs?.themeMode === 'system'}
              onPress={() => prefs?.setThemeMode?.('system')}
              colors={colors}
            />
            <OptionRow
              label={t(lang, 'preferences.themeLight')}
              selected={prefs?.themeMode === 'light'}
              onPress={() => prefs?.setThemeMode?.('light')}
              colors={colors}
            />
            <OptionRow
              label={t(lang, 'preferences.themeDark')}
              selected={prefs?.themeMode === 'dark'}
              onPress={() => prefs?.setThemeMode?.('dark')}
              colors={colors}
            />
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  optRow: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(2, 132, 199, 0.06)',
  },
  optLabel: {fontSize: 14, fontWeight: '800'},
});
