import { Platform, Text, TextProps } from 'react-native';

/** Texte à chasse fixe (police système : SpaceMono a été retirée). */
export function MonoText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[props.style, { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }]}
    />
  );
}
