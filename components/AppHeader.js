import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {theme} from '../theme';

export default function AppHeader({title = 'ScrapCo', subtitle}) {
  return (
    <LinearGradient
      colors={[theme.colors.sky, theme.colors.green]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.wrap}
    >
      <View style={styles.gloss} />
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="leaf" size={18} color="#FFFFFF" />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  title: {color: '#FFFFFF', fontSize: 20, fontWeight: '400', letterSpacing: -0.2},
  subtitle: {marginTop: 3, color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '400'},
});
