import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { DIRECTIONS, calculateTransfer } from '@/constants/transfers';
import { useTheme } from '@/theme/ThemeContext';

const SERVICES = [
  { title: 'Transferts', body: 'Envoyez entre le Bénin et la Russie avec un partenaire vérifié.', path: '/discover' },
  { title: 'Marketplace', body: 'Annonces de la communauté.', path: '/marketplace' },
  { title: 'Colis', body: 'Voyageurs et envois.', path: '/discover' },
  { title: 'Emplois', body: 'Offres et candidatures.', path: '/discover' },
  { title: 'Événements', body: 'Rencontres et inscriptions.', path: '/discover' },
  { title: 'Échanges P2P', body: 'Devises entre membres, hors séquestre.', path: '/discover' },
];

/** Accueil public (PublicHomePage) : promesse, estimation, services. */
export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const [direction, setDirection] = useState<string>(DIRECTIONS.BJ_TO_RU);
  const [amount, setAmount] = useState('50000');
  const calc = useMemo(() => calculateTransfer(Number(amount) || 0, direction), [amount, direction]);

  return (
    <AppChrome pathname="/">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 128 }}>
        <AppText className="text-xs font-black uppercase text-app-accent">MOXT</AppText>
        <AppText className="text-3xl font-black text-app-text">La communauté Bénin — Russie</AppText>
        <AppText className="text-sm text-app-text-muted">
          Transferts, annonces, colis, emplois et échanges entre membres. L’inscription est gratuite.
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => router.push('/register' as never)} style={{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
            <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Créer un compte</AppText>
          </Pressable>
          <Pressable onPress={() => router.push('/discover' as never)} style={{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
            <AppText className="font-bold text-app-text">Découvrir</AppText>
          </Pressable>
        </View>
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16, gap: 10 }}>
          <AppText className="font-black text-app-text">Estimer un transfert</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              [DIRECTIONS.BJ_TO_RU, 'Bénin → Russie'],
              [DIRECTIONS.RU_TO_BJ, 'Russie → Bénin'],
            ].map(([id, label]) => (
              <Pressable key={id} onPress={() => setDirection(id)} style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: direction === id ? colors.accent : colors.surfaceMuted }}>
                <AppText className="text-xs font-bold" style={{ color: direction === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{label}</AppText>
              </Pressable>
            ))}
          </View>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Montant" placeholderTextColor={colors.textFaint} style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }} />
          <AppText className="text-sm text-app-text">
            Reçu estimé : {Math.round(calc.amountReceived).toLocaleString('fr-FR')} {calc.currencyTo}
          </AppText>
          <AppText className="text-xs text-app-text-muted">Frais estimés : {Math.round(calc.fees).toLocaleString('fr-FR')} {calc.currencyFrom}</AppText>
          <Pressable onPress={() => router.push('/register' as never)}>
            <AppText className="font-bold text-app-accent">Créer un compte pour envoyer</AppText>
          </Pressable>
        </View>
        {SERVICES.map((service) => (
          <Pressable key={service.title} onPress={() => router.push(service.path as never)} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 4 }}>
            <AppText className="font-black text-app-text">{service.title}</AppText>
            <AppText className="text-sm text-app-text-muted">{service.body}</AppText>
          </Pressable>
        ))}
        <Pressable onPress={() => router.push('/login' as never)}>
          <AppText className="text-center text-sm font-bold text-app-text-muted">J’ai déjà un compte</AppText>
        </Pressable>
      </ScrollView>
    </AppChrome>
  );
}
