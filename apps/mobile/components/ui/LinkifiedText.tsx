import { Linking, Text, type TextStyle } from 'react-native';
import { router } from 'expo-router';

import { resolveNativePath } from '@/utils/nativePath';

const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

function trimTrail(value: string) {
  return value.replace(/[.,;:!?"')\]]+$/, '');
}

export function linkifyParts(text: string) {
  const source = String(text || '');
  if (!source) return [] as { type: 'text' | 'link'; value: string; href?: string }[];
  const parts: { type: 'text' | 'link'; value: string; href?: string }[] = [];
  let last = 0;
  for (const match of source.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: source.slice(last, index) });
    const raw = trimTrail(match[0]);
    if (raw) {
      parts.push({ type: 'link', value: raw, href: /^https?:\/\//i.test(raw) ? raw : `https://${raw}` });
    }
    last = index + match[0].length;
  }
  if (last < source.length) parts.push({ type: 'text', value: source.slice(last) });
  return parts;
}

/** Texte de notification avec les URL cliquables (LinkifiedText du web). */
export function LinkifiedText({
  text,
  style,
  linkStyle,
}: {
  text?: string;
  style?: TextStyle;
  linkStyle?: TextStyle;
}) {
  const parts = linkifyParts(text || '');
  if (!parts.length) return null;
  return (
    <Text style={style}>
      {parts.map((part, index) =>
        part.type === 'link' ? (
          <Text
            key={`${part.href}-${index}`}
            style={[{ textDecorationLine: 'underline' }, linkStyle]}
            onPress={(event) => {
              event.stopPropagation?.();
              const native = resolveNativePath(part.href);
              if (native) router.push(native as never);
              else if (part.href) Linking.openURL(part.href).catch(() => undefined);
            }}>
            {part.value}
          </Text>
        ) : (
          <Text key={`t-${index}`}>{part.value}</Text>
        ),
      )}
    </Text>
  );
}
