import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { upsertStrippingUnknown } from '@/services/rowWrite';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Tab = 'identity' | 'recipient' | 'carrier';
type Address = { id: string; label?: string; city?: string; country?: string; addressLine?: string; phone?: string };

/** Adresses : identité du profil, destinataires, transporteur à venir (AddressesPage). */
export default function AddressesScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [tab, setTab] = useState<Tab>('identity');
  const [items, setItems] = useState<Address[]>([]);
  const [label, setLabel] = useState('');
  const [city, setCity] = useState('');
  const [line, setLine] = useState('');
  const [phone, setPhone] = useState('');

  async function reload() {
    if (!user?.id || !supabase) return;
    const { data } = await supabase.from('recipient_addresses').select('*').eq('user_id', user.id).limit(40);
    setItems(fromRows(data || []) as Address[]);
  }

  useEffect(() => {
    void reload();
  }, [user?.id]);

  async function add() {
    if (!user) return;
    const id = `RCP-${Date.now().toString(36).toUpperCase()}`;
    try {
      await upsertStrippingUnknown('recipient_addresses', {
        id,
        user_id: user.id,
        owner_type: 'PERSON',
        label: label.trim(),
        country: user.originCountry || 'BJ',
        city: city.trim(),
        address_line: line.trim(),
        phone: phone.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setLabel('');
      setCity('');
      setLine('');
      setPhone('');
      await reload();
    } catch (error) {
      showNotice('Adresses', error instanceof Error ? error.message : 'Enregistrement impossible.');
    }
  }

  async function remove(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('recipient_addresses').delete().eq('id', id);
    if (error) showNotice('Adresses', error.message);
    else setItems((list) => list.filter((item) => item.id !== id));
  }

  const field = { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12, backgroundColor: colors.surface };
  const tabs: [Tab, string][] = [['identity', 'Identité'], ['recipient', 'Destinataires'], ['carrier', 'Transporteur']];

  return (
    <AppChrome pathname="/addresses">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <AppText className="text-2xl font-black text-app-text">Adresses</AppText>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tabs.map(([id, name]) => (
            <Pressable key={id} onPress={() => setTab(id)} style={{ flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === id ? colors.accent : colors.surfaceMuted }}>
              <AppText className="text-xs font-bold" style={{ color: tab === id ? (isDark ? '#020617' : '#fff') : colors.text }}>{name}</AppText>
            </Pressable>
          ))}
        </View>
        {tab === 'identity' ? (
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 6 }}>
            <AppText className="font-bold text-app-text">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Profil'}</AppText>
            <AppText className="text-sm text-app-text-muted">{[user?.city, user?.country || user?.originCountry].filter(Boolean).join(', ') || 'Ville non renseignée'}</AppText>
            <AppText className="text-sm text-app-text-muted">{user?.phone || 'Téléphone non renseigné'}</AppText>
            <AppText className="text-xs text-app-text-faint">Modifiez ces informations depuis le profil.</AppText>
          </View>
        ) : null}
        {tab === 'recipient' ? (
          <>
            <TextInput value={label} onChangeText={setLabel} placeholder="Libellé" placeholderTextColor={colors.textFaint} style={field} />
            <TextInput value={city} onChangeText={setCity} placeholder="Ville" placeholderTextColor={colors.textFaint} style={field} />
            <TextInput value={line} onChangeText={setLine} placeholder="Adresse" placeholderTextColor={colors.textFaint} style={field} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Téléphone" placeholderTextColor={colors.textFaint} style={field} />
            <Pressable onPress={() => void add()} style={{ minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
              <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Ajouter</AppText>
            </Pressable>
            {items.map((item) => (
              <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 }}>
                <AppText className="font-bold text-app-text">{item.label || 'Destinataire'}</AppText>
                <AppText className="text-sm text-app-text-muted">{[item.addressLine, item.city, item.country].filter(Boolean).join(', ')}</AppText>
                <Pressable onPress={() => void remove(item.id)}><AppText className="text-sm font-bold text-red-600">Supprimer</AppText></Pressable>
              </View>
            ))}
          </>
        ) : null}
        {tab === 'carrier' ? (
          <AppText className="text-sm text-app-text-muted">Les adresses transporteur arrivent bientôt, comme sur le web.</AppText>
        ) : null}
      </ScrollView>
    </AppChrome>
  );
}
