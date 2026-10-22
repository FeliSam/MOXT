import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinear, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';

import { COVER_STYLE_IDS, type CoverStyleId } from './coverStyles';

/**
 * Bannières Moxt sans photo (SVG du web, viewBox 800×220, « slice »).
 * Portage fidèle de man-c-mesh, man-d-prune, woman-d-prune et business-b-editorial ;
 * le grain (feTurbulence) n'existe pas dans react-native-svg et n'est pas rendu.
 * Les autres styles utilisent un dégradé de repli aux couleurs du style.
 */
const SVG_PROPS = { width: '100%', height: '100%', viewBox: '0 0 800 220', preserveAspectRatio: 'xMidYMid slice' } as const;

function FadeLeft({ color, width = '48%' }: { color: string; width?: `${number}%` }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[color, `${color}cc`, `${color}00`]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width }}
    />
  );
}

function Wordmark({
  label,
  line,
  uppercase = true,
  lineWidth = 76,
  serif = false,
  lineFirst = true,
  labelOpacity = 0.9,
}: {
  label: string;
  line: string[];
  uppercase?: boolean;
  lineWidth?: number;
  serif?: boolean;
  lineFirst?: boolean;
  labelOpacity?: number;
}) {
  const bar = (
    <LinearGradient
      colors={line as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ marginTop: lineFirst ? 10 : 8, height: lineFirst ? 1 : 2, width: lineFirst ? lineWidth : 64, borderRadius: 999 }}
    />
  );
  const text = uppercase ? (
    <AppText
      className="font-semibold"
      style={{ marginTop: 8, fontSize: 11.2, letterSpacing: 4.25, color: `rgba(255,255,255,${labelOpacity})`, textTransform: 'uppercase' }}>
      {label}
    </AppText>
  ) : (
    <AppText style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.9)' }}>{label}</AppText>
  );
  return (
    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '55%', maxWidth: 352, justifyContent: 'center', paddingLeft: 20 }}>
      <AppText
        display={!serif}
        style={{
          fontSize: 29.6,
          lineHeight: 30,
          letterSpacing: -0.74,
          color: '#ffffff',
          ...(serif ? { fontFamily: 'serif', fontWeight: '600' as const } : null),
        }}>
        Moxt
      </AppText>
      {lineFirst ? bar : null}
      {text}
      {lineFirst ? null : bar}
    </View>
  );
}

function ManMeshMidnight({ labels }: { labels: CoverLabels }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000510' }}>
      <Svg {...SVG_PROPS} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="mCbg" cx="70%" cy="60%" r="55%">
            <Stop offset="0%" stopColor="#0a1a3a" />
            <Stop offset="100%" stopColor="#000510" />
          </RadialGradient>
          <SvgLinear id="mCstreak" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#0077ff" stopOpacity={0} />
            <Stop offset="40%" stopColor="#3db4ff" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#9ad8ff" stopOpacity={0.2} />
          </SvgLinear>
        </Defs>
        <Rect width="800" height="220" fill="url(#mCbg)" />
        <Circle cx="160" cy="50" r="55" fill="#1e4a8c" opacity={0.35} />
        <Circle cx="520" cy="30" r="35" fill="#2563a8" opacity={0.25} />
        <Circle cx="300" cy="180" r="40" fill="#123060" opacity={0.3} />
        <Path d="M280 230 C420 150 520 170 640 90 C720 40 780 20 840 -10" fill="none" stroke="url(#mCstreak)" strokeWidth={10} opacity={0.9} />
        <Path d="M300 240 C440 155 540 175 660 95 C740 45 800 25 850 -5" fill="none" stroke="#5ec8ff" strokeWidth={3} opacity={0.7} />
        <Path d="M260 220 C400 140 510 165 630 85 C710 35 770 15 830 -15" fill="none" stroke="#9ad8ff" strokeWidth={1.2} strokeDasharray="1.5 6" opacity={0.55} />
        <Path d="M320 250 C450 165 560 180 680 105 C760 55 810 35 860 5" fill="none" stroke="#7dd3fc" strokeWidth={1} strokeDasharray="1 8" opacity={0.4} />
      </Svg>
      <Wordmark label={labels.yourNetwork} uppercase={false} lineFirst={false} line={['#0077ff', '#3db4ff']} />
    </View>
  );
}

function ManPruneNight({ labels }: { labels: CoverLabels }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#140712' }}>
      <Svg {...SVG_PROPS} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinear id="mDbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#140712" />
            <Stop offset="55%" stopColor="#3a1433" />
            <Stop offset="100%" stopColor="#6b2d5c" />
          </SvgLinear>
          <SvgLinear id="mDwave" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#2a0f25" />
            <Stop offset="50%" stopColor="#6b2d5c" />
            <Stop offset="100%" stopColor="#a8568f" />
          </SvgLinear>
          <SvgLinear id="mDglow" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#e79bbf" stopOpacity={0} />
            <Stop offset="45%" stopColor="#e79bbf" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#f3c1d8" stopOpacity={0.25} />
          </SvgLinear>
        </Defs>
        <Rect width="800" height="220" fill="url(#mDbg)" />
        <Path d="M300 240 C420 170 510 190 600 120 C680 65 740 40 820 10 L820 240 Z" fill="url(#mDwave)" opacity={0.9} />
        <Path d="M400 250 C505 165 590 175 690 102 C755 56 795 28 820 -8 L820 250 Z" fill="#1d0a1a" opacity={0.8} />
        <Path d="M280 230 C420 150 520 170 640 90 C720 40 780 20 840 -10" fill="none" stroke="url(#mDglow)" strokeWidth={6} opacity={0.85} />
        <Path d="M300 242 C440 158 540 178 660 98 C740 48 800 28 850 -2" fill="none" stroke="#f3c1d8" strokeWidth={1.2} strokeDasharray="1.5 6" opacity={0.55} />
      </Svg>
      <FadeLeft color="#140712" />
      <Wordmark label={labels.profile} line={['#c77db3', '#f3c1d8']} labelOpacity={0.8} />
    </View>
  );
}

function WomanPruneRose({ labels }: { labels: CoverLabels }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#2b0f24' }}>
      <Svg {...SVG_PROPS} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinear id="wDbg" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#2b0f24" />
            <Stop offset="50%" stopColor="#6b2d5c" />
            <Stop offset="100%" stopColor="#d98bb5" />
          </SvgLinear>
          <SvgLinear id="wDwaveA" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#8a3f75" />
            <Stop offset="45%" stopColor="#f3c1d8" />
            <Stop offset="75%" stopColor="#e79bbf" />
            <Stop offset="100%" stopColor="#a8568f" />
          </SvgLinear>
          <SvgLinear id="wDwaveB" x1="20%" y1="100%" x2="90%" y2="0%">
            <Stop offset="0%" stopColor="#58244b" />
            <Stop offset="55%" stopColor="#dba6c8" />
            <Stop offset="100%" stopColor="#c77db3" />
          </SvgLinear>
        </Defs>
        <Rect width="800" height="220" fill="url(#wDbg)" />
        <Path d="M300 240 C400 165 490 195 590 115 C670 55 735 35 820 5 L820 240 Z" fill="url(#wDwaveB)" opacity={0.95} />
        <Path d="M370 240 C470 150 555 180 655 100 C735 42 780 22 820 -8 L820 240 Z" fill="url(#wDwaveA)" opacity={0.88} />
        <Path d="M455 240 C545 150 625 165 715 90 C772 44 800 18 820 -18 L820 240 Z" fill="url(#wDwaveB)" opacity={0.7} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Path
            key={i}
            d={`M${350 + i * 30} 215 C${455 + i * 25} ${145 - i * 8} ${555 + i * 20} ${165 - i * 6} ${675 + i * 15} ${92 - i * 10}`}
            fill="none"
            stroke="#fde7f1"
            strokeWidth={0.8}
            opacity={0.18 + i * 0.04}
          />
        ))}
      </Svg>
      <FadeLeft color="#2b0f24" width="45%" />
      <Wordmark label={labels.profile} serif lineWidth={72} line={['#c77db3', '#f3c1d8', '#c77db3']} />
    </View>
  );
}

function BusinessEditorial({ labels }: { labels: CoverLabels }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0b0d0e' }}>
      <Svg {...SVG_PROPS} style={{ position: 'absolute' }}>
        <Defs>
          <SvgLinear id="edTeal" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#003d3d" />
            <Stop offset="45%" stopColor="#0a6b66" />
            <Stop offset="100%" stopColor="#12a89a" />
          </SvgLinear>
          <SvgLinear id="edTealDeep" x1="10%" y1="100%" x2="90%" y2="0%">
            <Stop offset="0%" stopColor="#012828" />
            <Stop offset="55%" stopColor="#065550" />
            <Stop offset="100%" stopColor="#0d8a7c" />
          </SvgLinear>
          <SvgLinear id="edGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#6b4e1a" />
            <Stop offset="35%" stopColor="#c5a059" />
            <Stop offset="65%" stopColor="#e8d5a3" />
            <Stop offset="100%" stopColor="#9a7429" />
          </SvgLinear>
          <SvgLinear id="edGoldSoft" x1="20%" y1="80%" x2="100%" y2="10%">
            <Stop offset="0%" stopColor="#8a6a28" />
            <Stop offset="50%" stopColor="#d4b56a" />
            <Stop offset="100%" stopColor="#b8923c" />
          </SvgLinear>
          <RadialGradient id="edVignette" cx="35%" cy="45%" r="75%">
            <Stop offset="0%" stopColor="#14181a" stopOpacity={0} />
            <Stop offset="70%" stopColor="#0b0d0e" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#050606" stopOpacity={0.85} />
          </RadialGradient>
        </Defs>
        <Rect width="800" height="220" fill="#0b0d0e" />
        <Rect width="800" height="220" fill="url(#edVignette)" />
        <Path d="M310 240 C420 190 480 210 560 150 C620 105 680 70 820 40 L820 250 L310 250 Z" fill="url(#edTealDeep)" opacity={0.95} />
        <Path d="M340 250 C450 175 520 195 600 125 C670 70 730 45 820 15 L820 250 Z" fill="url(#edGold)" opacity={0.92} />
        <Path d="M390 250 C490 165 560 180 640 110 C710 55 760 30 820 -5 L820 250 Z" fill="url(#edTeal)" opacity={0.9} />
        <Path d="M450 250 C540 155 610 165 690 95 C750 50 785 20 820 -20 L820 250 Z" fill="url(#edGoldSoft)" opacity={0.88} />
        <Path d="M520 250 C600 150 665 155 735 85 C780 45 802 15 820 -30 L820 250 Z" fill="url(#edTealDeep)" opacity={0.85} />
        <Path d="M580 255 C650 160 700 150 760 90 C795 55 810 25 820 -15 L820 255 Z" fill="url(#edGold)" opacity={0.75} />
        <Path d="M360 200 C470 150 540 170 620 110" fill="none" stroke="#e8d5a3" strokeWidth={1.2} opacity={0.25} />
        <Path d="M420 215 C520 155 590 165 680 100" fill="none" stroke="#7fd4c8" strokeWidth={1} opacity={0.2} />
      </Svg>
      <FadeLeft color="#0b0d0e" />
      <Wordmark label={labels.business} line={['#6b4e1a', '#c5a059', '#e8d5a3', '#9a7429']} />
    </View>
  );
}

/** Repli des autres styles : dégradé principal du style, wordmark « Moxt ». */
const FALLBACK_GRADIENTS: Partial<Record<CoverStyleId, [string, string, string]>> = {
  'business-a-mesh': ['#032d2a', '#0a6b66', '#12a89a'],
  'business-c-glass': ['#0b1220', '#1e3a5f', '#38bdf8'],
  'business-d-topo': ['#02150f', '#0a3d2c', '#1f6f50'],
  'woman-a-silk': ['#2a121c', '#6b3a4a', '#c49a8e'],
  'woman-b-glass': ['#4c1d6e', '#7c3aed', '#c4b5fd'],
  'woman-c-blush': ['#f6a08e', '#f8b4a2', '#ffd0bc'],
  'man-a-steel': ['#0b0e14', '#1f5c5c', '#0d3d3d'],
  'man-b-topo': ['#02150f', '#0a3d2c', '#1f6f50'],
};

function Fallback({ styleId, labels }: { styleId: CoverStyleId; labels: CoverLabels }) {
  const colors = FALLBACK_GRADIENTS[styleId] || ['#140712', '#3a1433', '#6b2d5c'];
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <Wordmark label={styleId.startsWith('business') ? labels.business : labels.profile} line={['#ffffff99', '#ffffff33']} />
    </LinearGradient>
  );
}

export type CoverLabels = { profile: string; yourNetwork: string; business: string };
export const COVER_LABELS_FR: CoverLabels = { profile: 'Profil', yourNetwork: 'Votre réseau', business: 'Business' };

export function MoxtCoverBanner({ styleId, labels = COVER_LABELS_FR }: { styleId: CoverStyleId; labels?: CoverLabels }) {
  switch (styleId) {
    case COVER_STYLE_IDS.MAN_C_MESH:
      return <ManMeshMidnight labels={labels} />;
    case COVER_STYLE_IDS.MAN_D_PRUNE:
      return <ManPruneNight labels={labels} />;
    case COVER_STYLE_IDS.WOMAN_D_PRUNE:
      return <WomanPruneRose labels={labels} />;
    case COVER_STYLE_IDS.BUSINESS_B_EDITORIAL:
      return <BusinessEditorial labels={labels} />;
    default:
      return <Fallback styleId={styleId} labels={labels} />;
  }
}
