import { useState } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';

import { openContactConversation } from '@moxt/shared/services/contactService.js';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/services/supabase';
import { mapConversationRow, receiveRemoteConversation } from '@/store/messages';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type ContactProps = {
  ownerId?: string;
  relatedType: string;
  relatedId: string;
  relatedPath: string;
  relatedTitle: string;
  subtitle?: string;
  badge?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  iconOnly?: boolean;
  onContact?: () => void;
};

/** Ouvre la conversation liée, comme ContactButton du web (plus de lien tel/WhatsApp brut). */
export function ContactButton({
  ownerId,
  relatedType,
  relatedId,
  relatedPath,
  relatedTitle,
  subtitle,
  badge,
  label = 'Contacter',
  variant = 'primary',
  iconOnly = false,
  onContact,
}: ContactProps) {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  if (!ownerId || (user?.id && ownerId === user.id)) return null;

  async function contact() {
    if (!user?.id || !ownerId) {
      router.push('/login' as never);
      return;
    }
    if (!supabase || loading) return;
    setLoading(true);
    onContact?.();
    try {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      const result = await openContactConversation(supabase, {
        createdBy: user.id,
        ownerId,
        senderName: name,
        relatedType,
        relatedId,
        relatedPath,
        relatedSnapshot: {
          type: relatedType,
          id: relatedId,
          title: relatedTitle,
          path: relatedPath,
          subtitle,
          badge,
        },
      });
      dispatch(receiveRemoteConversation(mapConversationRow(result.conversation as unknown as Record<string, unknown>)));
      router.push(`/messages/${result.id}` as never);
    } catch (error) {
      showNotice('Contacter', error instanceof Error ? error.message : 'Conversation impossible.');
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <Pressable
        accessibilityLabel={label}
        onPress={() => void contact()}
        style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        <MessageCircle size={18} color={colors.text} />
      </Pressable>
    );
  }

  return (
    <Button variant={variant} loading={loading} onPress={() => void contact()} icon={<MessageCircle size={16} color={variant === 'secondary' ? colors.text : colors.onPrimary} />}>
      {loading ? 'Ouverture…' : label}
    </Button>
  );
}
