import {
  Text as DefaultText,
  View as DefaultView,
  type TextProps as DefaultTextProps,
  type ViewProps as DefaultViewProps,
} from 'react-native';
import { useThemeColors } from '@/theme/ThemeContext';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultTextProps;
export type ViewProps = ThemeProps & DefaultViewProps;

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colors = useThemeColors();

  return <DefaultText style={[{ color: colors.text }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const colors = useThemeColors();

  return <DefaultView style={[{ backgroundColor: colors.background }, style]} {...otherProps} />;
}
