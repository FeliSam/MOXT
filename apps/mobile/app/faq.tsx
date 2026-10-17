import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  Search,
} from 'lucide-react-native';

import { AppChrome } from '@/components/chrome/AppChrome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/providers/LanguageProvider';

const FAQ_ITEMS = [
  { id: 'phone' },
  { id: 'levels' },
  { id: 'profile' },
  { id: 'email' },
  { id: 'contact' },
  { id: 'pending' },
  { id: 'report' },
];

export default function FaqScreen() {
  const { t } = useLanguage();
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ phone: true });
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = FAQ_ITEMS.filter((item) => {
    if (!search.trim()) return true;
    const q = t(`faq.${item.id}.question`).toLowerCase();
    const a = t(`faq.${item.id}.answer`).toLowerCase();
    const term = search.toLowerCase();
    return q.includes(term) || a.includes(term);
  });

  return (
    <AppChrome pathname="/faq">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
      >
        {/* Header Hero */}
        <View className="items-center text-center py-4">
          <View className="size-14 items-center justify-center rounded-2xl bg-brand-500/10 mb-4">
            <HelpCircle size={30} color="#6366f1" />
          </View>
          <Text className="text-2xl font-black text-app-text text-center">
            {t('faq.title') || 'Questions fréquentes'}
          </Text>
          <Text className="text-xs text-app-text-muted text-center mt-2 max-w-xs leading-relaxed">
            {t('faq.description') ||
              'Tout ce que vous devez savoir pour utiliser MOXT en toute sérénité.'}
          </Text>
        </View>

        {/* Search Input */}
        <View className="flex-row items-center gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2.5">
          <Search size={16} color="#94a3b8" />
          <TextInput
            placeholder="Rechercher une question..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            className="flex-1 text-xs text-app-text p-0"
          />
        </View>

        {/* FAQ Accordions Card */}
        <Card className="p-0 overflow-hidden divide-y divide-app-border">
          {filteredItems.map(({ id }) => {
            const isOpen = Boolean(openIds[id]);
            const question = t(`faq.${id}.question`);
            const answer = t(`faq.${id}.answer`);

            return (
              <View key={id} className="overflow-hidden">
                <Pressable
                  onPress={() => toggle(id)}
                  className="flex-row items-center justify-between p-4 active:bg-app-surface-muted"
                >
                  <Text className="flex-1 pr-3 text-xs font-black text-app-text leading-snug">
                    {question}
                  </Text>
                  {isOpen ? (
                    <ChevronUp size={18} color="#6366f1" />
                  ) : (
                    <ChevronDown size={18} color="#94a3b8" />
                  )}
                </Pressable>

                {isOpen && (
                  <View className="bg-app-surface-muted/60 px-4 pb-4 pt-1">
                    <Text className="text-xs leading-relaxed text-app-text-muted">
                      {answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Support CTA */}
        <Card className="items-center p-5 text-center gap-2 border-brand-200/60 bg-brand-50/50 dark:border-brand-900/40 dark:bg-brand-950/20">
          <MessageSquare size={22} color="#6366f1" />
          <Text className="text-sm font-black text-app-text">
            Vous ne trouvez pas de réponse ?
          </Text>
          <Text className="text-xs text-app-text-muted text-center">
            Notre équipe d’assistance est disponible 7j/7 pour vous accompagner.
          </Text>
          <Button
            size="sm"
            className="mt-2"
            onPress={() => router.push('/support')}
          >
            Contacter le support
          </Button>
        </Card>
      </ScrollView>
    </AppChrome>
  );
}
