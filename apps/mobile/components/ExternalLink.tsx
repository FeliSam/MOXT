import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Linking, Platform } from 'react-native';

export function ExternalLink(props: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return (
    <Link
      target="_blank"
      {...props}
      href={props.href as any}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          Linking.openURL(props.href);
        }
      }}
    />
  );
}
