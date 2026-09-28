import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

/** Icônes Feather (react-icons/fi côté web). */
export type FeatherName = ComponentProps<typeof Feather>['name'];

export function FeatherIcon({
  name,
  size = 18,
  color,
  style,
}: {
  name: FeatherName;
  size?: number;
  color: string;
  style?: ComponentProps<typeof Feather>['style'];
}) {
  return <Feather name={name} size={size} color={color} style={style} />;
}
