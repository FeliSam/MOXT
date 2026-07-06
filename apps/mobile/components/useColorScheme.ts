import { useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { ThemeContext } from '@/theme/ThemeContext';

/** Thème MOXT persisté ; retombe sur le schéma système si le provider n'est pas monté. */
export const useColorScheme = (): 'light' | 'dark' => {
  const themeCtx = useContext(ThemeContext);
  const system = useSystemColorScheme();
  if (themeCtx.ready) {
    return themeCtx.isDark ? 'dark' : 'light';
  }
  return system === 'dark' ? 'dark' : 'light';
};
