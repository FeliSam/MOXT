import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { openLink } from '@/utils/appLinks';

export function ExternalLink(props: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  return (
    <Link
      target="_blank"
      {...props}
      href={props.href as any}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          openLink(props.href);
        }
      }}
    />
  );
}
