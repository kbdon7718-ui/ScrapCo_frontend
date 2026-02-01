import React from 'react';
import {theme} from '../theme';
import {Clock, Home, TrendingUp, User} from 'lucide-react-native';

export default function LogoIcon({name = 'Home', size = 22, focused = false}) {
  const color = focused ? theme.colors.primary : theme.colors.textMuted;
  const strokeWidth = focused ? 2.6 : 2.2;

  if (name === 'History') return <Clock size={size} color={color} strokeWidth={strokeWidth} />;
  if (name === 'Rates') return <TrendingUp size={size} color={color} strokeWidth={strokeWidth} />;
  if (name === 'Profile') return <User size={size} color={color} strokeWidth={strokeWidth} />;
  return <Home size={size} color={color} strokeWidth={strokeWidth} />;
}
