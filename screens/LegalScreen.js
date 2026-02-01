import React, {useContext, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import Screen from '../components/Screen';
import GlassHeader from '../components/GlassHeader';
import Card from '../components/Card';
import {theme} from '../theme';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {t} from '../i18n/strings';
import {getAppColors} from '../theme/appColors';

function Section({title, body, colors}) {
  return (
    <View style={{marginTop: 14}}>
      <Text style={[styles.h3, {color: colors.text}]}>{title}</Text>
      <Text style={[styles.body, {color: colors.textMuted}]}>{body}</Text>
    </View>
  );
}

export default function LegalScreen() {
  const prefs = useContext(PreferencesContext);
  const lang = prefs?.language || 'en';
  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  const [tab, setTab] = useState('terms');

  const tabs = [
    {key: 'terms', label: t(lang, 'legal.termsTab')},
    {key: 'privacy', label: t(lang, 'legal.privacyTab')},
    {key: 'disclaimer', label: t(lang, 'legal.disclaimerTab')},
  ];

  const content = useMemo(() => {
    if (tab === 'privacy') {
      return (
        <>
          <Text style={[styles.h2, {color: colors.text}]}>{t(lang, 'legal.privacyTitle')}</Text>
          <Section title={t(lang, 'legal.privacy1Title')} body={t(lang, 'legal.privacy1Body')} colors={colors} />
          <Section title={t(lang, 'legal.privacy2Title')} body={t(lang, 'legal.privacy2Body')} colors={colors} />
          <Section title={t(lang, 'legal.privacy3Title')} body={t(lang, 'legal.privacy3Body')} colors={colors} />
          <Section title={t(lang, 'legal.privacy4Title')} body={t(lang, 'legal.privacy4Body')} colors={colors} />
          <Section title={t(lang, 'legal.privacy5Title')} body={t(lang, 'legal.privacy5Body')} colors={colors} />
        </>
      );
    }

    if (tab === 'disclaimer') {
      return (
        <>
          <Text style={[styles.h2, {color: colors.text}]}>{t(lang, 'legal.disclaimerTitle')}</Text>
          <Section title={t(lang, 'legal.disc1Title')} body={t(lang, 'legal.disc1Body')} colors={colors} />
          <Section title={t(lang, 'legal.disc2Title')} body={t(lang, 'legal.disc2Body')} colors={colors} />
          <Section title={t(lang, 'legal.disc3Title')} body={t(lang, 'legal.disc3Body')} colors={colors} />
          <Section title={t(lang, 'legal.disc4Title')} body={t(lang, 'legal.disc4Body')} colors={colors} />
        </>
      );
    }

    return (
      <>
        <Text style={[styles.h2, {color: colors.text}]}>{t(lang, 'legal.termsTitle')}</Text>
        <Section title={t(lang, 'legal.terms1Title')} body={t(lang, 'legal.terms1Body')} colors={colors} />
        <Section title={t(lang, 'legal.terms2Title')} body={t(lang, 'legal.terms2Body')} colors={colors} />
        <Section title={t(lang, 'legal.terms3Title')} body={t(lang, 'legal.terms3Body')} colors={colors} />
        <Section title={t(lang, 'legal.terms4Title')} body={t(lang, 'legal.terms4Body')} colors={colors} />
        <Section title={t(lang, 'legal.terms5Title')} body={t(lang, 'legal.terms5Body')} colors={colors} />
        <Section title={t(lang, 'legal.terms6Title')} body={t(lang, 'legal.terms6Body')} colors={colors} />
      </>
    );
  }, [tab, lang, colors]);

  return (
    <Screen variant="soft">
      <GlassHeader title={t(lang, 'legal.title')} status="" />

      <View style={{marginTop: theme.spacing.md, flex: 1}}>
        <View style={[styles.tabsWrap, {borderColor: colors.border}]}>
          {tabs.map((x) => {
            const active = tab === x.key;
            return (
              <Pressable
                key={x.key}
                onPress={() => setTab(x.key)}
                style={[styles.tabBtn, active && {backgroundColor: 'rgba(2, 132, 199, 0.14)'}]}
              >
                <Text style={[styles.tabText, {color: active ? colors.text : colors.textMuted}]}>{x.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{marginTop: theme.spacing.md, flex: 1}}>
          <Card style={{flex: 1, minHeight: 340}}>
            <ScrollView
              style={{flex: 1}}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 18}}
            >
              {content}
            </ScrollView>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  tabBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {fontWeight: '900', fontSize: 13},
  h2: {fontSize: 14, fontWeight: '900'},
  h3: {marginTop: 2, fontSize: 12, fontWeight: '900'},
  body: {marginTop: 8, fontSize: 12, fontWeight: '600', lineHeight: 18},
});
