import {darkColors, lightColors} from './colors';

export function getAppColors(resolvedTheme) {
  return resolvedTheme === 'dark' ? darkColors : lightColors;
}
