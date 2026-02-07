import React, {useContext, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../theme';
import {PreferencesContext} from '../contexts/PreferencesContext';
import {getAppColors} from '../theme/appColors';

const TAB_BAR_HEIGHT = 66;
const TAB_BAR_GAP = 14;

export default function Screen({children, variant = 'plain'}) {
  const isSoft = variant === 'soft';
  const prefs = useContext(PreferencesContext);
  const insets = useSafeAreaInsets();

  const colors = useMemo(() => getAppColors(prefs?.resolvedTheme || 'light'), [prefs?.resolvedTheme]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, {backgroundColor: isSoft ? colors.bgSoft : colors.bg}]}
    >
      <View
        style={[
          styles.inner,
          {
            paddingBottom: theme.spacing.lg + TAB_BAR_HEIGHT + TAB_BAR_GAP + (insets?.bottom || 0),
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1},
  inner: {flex: 1, padding: theme.spacing.lg},
});
