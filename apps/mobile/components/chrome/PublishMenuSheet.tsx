import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  Briefcase,
  Calendar,
  PenLine,
  Plus,
  Repeat,
  ShoppingBag,
  Sparkles,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { canAccessModule, type ModuleId } from '@/store/platform';
import { useAppSelector } from '@/store/store';
import { useShadows, useTheme } from '@/theme/ThemeContext';

/** Textes du web (moxt-react/src/i18n/phase3I18n.js, clés feed.publish.*). */
const TEXT = {
  trigger: 'Publier',
  title: 'Publier',
  subtitle: 'Choisissez le type de contenu à créer.',
  close: 'Fermer',
  soon: 'Bientôt disponible dans l’application mobile.',
};

type Option = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Route Expo quand l'écran existe déjà ; sinon message « bientôt ». */
  route?: string;
  /** Dégradé bg-gradient-to-br from-X/15 to-Y/10 (clair) et /20→/10 (sombre), couleur d'icône. */
  from: string;
  to: string;
  fromDark: string;
  toDark: string;
  fg: string;
  fgDark: string;
};

const rgba = (hex: string, a: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Copie de PUBLISH_OPTIONS (features/feed/FeedPublishMenu.jsx), même ordre. */
const OPTIONS: Option[] = [
  { id: 'transfer', label: 'Transfert', hint: 'Envoyer de l’argent rapidement', icon: Repeat, route: '/(tabs)/transfers',
    from: rgba('#14b8a6', 0.15), to: rgba('#34d399', 0.1), fromDark: rgba('#14b8a6', 0.25), toDark: rgba('#34d399', 0.1), fg: '#0f766e', fgDark: '#ccfbf1' },
  { id: 'p2p', label: 'P2P', hint: 'Créer une offre d’échange', icon: Users,
    from: rgba('#06b6d4', 0.15), to: rgba('#60a5fa', 0.1), fromDark: rgba('#06b6d4', 0.2), toDark: rgba('#60a5fa', 0.1), fg: '#0e7490', fgDark: '#cffafe' },
  { id: 'video', label: 'Vidéo', hint: 'Clip vertical pour le fil', icon: Video,
    from: rgba('#f43f5e', 0.15), to: rgba('#fb923c', 0.1), fromDark: rgba('#f43f5e', 0.2), toDark: rgba('#fb923c', 0.1), fg: '#be123c', fgDark: '#fecdd3' },
  { id: 'post', label: 'Fil d’actualité', hint: 'Texte et photos pour la communauté', icon: PenLine,
    from: rgba('#0ea5e9', 0.15), to: rgba('#22d3ee', 0.1), fromDark: rgba('#0ea5e9', 0.2), toDark: rgba('#22d3ee', 0.1), fg: '#0369a1', fgDark: '#bae6fd' },
  { id: 'status', label: 'Statut', hint: 'Moment éphémère 24 h', icon: Sparkles,
    from: rgba('#8b5cf6', 0.15), to: rgba('#e879f9', 0.1), fromDark: rgba('#8b5cf6', 0.2), toDark: rgba('#e879f9', 0.1), fg: '#6d28d9', fgDark: '#ddd6fe' },
  { id: 'listing', label: 'Annonce', hint: 'Mettre un article en vente', icon: ShoppingBag, route: '/listing/create',
    from: rgba('#10b981', 0.15), to: rgba('#2dd4bf', 0.1), fromDark: rgba('#10b981', 0.2), toDark: rgba('#2dd4bf', 0.1), fg: '#047857', fgDark: '#a7f3d0' },
  { id: 'parcel', label: 'Colis', hint: 'Trajet ou capacité de transport', icon: Box,
    from: rgba('#f59e0b', 0.15), to: rgba('#facc15', 0.1), fromDark: rgba('#f59e0b', 0.2), toDark: rgba('#facc15', 0.1), fg: '#92400e', fgDark: '#fde68a' },
  { id: 'job', label: 'Job', hint: 'Publier une offre d’emploi', icon: Briefcase,
    from: rgba('#94a3b8', 0.2), to: rgba('#d4d4d8', 0.1), fromDark: rgba('#94a3b8', 0.25), toDark: rgba('#d4d4d8', 0.1), fg: '#334155', fgDark: '#f1f5f9' },
  { id: 'event', label: 'Événement', hint: 'Organiser une rencontre', icon: Calendar,
    from: rgba('#6366f1', 0.15), to: rgba('#60a5fa', 0.1), fromDark: rgba('#6366f1', 0.2), toDark: rgba('#60a5fa', 0.1), fg: '#4338ca', fgDark: '#c7d2fe' },
];

const OPTION_MODULES: Record<string, ModuleId> = {
  video: 'videos',
  post: 'news',
  event: 'events',
  job: 'jobs',
  parcel: 'parcels',
};

const PublishMenuContext = createContext<() => void>(() => undefined);

export function usePublishMenu() {
  return useContext(PublishMenuContext);
}

function showSoon(label: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    globalThis.alert?.(`${label} — ${TEXT.soon}`);
    return;
  }
  Alert.alert(label, TEXT.soon);
}

/** Feuille « Publier » identique au web (FeedPublishMenu), ouverte par le bouton + de l'en-tête. */
export function PublishMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  return (
    <PublishMenuContext.Provider value={openMenu}>
      {children}
      <PublishMenuSheet visible={open} onClose={() => setOpen(false)} />
    </PublishMenuContext.Provider>
  );
}

function PublishMenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const shadows = useShadows();
  const flags = useAppSelector((s) => s.platform.flags);
  const options = useMemo(
    () => OPTIONS.filter((o) => !OPTION_MODULES[o.id] || canAccessModule(flags, OPTION_MODULES[o.id])),
    [flags],
  );

  function choose(option: Option) {
    onClose();
    setTimeout(() => {
      if (option.route) router.push(option.route as never);
      else showSoon(option.label);
    }, 180);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }} testID="publish-menu">
        <Pressable
          accessibilityLabel={TEXT.close}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(2,6,23,0.55)' }}
        />
        <View
          accessibilityViewIsModal
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '88%',
              borderTopLeftRadius: 25.6,
              borderTopRightRadius: 25.6,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingBottom: Math.max(13.6, insets.bottom),
              overflow: 'hidden',
            },
            shadows.cardLg,
          ]}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ height: 4, width: 40, borderRadius: 999, backgroundColor: colors.borderMd }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingHorizontal: 20,
              paddingBottom: 12,
              paddingTop: 8,
            }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText className="font-black text-app-text" style={{ fontSize: 16.8, letterSpacing: -0.4 }}>
                {TEXT.title}
              </AppText>
              <AppText className="mt-0.5 text-[12px] text-app-text-muted">{TEXT.subtitle}</AppText>
            </View>
            <Pressable
              accessibilityLabel={TEXT.close}
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceMuted,
              }}>
              <X size={16} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8, gap: 6 }} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const Icon = option.icon;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="menuitem"
                  onPress={() => choose(option)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 18.4,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                  })}>
                  <LinearGradient
                    colors={isDark ? [option.fromDark, option.toDark] : [option.from, option.to]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(229,231,235,0.5)',
                    }}>
                    <Icon size={19} color={isDark ? option.fgDark : option.fg} strokeWidth={2} />
                  </LinearGradient>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText numberOfLines={1} className="text-[14px] font-black text-app-text" style={{ letterSpacing: -0.35 }}>
                      {option.label}
                    </AppText>
                    <AppText numberOfLines={1} className="mt-0.5 text-[12px] text-app-text-muted">
                      {option.hint}
                    </AppText>
                  </View>
                  <Plus size={16} color={colors.textFaint} strokeWidth={2} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
