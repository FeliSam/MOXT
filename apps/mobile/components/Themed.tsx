import { Text as DefaultText, View as DefaultView } from 'react-native';
import { useThemeColors } from '@/theme/ThemeContext';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

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
