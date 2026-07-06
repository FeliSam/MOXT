import { Pressable, Text, TextInput, View } from 'react-native';

import { TransferWizardSectionTitle } from '@/components/transfers/wizard/TransferWizardSectionTitle';
import { twTransfer } from '@/constants/transferTailwind';
import { paymentMethodsForCountry } from '@/constants/transfers';
import { cn } from '@/lib/cn';

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
}) {
  const methods = paymentMethodsForCountry(country);

  return (
    <View className={twTransfer.card}>
      <View className={twTransfer.sectionTitle}>
        <View
          className={cn(
            twTransfer.sectionIcon,
            isRecipient ? twTransfer.partyHeaderRecipient : twTransfer.partyHeaderSender,
          )}>
          <Text className="text-base">👤</Text>
        </View>
        <Text className={twTransfer.sectionLabel}>{title}</Text>
      </View>

      <View className="gap-4">
        <View>
          <Text className={twTransfer.fieldLabel}>FIRST NAME</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            className={twTransfer.fieldInput}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View>
          <Text className={twTransfer.fieldLabel}>LAST NAME</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            className={twTransfer.fieldInput}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View>
          <Text className={twTransfer.fieldLabel}>TÉLÉPHONE</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            className={twTransfer.fieldInput}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View>
          <Text className="mb-1.5 text-sm font-bold text-app-text dark:text-zinc-50">Réseau ou banque</Text>
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
                  onPress={() => setMethod(m)}>
                  <Text className={active ? twTransfer.methodChipTextActive : twTransfer.methodChipTextIdle}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Text className={twTransfer.helperText}>
          Aucun profil favori pour ce pays. Renseignez manuellement.
        </Text>
      </View>
    </View>
  );
}
