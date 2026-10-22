import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, Plus, Star, User, Users, X } from 'lucide-react-native';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { phoneError, phonePlaceholder, phonePrefix, validatePhone } from '@/constants/phone';
import { twTransfer } from '@/constants/transferTailwind';
import { paymentMethodsForCountry } from '@/constants/transfers';
import { cn } from '@/lib/cn';
import { supabase } from '@/services/supabase';
import { saveTransferProfile, type TransferProfile } from '@/store/account';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

export function TransferWizardPartyStep({
  title,
  country,
  isRecipient,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  method,
  setMethod,
  userId,
}: {
  title: string;
  country: string;
  isRecipient?: boolean;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
  userId?: string;
}) {
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const methods = paymentMethodsForCountry(country);
  const profiles = useAppSelector((state) => state.account.transferProfiles || []);

  const [createOpen, setCreateOpen] = useState(false);
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createPhone, setCreatePhone] = useState(phonePrefix(country));
  const [createMethod, setCreateMethod] = useState<string>(methods[0] || '');
  const [createError, setCreateError] = useState('');

  const matchingProfiles = useMemo(() => {
    const target = String(country || '').toUpperCase();
    return profiles.filter((p) => {
      const pCountry = String(p.country || '').toUpperCase();
      if (!pCountry || !target) return false;
      if (pCountry === target) return true;
      const pIsRu = pCountry === 'RU';
      const targetIsRu = target === 'RU';
      return pIsRu === targetIsRu;
    });
  }, [profiles, country]);

  const phoneIsValid = !phone || validatePhone(phone, country);
  const phoneErrorMessage = phone && !phoneIsValid ? phoneError(country) : '';

  function openCreateModal() {
    setCreateFirstName(firstName.trim());
    setCreateLastName(lastName.trim());
    setCreatePhone(phone.trim() || phonePrefix(country));
    setCreateMethod(method || methods[0] || '');
    setCreateError('');
    setCreateOpen(true);
  }

  async function handleSaveNewProfile() {
    const fn = createFirstName.trim();
    const ln = createLastName.trim();
    const ph = createPhone.trim();
    const me = createMethod.trim();

    if (!fn || !ln) {
      setCreateError('Veuillez renseigner le prénom et le nom.');
      return;
    }
    if (!validatePhone(ph, country)) {
      setCreateError(phoneError(country));
      return;
    }
    if (!me) {
      setCreateError('Veuillez sélectionner un moyen de paiement.');
      return;
    }

    const newProfile: TransferProfile = {
      id: `TP-${Date.now().toString(36).toUpperCase()}`,
      userId: userId || '',
      firstName: fn,
      lastName: ln,
      phone: ph,
      country: String(country).toUpperCase(),
      method: me,
      createdAt: new Date().toISOString(),
    };

    dispatch(saveTransferProfile(newProfile));

    if (supabase && userId) {
      await supabase.from('transfer_profiles').upsert({
        id: newProfile.id,
        user_id: userId,
        first_name: fn,
        last_name: ln,
        phone: ph,
        country: newProfile.country,
        method: me,
      });
    }

    setFirstName(fn);
    setLastName(ln);
    setPhone(ph);
    setMethod(me);
    setCreateOpen(false);
    showNotice('Profil enregistré', `${fn} ${ln} a été ajouté à vos profils favoris.`);
  }

  function applyProfile(p: TransferProfile) {
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setPhone(p.phone);
    if ((methods as readonly string[]).includes(p.method)) {
      setMethod(p.method);
    } else if (methods.length > 0) {
      setMethod(methods[0]);
    }
  }

  return (
    <View className="gap-5">
      {/* 1. Carte des profils favoris (placée au-dessus des champs, exactement comme sur le Web) */}
      <View className="rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm">
        <View className="flex-row items-center justify-between border-b border-app-border pb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <Star size={16} color="#d97706" fill="#d97706" />
            </View>
            <Text className="text-sm font-black text-app-text">Profils favoris</Text>
          </View>
          <Pressable
            onPress={openCreateModal}
            className="flex-row items-center gap-1 rounded-xl bg-app-surface-muted px-3 py-1.5"
          >
            <Plus size={14} color={isDark ? '#e4e4e7' : '#0f172a'} />
            <Text className="text-xs font-bold text-app-text">Nouveau</Text>
          </Pressable>
        </View>

        {matchingProfiles.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2.5 pt-3"
          >
            {matchingProfiles.map((p) => {
              const isSelected =
                phone.replace(/\D/g, '') === p.phone.replace(/\D/g, '') &&
                firstName.toLowerCase().trim() === p.firstName.toLowerCase().trim();
              const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
              return (
                <Pressable
                  key={p.id}
                  onPress={() => applyProfile(p)}
                  className={cn(
                    'flex-row items-center gap-2.5 rounded-2xl border p-3',
                    isSelected
                      ? 'border-brand-600 bg-brand-50/70 dark:border-brand-400 dark:bg-brand-950/40'
                      : 'border-app-border bg-app-surface',
                  )}
                  style={{ minWidth: 155 }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-app-surface-muted">
                    <Text className="text-xs font-black text-app-text">{initials}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs font-black text-app-text" numberOfLines={1}>
                      {p.firstName} {p.lastName}
                    </Text>
                    <Text className="text-[10px] font-semibold text-app-text-muted" numberOfLines={1}>
                      {p.method}
                    </Text>
                  </View>
                  {isSelected ? <Check size={14} color="#08705f" strokeWidth={3} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text className="pt-3 text-xs text-app-text-muted">
            Aucun profil favori enregistré pour ce pays. Renseignez les coordonnées ci-dessous.
          </Text>
        )}
      </View>

      {/* 2. Coordonnées de la partie (Expéditeur ou Destinataire) */}
      <View className={twTransfer.card}>
        <TransferWizardSectionTitle
          icon={isRecipient ? Users : User}
          label={title}
          iconClass={isRecipient ? twTransfer.partyHeaderRecipient : twTransfer.partyHeaderSender}
        />

        <View className="gap-4">
          <View>
            <Text className={twTransfer.fieldLabel}>PRÉNOM</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              placeholder="Prénom"
              placeholderTextColor="#94a3b8"
              className={twTransfer.fieldInput}
              style={{ fontSize: 16 }}
            />
          </View>
          <View>
            <Text className={twTransfer.fieldLabel}>NOM</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              placeholder="Nom de famille"
              placeholderTextColor="#94a3b8"
              className={twTransfer.fieldInput}
              style={{ fontSize: 16 }}
            />
          </View>
          <View>
            <Text className={twTransfer.fieldLabel}>NUMÉRO DE TÉLÉPHONE</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={phonePlaceholder(country)}
              placeholderTextColor="#94a3b8"
              className={cn(
                twTransfer.fieldInput,
                phoneErrorMessage ? 'border-red-500' : undefined,
              )}
              style={{ fontSize: 16 }}
            />
            {phoneErrorMessage ? (
              <Text className="mt-1 text-xs font-semibold text-red-500">{phoneErrorMessage}</Text>
            ) : null}
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-bold text-app-text dark:text-zinc-50">
              Réseau ou banque
            </Text>
            {country === 'RU' ? (
              <Text className="mb-2 text-xs text-app-text-muted">
                Virement instantané SBP vers la banque du destinataire
              </Text>
            ) : null}
            <View className="flex-row flex-wrap gap-2">
              {methods.map((m) => {
                const active = method === m;
                return (
                  <Pressable
                    key={m}
                    className={cn(
                      twTransfer.methodChip,
                      active ? twTransfer.methodChipActive : twTransfer.methodChipIdle,
                    )}
                    onPress={() => setMethod(m)}
                  >
                    <Text
                      className={
                        active ? twTransfer.methodChipTextActive : twTransfer.methodChipTextIdle
                      }
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Modal de création d'un profil favori */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setCreateOpen(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>
                Enregistrer un profil favori
              </Text>
              <Pressable
                onPress={() => setCreateOpen(false)}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {createError ? (
              <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: 12 }}>
                <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>{createError}</Text>
              </View>
            ) : null}

            <View style={{ gap: 12 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  PRÉNOM
                </Text>
                <TextInput
                  value={createFirstName}
                  onChangeText={setCreateFirstName}
                  autoCapitalize="words"
                  placeholder="Prénom"
                  placeholderTextColor={colors.textFaint}
                  style={{
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.text,
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  NOM
                </Text>
                <TextInput
                  value={createLastName}
                  onChangeText={setCreateLastName}
                  autoCapitalize="words"
                  placeholder="Nom"
                  placeholderTextColor={colors.textFaint}
                  style={{
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.text,
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 }}>
                  TÉLÉPHONE
                </Text>
                <TextInput
                  value={createPhone}
                  onChangeText={setCreatePhone}
                  keyboardType="phone-pad"
                  placeholder={phonePlaceholder(country)}
                  placeholderTextColor={colors.textFaint}
                  style={{
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.text,
                  }}
                />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>
                  RÉSEAU / BANQUE
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {methods.map((m) => {
                    const sel = createMethod === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setCreateMethod(m)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: sel ? '#08705f' : colors.border,
                          backgroundColor: sel ? 'rgba(8,112,95,0.1)' : colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: sel ? '#08705f' : colors.text }}>
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleSaveNewProfile}
              style={{
                backgroundColor: '#08705f',
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                Enregistrer ce favori
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
