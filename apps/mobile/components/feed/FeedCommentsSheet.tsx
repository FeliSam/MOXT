import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Trash2, X } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { addEngagementComment, deleteEngagementComment, type EngagementComment, type EngagementKind } from '@/store/engagement';
import type { AuthUser } from '@/store/types';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeCssVars } from '@/theme/ThemeContext';

const MEMBER_FALLBACK = 'Membre MOXT';

function personDisplayName(person: Partial<AuthUser> & { name?: string } | null | undefined, fallback = MEMBER_FALLBACK) {
  if (!person) return fallback;
  const fromParts = `${person.firstName || ''} ${person.lastName || ''}`.trim();
  if (fromParts) return fromParts;
  const raw = String(person.name || '').trim();
  if (raw && !raw.includes('@')) return raw;
  return fallback;
}

function commentDisplayName(comment: EngagementComment, user: AuthUser | null) {
  if (user?.id && comment.authorId === user.id) return personDisplayName(user);
  return personDisplayName({ name: comment.authorName });
}

/** Commentaires de l'entité ciblée, lus en direct dans les stores. */
function useEntity(kind: EngagementKind, entityId: string) {
  return useAppSelector((s) => {
    if (kind === 'listing') return s.marketplace.items.find((item) => item.id === entityId) || null;
    if (kind === 'post') return s.feed.posts.find((item) => item.id === entityId) || null;
    return s.feed.videos.find((item) => item.id === entityId) || null;
  }) as { ownerId?: string; authorId?: string; comments?: unknown } | null;
}

/**
 * Feuille de commentaires du Fil (web FeedCommentsSheet / VideoCommentsSheet) :
 * fond #121212, poignée, titre + compteur, bulles, saisie « Ajouter un commentaire… ».
 */
export function FeedCommentsSheet({
  kind,
  entityId,
  open,
  onClose,
}: {
  kind: EngagementKind;
  entityId: string;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const cssVars = useThemeCssVars();
  const user = useAppSelector((s) => s.auth.user);
  const entity = useEntity(kind, entityId);
  const [text, setText] = useState('');
  const comments = (Array.isArray(entity?.comments) ? entity.comments : []).filter(
    (c): c is EngagementComment => Boolean(c && typeof c === 'object'),
  );
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
  const selfName = personDisplayName(user);

  useEffect(() => {
    if (open) setText('');
  }, [open, entityId]);

  function submit() {
    const trimmed = text.trim();
    if (!user?.id) {
      onClose();
      router.push('/login' as never);
      return;
    }
    if (!trimmed || !entityId) return;
    dispatch(
      addEngagementComment({
        kind,
        entityId,
        authorId: user.id,
        authorName: selfName,
        authorAvatarUrl: user.avatarUrl || '',
        text: trimmed,
      }),
    ).catch(() => undefined);
    setText('');
  }

  function remove(commentId: string) {
    if (!user?.id) return;
    dispatch(deleteEngagementComment({ kind, entityId, commentId, userId: user.id })).catch(() => undefined);
  }

  const ownerId = entity?.ownerId || entity?.authorId;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, cssVars]}>
        <Pressable accessibilityLabel="Fermer les commentaires" onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        <View
          accessibilityLabel="Commentaires"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '72%',
            borderTopLeftRadius: 22.4,
            borderTopRightRadius: 22.4,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: '#121212',
            paddingBottom: Math.max(12, insets.bottom),
          }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderBottomWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 16,
              paddingBottom: 12,
              paddingTop: 4,
            }}>
            <View>
              <AppText className="text-sm font-black text-white">Commentaires</AppText>
              <AppText className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {comments.length} commentaire(s)
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Fermer les commentaires"
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <X size={16} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">
            {comments.length ? (
              <View accessibilityLabel="Liste des commentaires" style={{ gap: 14 }}>
                {comments.map((comment) => {
                  const name = commentDisplayName(comment, user);
                  const canDelete = Boolean(comment.id && (user?.id === comment.authorId || (ownerId && user?.id === ownerId) || isModerator));
                  return (
                    <View key={comment.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={{ paddingTop: 2 }}>
                        {comment.authorAvatarUrl ? (
                          <Image
                            source={{ uri: comment.authorAvatarUrl }}
                            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(255,255,255,0.12)',
                              borderWidth: 1,
                              borderColor: 'rgba(255,255,255,0.15)',
                            }}>
                            <AppText className="text-xs font-black text-white">{(name || '?').charAt(0).toUpperCase()}</AppText>
                          </View>
                        )}
                      </View>
                      <View
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: 18.4,
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                        }}>
                        <AppText numberOfLines={1} className="text-[13px] font-black text-white" style={{ letterSpacing: -0.33 }}>
                          {name}
                        </AppText>
                        <AppText className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.88)', lineHeight: 18 }}>
                          {comment.text}
                        </AppText>
                      </View>
                      {canDelete ? (
                        <Pressable
                          accessibilityLabel="Supprimer le commentaire"
                          onPress={() => remove(comment.id)}
                          style={{ marginTop: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} color="rgba(255,255,255,0.35)" strokeWidth={2} />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <AppText className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Soyez le premier à commenter.
              </AppText>
            )}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderTopWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
            ) : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                }}>
                <AppText className="text-xs font-black text-white">{(selfName || '?').charAt(0).toUpperCase()}</AppText>
              </View>
            )}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ajouter un commentaire…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              maxLength={500}
              onSubmitEditing={submit}
              returnKeyType="send"
              style={{
                flex: 1,
                minWidth: 0,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.07)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 14,
                color: '#fff',
              }}
            />
            <Pressable
              accessibilityLabel="Envoyer"
              disabled={!text.trim()}
              onPress={submit}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                opacity: text.trim() ? 1 : 0.4,
              }}>
              <Send size={16} color="#000" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
