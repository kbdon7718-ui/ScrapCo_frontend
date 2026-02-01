import React, {useContext, useMemo} from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';
import {theme} from '../theme';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {getAppColors} from '../theme/appColors';

export default function Screen({children, variant = 'plain'}) {
  const isSoft = variant === 'soft';
  const prefs = useContext(PreferencesContext);

  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  return (
    <SafeAreaView
      style={[styles.safe, {backgroundColor: isSoft ? colors.bgSoft : colors.bg}]}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
  // Extra bottom padding keeps content visible above the floating tab bar.
  inner: {flex: 1, padding: theme.spacing.lg, paddingBottom: theme.spacing.lg + 96},
});
