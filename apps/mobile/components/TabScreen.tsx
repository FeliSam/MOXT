import { StyleSheet, Text, View } from 'react-native';
import { bottomNavigationItems } from '@moxt/shared';
import { useLanguage } from '@/providers/LanguageProvider';

type ScreenProps = {
  item: (typeof bottomNavigationItems)[number];
};

export function TabScreen({ item }: ScreenProps) {
  const { translateLabel } = useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>MOXT Mobile · Phase 2</Text>
      <Text style={styles.title}>{translateLabel(item.label)}</Text>
      <Text style={styles.path}>Web: {item.path}</Text>
      <Text style={styles.note}>
        Transferts et Colis synchronisés via Supabase. Marketplace en Phase 3.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#0369a1',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  path: {
    fontSize: 14,
    color: '#64748b',
  },
  note: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
});
