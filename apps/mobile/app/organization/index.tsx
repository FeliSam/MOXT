import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button, Card, Input, PageHeader } from '@/components/ui';
import { createOrganization, loadOrganizations, Organization, setCurrentOrg } from '@/store/organizations';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useThemeColors } from '@/theme/ThemeContext';
import { brand, radii, shadows, spacing, typography } from '@/theme/colors';

export default function OrganizationsScreen() {
  const dispatch = useAppDispatch();
  const colors = useThemeColors();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { orgs, loading } = useAppSelector((state) => state.organizations);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    if (userId) dispatch(loadOrganizations(userId));
  }, [dispatch, userId]);

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return;
    try {
      await dispatch(
        createOrganization({ userId, name: newName.trim(), description: newDesc.trim() || undefined }),
      ).unwrap();
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleSelect = (org: Organization) => {
    dispatch(setCurrentOrg(org));
    router.push(`/organization/${org.id}` as any);
  };

  const ROLE_LABELS: Record<string, string> = {
    owner: 'Propriétaire',
    admin: 'Admin',
    member: 'Membre',
    viewer: 'Lecteur',
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
        eyebrow="Espace collaboratif"
        title="Organisations"
        actions={
          <Button
            variant={showCreate ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => setShowCreate(!showCreate)}>
            {showCreate ? '✕ Annuler' : '+ Créer'}
          </Button>
        }
      />

      {showCreate && (
        <Card style={styles.createCard}>
          <Input
            label="Nom de l'organisation"
            placeholder="Ex. MOXT Corp"
            value={newName}
            onChangeText={setNewName}
          />
          <Input
            label="Description (optionnel)"
            placeholder="Décrivez votre organisation..."
            value={newDesc}
            onChangeText={setNewDesc}
          />
          <Button variant="primary" onPress={handleCreate}>
            Créer
          </Button>
        </Card>
      )}

      <FlatList
        data={orgs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => {
          if (userId) dispatch(loadOrganizations(userId));
        }}
        renderItem={({ item }) => {
          const initials = item.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join('');

          return (
            <Pressable
              style={[
                styles.orgCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                shadows.card,
              ]}
              onPress={() => handleSelect(item)}>
              <View style={styles.orgAvatar}>
                <Text style={styles.orgAvatarText}>{initials || '🏢'}</Text>
              </View>
              <View style={styles.orgBody}>
                <Text style={[styles.orgName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.orgMeta, { color: colors.textMuted }]}>
                  {item.memberCount} membre{item.memberCount > 1 ? 's' : ''} •{' '}
                  {ROLE_LABELS[item.myRole] || item.myRole}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🏢</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucune organisation. Créez-en une pour collaborer !
            </Text>
          </View>
        }
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
  createCard: { marginHorizontal: spacing.xl, marginBottom: spacing.lg, gap: spacing.sm },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
  },
  orgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgAvatarText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  orgBody: { flex: 1, gap: 2 },
  orgName: { ...typography.label, fontSize: 16 },
  orgMeta: { ...typography.caption },
  empty: { paddingVertical: 40, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.body, textAlign: 'center', paddingHorizontal: spacing['3xl'] },
});
