import { Pressable, View, type ViewStyle } from 'react-native';

import { ui } from '@/constants/uiTailwind';
import { cn } from '@/lib/cn';

type ListCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  selected?: boolean;
  finance?: boolean;
  className?: string;
  style?: ViewStyle;
};

/** Carte liste borderless — ombre légère, sans bordure statique (S1) */
export function ListCard({
  children,
  onPress,
  selected,
  finance,
  className,
  style,
}: ListCardProps) {
  const shell = cn(
    finance ? ui.financeCard : selected ? ui.listCardSelected : ui.listCard,
    onPress && 'active:opacity-90',
    className,
  );

  if (onPress) {
    return (
      <Pressable className={shell} style={style} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={shell} style={style}>
      {children}
    </View>
  );
}
