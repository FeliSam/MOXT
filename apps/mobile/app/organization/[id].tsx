import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { Badge, Button, Card, Input, PageHeader, SectionHeading } from '@/components/ui';
import { inviteMember, loadOrgMembers, OrgMember, OrgRole, removeMember } from '@/store/organizations';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: 'Propriétaire',
  admin: 'Admin',
  member: 'Membre',
  viewer: 'Lecteur',
};

const ROLE_TONES: Record<OrgRole, 'brand' | 'info' | 'success' | 'neutral'> = {
  owner: 'brand',
  admin: 'info',
  member: 'success',
  viewer: 'neutral',
};

export default function OrganizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const org = useAppSelector((state) => state.organizations.currentOrg);
  const members = useAppSelector((state) => state.organizations.members);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');

  const myRole = org?.myRole;
  const canManage = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    if (id) dispatch(loadOrgMembers(id));
  }, [dispatch, id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !id) return;
    try {
      await dispatch(
        inviteMember({ orgId: id, email: inviteEmail.trim(), role: inviteRole }),
      ).unwrap();
      setShowInvite(false);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleRemove = (member: OrgMember) => {
    if (member.role === 'owner') return;
    Alert.alert('Retirer le membre', `Retirer ${member.name} ?`, [
      { text: 'Annuler' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => dispatch(removeMember({ orgId: id!, userId: member.userId })),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWrap}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>←</Text>
          <Text style={[styles.backLabel, { color: colors.primary }]}>Retour</Text>
        </Pressable>
      </View>
      <PageHeader
        eyebrow="Organisation"
        title={org?.name || 'Organisation'}
        description={org?.description}
      />

      {canManage && (
        <View style={styles.inviteSection}>
          <Button
            variant={showInvite ? 'secondary' : 'primary'}
            onPress={() => setShowInvite(!showInvite)}>
            {showInvite ? '✕ Annuler' : '+ Inviter un membre'}
          </Button>

          {showInvite && (
            <Card style={styles.inviteCard}>
              <Input
                label="Email du membre"
                placeholder="nom@exemple.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
              />
              <View style={styles.rolesRow}>
                {(['member', 'admin', 'viewer'] as OrgRole[]).map((r) => (
                  <Pressable
                    key={r}
                    style={[
                      styles.roleChip,
                      {
                        borderColor: inviteRole === r ? colors.primary : colors.border,
                        backgroundColor: inviteRole === r ? colors.primaryLight : 'transparent',
                      },
                    ]}
                    onPress={() => setInviteRole(r)}>
                    <Text
                      style={[
                        styles.roleChipText,
                        { color: inviteRole === r ? colors.primary : colors.textMuted },
                      ]}>
                      {ROLE_LABELS[r]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button variant="primary" onPress={handleInvite}>
                Envoyer l'invitation
              </Button>
            </Card>
          )}
        </View>
      )}

      <SectionHeading title={`Membres (${members.length})`} />

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const initials = item.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join('');

          return (
            <View
              style={[
                styles.memberCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                shadows.card,
              ]}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{initials || '?'}</Text>
              </View>
              <View style={styles.memberBody}>
                <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.memberEmail, { color: colors.textFaint }]}>{item.email}</Text>
              </View>
              <Badge tone={ROLE_TONES[item.role] || 'neutral'}>{ROLE_LABELS[item.role]}</Badge>
              {canManage && item.role !== 'owner' && item.userId !== userId && (
                <Pressable onPress={() => handleRemove(item)} style={styles.removeBtn}>
                  <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  backArrow: { fontSize: 20 },
  backLabel: { fontSize: 16, fontWeight: '600' },
  inviteSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.md, gap: spacing.sm },
  inviteCard: { gap: spacing.sm },
  rolesRow: { flexDirection: 'row', gap: spacing.sm },
  roleChip: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
  },
  roleChipText: { ...typography.caption, fontWeight: '700' },
  list: { paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  memberBody: { flex: 1, gap: 2 },
  memberName: { ...typography.label, fontSize: 15 },
  memberEmail: { ...typography.eyebrow },
  removeBtn: { paddingHorizontal: 6, paddingVertical: spacing.xs },
});
