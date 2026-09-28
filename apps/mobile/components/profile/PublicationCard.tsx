import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Archive,
  Briefcase,
  Calendar,
  Edit2,
  ExternalLink,
  FileText,
  Package,
  Play,
  Repeat,
  RotateCcw,
  ShoppingBag,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { formatCurrency } from '@moxt/shared/utils/formatters.js';
import { statusMeta } from '@moxt/shared/config/statuses.js';
import { p2pReceivedFromOffered } from '@moxt/shared/domain/p2pRules.js';

import { WebBadge, type BadgeTone } from '@/components/dashboard/webUi';
import { useLanguage } from '@/providers/LanguageProvider';
import { useShadows, useTheme } from '@/theme/ThemeContext';

import { AppText } from '@/components/ui/AppText';

export type PublicationType = 'listing' | 'parcel' | 'job' | 'event' | 'video' | 'post' | 'other';
export type PublicationItem = Record<string, any> & { id: string; status?: string };

/** PUBLICATION_TYPE_TABS du web (icône + dégradé de la tuile). */
export const PUBLICATION_TYPES: Record<PublicationType, { label: string; icon: LucideIcon; chip: [string, string]; tone: [string, string] }> = {
  listing: { label: 'Annonces', icon: ShoppingBag, chip: ['#06b6d4', '#2563eb'], tone: ['#0891b2', '#1d4ed8'] },
  parcel: { label: 'Colis', icon: Package, chip: ['#0ea5e9', '#2563eb'], tone: ['#0284c7', '#1d4ed8'] },
  job: { label: 'Jobs', icon: Briefcase, chip: ['#8b5cf6', '#9333ea'], tone: ['#7c3aed', '#7e22ce'] },
  event: { label: 'Événements', icon: Calendar, chip: ['#f59e0b', '#ea580c'], tone: ['#d97706', '#c2410c'] },
  video: { label: 'Vidéos', icon: Play, chip: ['#f43f5e', '#dc2626'], tone: ['#e11d48', '#b91c1c'] },
  post: { label: 'Publication', icon: FileText, chip: ['#64748b', '#334155'], tone: ['#475569', '#1e293b'] },
  other: { label: 'Autres', icon: Repeat, chip: ['#10b981', '#0d9488'], tone: ['#059669', '#0f766e'] },
};

const ACTIVE_STATUSES = new Set(['active', 'published', 'pending_review', 'pending', 'full']);

function money(amount: unknown, currency?: string) {
  return formatCurrency(amount, currency, 'fr-FR') as string;
}

/** Titre / sous-titre / méta de la carte, comme MyPublicationCards.jsx. */
export function publicationCardContent(type: PublicationType, item: PublicationItem, t: (k: string, v?: Record<string, string | number>) => string) {
  switch (type) {
    case 'other': {
      const equivalent = p2pReceivedFromOffered(item.amount, item.rate);
      return {
        title: money(item.amount, item.fromCurrency),
        subtitle: `${item.fromCurrency || ''} → ${item.toCurrency || ''}`,
        meta: [
          equivalent ? `${t('p2p.page.equivalent')} ${money(equivalent, item.toCurrency)}` : null,
          t('p2p.page.rateValue', { rate: item.rate }),
          item.method,
          item.ownerName,
        ].filter(Boolean) as string[],
        cover: '',
      };
    }
    case 'parcel':
      return { title: `${item.origin || '?'} → ${item.destination || '?'}`, subtitle: item.departureDate ? String(item.departureDate).slice(0, 10) : '', meta: [], cover: '' };
    case 'job':
      return { title: item.title || 'Sans titre', subtitle: item.salary || '', meta: [item.businessName].filter(Boolean) as string[], cover: '' };
    case 'event':
      return { title: item.title || 'Sans titre', subtitle: item.city || '', meta: [], cover: item.coverUrl || item.imageUrl || '' };
    case 'video':
      return { title: item.title || 'Sans titre', subtitle: item.caption || '', meta: [item.businessName].filter(Boolean) as string[], cover: item.thumbnailUrl || '' };
    case 'post':
      return { title: String(item.message || item.text || item.content || 'Sans titre').slice(0, 80), subtitle: item.sourceType && item.sourceType !== 'free' ? item.sourceType : '', meta: [], cover: '' };
    default:
      return {
        title: item.title || 'Sans titre',
        subtitle: item.price != null ? money(item.price, item.currency || 'RUB') : '',
        meta: [item.city].filter(Boolean) as string[],
        cover: (Array.isArray(item.images) && item.images[0]) || item.imageUrl || '',
      };
  }
}

function ActionButton({ icon: Icon, label, danger = false, onPress }: { icon: LucideIcon; label: string; danger?: boolean; onPress?: () => void }) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 11.2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: danger ? 0 : 1,
        borderColor: colors.borderMd,
        backgroundColor: danger ? (isDark ? 'rgba(69,10,10,0.5)' : colors.dangerBg) : colors.surface,
      }}>
      <Icon size={16} color={danger ? (isDark ? '#fca5a5' : colors.danger) : colors.text} strokeWidth={2} />
    </Pressable>
  );
}

/**
 * Carte « Mes publications » (PublicationCardShell du web) : visuel 145 px en dégradé
 * par type (ou photo), badge de statut, titre / sous-titre / méta en surimpression,
 * puis boutons carrés (ouvrir, modifier, archiver ou republier, supprimer).
 */
export function MyPublicationCard({
  type,
  item,
  onOpen,
  onEdit,
  onArchive,
  onReactivate,
  onDelete,
  readonly = false,
}: {
  type: PublicationType;
  item: PublicationItem;
  onOpen?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onReactivate?: () => void;
  onDelete?: () => void;
  /** Vue publique : pas de boutons de gestion. */
  readonly?: boolean;
}) {
  const { t } = useLanguage();
  const shadows = useShadows();
  const meta = PUBLICATION_TYPES[type];
  const active = ACTIVE_STATUSES.has(String(item.status || 'active'));
  const status = statusMeta(item.status || 'active') as { label: string; tone: BadgeTone };
  const content = publicationCardContent(type, item, t);
  const Icon = meta.icon;
  const archived = !active;
  let visual: ReactNode = (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={36} color="rgba(255,255,255,0.9)" strokeWidth={2} />
    </View>
  );
  if (content.cover) visual = <Image source={{ uri: content.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />;

  return (
    <View style={[{ borderRadius: 22.4, overflow: 'hidden', opacity: archived ? 0.85 : 1 }, shadows.card]}>
      <Pressable accessibilityRole="link" onPress={onOpen}>
        <LinearGradient colors={meta.tone} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 145, opacity: archived ? 0.75 : 1 }}>
          {visual}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)']}
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '66%' }}
          />
          <View style={{ position: 'absolute', left: 10, top: 10 }}>
            <WebBadge tone={status.tone in { brand: 1, success: 1, warning: 1, danger: 1, info: 1 } ? status.tone : 'brand'}>{status.label}</WebBadge>
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 }}>
            <AppText numberOfLines={2} className="text-sm font-black text-white" style={{ lineHeight: 19 }}>
              {content.title}
            </AppText>
            {content.subtitle ? (
              <AppText numberOfLines={1} className="mt-1 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {content.subtitle}
              </AppText>
            ) : null}
            {content.meta.length ? (
              <AppText numberOfLines={2} className="text-[11px] font-semibold" style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', lineHeight: 15 }}>
                {content.meta.join(' · ')}
              </AppText>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
      {readonly ? null : (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10 }}>
        <ActionButton icon={ExternalLink} label="Ouvrir" onPress={onOpen} />
        <ActionButton icon={Edit2} label="Modifier" onPress={onEdit} />
        {active ? (
          <ActionButton icon={Archive} label="Archiver" danger onPress={onArchive} />
        ) : item.status === 'archived' ? (
          <ActionButton icon={RotateCcw} label="Republier" onPress={onReactivate} />
        ) : null}
        <ActionButton icon={Trash2} label="Supprimer" danger onPress={onDelete} />
      </View>
      )}
    </View>
  );
}
