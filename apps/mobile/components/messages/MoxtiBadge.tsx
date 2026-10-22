import { LinearGradient } from 'expo-linear-gradient';
import { Cpu } from 'lucide-react-native';

import { brand } from '@/theme/palette';

/** Identifiant de la conversation assistant (comme ?conversation=moxt-assistant sur le web). */
export const ASSISTANT_ID = 'moxt-assistant';

/** Pastille ronde Moxti (dégradé brand-500 → cyan-500, icône processeur). */
export function MoxtiBadge({ size = 44, radius }: { size?: number; radius?: number }) {
  return (
    <LinearGradient
      colors={[brand[500], '#06b6d4']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius ?? size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Cpu size={size > 36 ? 18 : 16} color="#ffffff" strokeWidth={2} />
    </LinearGradient>
  );
}
