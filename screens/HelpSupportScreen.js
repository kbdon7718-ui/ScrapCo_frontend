import React, {useContext, useMemo} from 'react';
import {Alert, Linking, Pressable, StyleSheet, Text, View} from 'react-native';

import Screen from '../components/Screen';
import GlassHeader from '../components/GlassHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import {theme} from '../theme';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {t} from '../i18n/strings';
import {Phone, Mail, Bot} from 'lucide-react-native';
import {getAppColors} from '../theme/appColors';

const SUPPORT_PHONE = '8053317489';
const SUPPORT_EMAIL = 'azadgupta1010@gmail.com';

export default function HelpSupportScreen() {
  const prefs = useContext(PreferencesContext);
  const lang = prefs?.language || 'en';
  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  async function onCall() {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert(t(lang, 'support.callErrorTitle'), t(lang, 'support.callErrorBody'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t(lang, 'support.callErrorTitle'), t(lang, 'support.callErrorBody'));
    }
  }

  async function onEmail() {
    const subject = encodeURIComponent('ScrapCo Support');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert(t(lang, 'support.emailErrorTitle'), t(lang, 'support.emailErrorBody'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t(lang, 'support.emailErrorTitle'), t(lang, 'support.emailErrorBody'));
    }
  }

  return (
    <Screen variant="soft">
      <GlassHeader title={t(lang, 'support.title')} status={t(lang, 'support.subtitle')} />

      <View style={{marginTop: theme.spacing.lg}}>
        <Card>
          <Text style={[styles.sectionTitle, {color: colors.textMuted}]}>{t(lang, 'support.subtitle').toUpperCase()}</Text>

          <View style={styles.contactRow}>
            <View style={styles.iconCircle}>
              <Phone size={18} color={theme.colors.primary} strokeWidth={2.4} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.label, {color: colors.textMuted}]}>{t(lang, 'support.phoneLabel')}</Text>
              <Text style={[styles.value, {color: colors.text}]}>{SUPPORT_PHONE}</Text>
            </View>
            <Button label={t(lang, 'support.call')} onPress={onCall} variant="primary" />
          </View>

          <View style={[styles.divider, {backgroundColor: colors.border}]} />

          <View style={styles.contactRow}>
            <View style={styles.iconCircle}>
              <Mail size={18} color={theme.colors.primary} strokeWidth={2.4} />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.label, {color: colors.textMuted}]}>{t(lang, 'support.emailLabel')}</Text>
              <Text style={[styles.value, {color: colors.text}]}>{SUPPORT_EMAIL}</Text>
            </View>
            <Button label={t(lang, 'support.email')} onPress={onEmail} variant="secondary" />
          </View>
        </Card>

        <View style={{marginTop: theme.spacing.md}}>
          <Card>
            <View style={styles.aiRow}>
              <View style={styles.iconCircle}>
                <Bot size={18} color={theme.colors.primary} strokeWidth={2.4} />
              </View>
              <View style={{flex: 1}}>
                <Text style={[styles.aiTitle, {color: colors.text}]}>{t(lang, 'support.aiTitle')}</Text>
                <Text style={[styles.aiBody, {color: colors.textMuted}]}>
                  {t(lang, 'support.aiName')} — {t(lang, 'support.aiBody')}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => Alert.alert(t(lang, 'profile.aiSoonTitle'), t(lang, 'profile.aiSoonBody'))}
              style={[styles.aiBtn, {borderColor: colors.border}]}
            >
              <Text style={[styles.aiBtnText, {color: colors.text}]}>Open</Text>
            </Pressable>
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
  contactRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {fontSize: 12, fontWeight: '700'},
  value: {marginTop: 4, fontSize: 14, fontWeight: '900'},
  divider: {height: 1, marginTop: 14, opacity: 0.7},
  aiRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  aiTitle: {fontSize: 16, fontWeight: '900'},
  aiBody: {marginTop: 6, fontSize: 12, fontWeight: '600'},
  aiBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.10)',
  },
  aiBtnText: {fontWeight: '900'},
});
