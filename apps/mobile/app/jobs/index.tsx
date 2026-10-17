import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Plus,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react-native';

import { formatShortDate } from '@moxt/shared/utils/formatters.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { VerifiedIcon } from '@/components/ui/VerifiedIcon';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { brand } from '@/theme/palette';
import { useTheme } from '@/theme/ThemeContext';
import { useSmartNavbarScroll } from '@/hooks/useSmartNavbar';

type JobItem = {
  id: string;
  title: string;
  company?: string;
  publisherName?: string;
  city?: string;
  location?: string;
  type?: string;
  contractType?: string;
  salary?: string | number;
  currency?: string;
  sector?: string;
  status?: string;
  businessId?: string | null;
  created_at?: string;
  createdAt?: string;
};

const CONTRACT_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'cdi', label: 'CDI' },
  { key: 'cdd', label: 'CDD' },
  { key: 'freelance', label: 'Freelance' },
  { key: 'stage', label: 'Stage' },
  { key: 'temps_partiel', label: 'Temps partiel' },
];

export default function JobsScreen() {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [contractFilter, setContractFilter] = useState('');

  const fetchJobs = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, title, company, publisher_name, city, location, type, contract_type, salary, currency, sector, status, business_id, created_at')
      .order('created_at', { ascending: false })
      .limit(60);

    setJobs(
      ((data as any[]) || []).map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company || row.publisher_name,
        publisherName: row.publisher_name,
        city: row.city || row.location,
        location: row.location || row.city,
        type: row.type || row.contract_type,
        contractType: row.contract_type || row.type,
        salary: row.salary,
        currency: row.currency || 'RUB',
        sector: row.sector,
        status: row.status || 'active',
        businessId: row.business_id,
        created_at: row.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'active'), [jobs]);
  const archivedJobs = useMemo(() => jobs.filter((j) => j.status !== 'active'), [jobs]);

  const displayedJobs = useMemo(() => {
    const list = tab === 'active' ? activeJobs : archivedJobs;
    const q = query.trim().toLowerCase();
    const cf = contractFilter.toLowerCase();

    return list.filter((job) => {
      if (cf && !String(job.contractType || '').toLowerCase().includes(cf)) {
        return false;
      }
      if (!q) return true;
      const haystack = `${job.title} ${job.company || ''} ${job.city || ''} ${job.sector || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeJobs, archivedJobs, contractFilter, query, tab]);

  const { onScroll, scrollEventThrottle } = useSmartNavbarScroll();

  return (
    <AppChrome pathname="/jobs">
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 14 }}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={brand[700]} />}
      >
        {/* Modern Top Header Row */}
        <View className="flex-row items-center justify-between gap-3 pt-1">
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-400">
              RECRUTEMENT & MISSIONS
            </Text>
            <Text className="text-xl font-black text-app-text" numberOfLines={1}>
              Jobs & Emplois
            </Text>
            <Text className="text-xs font-semibold text-app-text-muted" numberOfLines={1}>
              {activeJobs.length} offre(s) active(s)
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/jobs/applications' as never)}
              className="min-h-[42px] px-3.5 items-center justify-center rounded-2xl border border-app-border bg-app-surface shadow-sm">
              <Text className="text-xs font-bold text-app-text">Candidatures</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/publish/job' as never)}
              className="min-h-[42px] px-4 items-center justify-center rounded-2xl bg-brand-700 dark:bg-brand-500 shadow-sm flex-row gap-1.5">
              <Plus size={15} color="#fff" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-white">Publier</Text>
            </Pressable>
          </View>
        </View>

        {/* Active vs Archived Segmented Tabs */}
        <View className="flex-row items-center rounded-2xl bg-app-surface border border-app-border p-1">
          <Pressable
            onPress={() => setTab('active')}
            className={`flex-1 py-2 rounded-xl items-center ${
              tab === 'active'
                ? 'bg-brand-600 dark:bg-brand-500'
                : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                tab === 'active' ? 'text-white' : 'text-app-text-muted'
              }`}
            >
              Offres actives ({activeJobs.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('archived')}
            className={`flex-1 py-2 rounded-xl items-center ${
              tab === 'archived'
                ? 'bg-brand-600 dark:bg-brand-500'
                : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                tab === 'archived' ? 'text-white' : 'text-app-text-muted'
              }`}
            >
              Archives ({archivedJobs.length})
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-2.5 px-3.5 min-h-[46px] rounded-2xl border border-app-border bg-app-surface">
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Poste, entreprise, ville ou secteur..."
            placeholderTextColor={colors.textFaint}
            style={{ fontSize: 16 }}
            className="flex-1 text-sm font-medium text-app-text"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={15} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {/* Contract Type Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
        >
          {CONTRACT_FILTERS.map(({ key, label }) => {
            const active = contractFilter === key;
            return (
              <Pressable
                key={key || 'all'}
                onPress={() => setContractFilter(key)}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? 'bg-brand-600 border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                    : 'bg-app-surface border-app-border'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    active ? 'text-white' : 'text-app-text'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Jobs List */}
        <View className="gap-3.5">
          {displayedJobs.map((job) => {
            const dateStr = job.created_at ? formatShortDate(job.created_at) : '';
            const salaryStr = job.salary
              ? `${job.salary} ${job.currency || 'RUB'}`
              : 'Salaire à convenir';

            return (
              <Pressable
                key={job.id}
                onPress={() => router.push(`/jobs/${job.id}` as never)}
              >
                <Card variant="verified" className="p-4 gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 min-w-0">
                      <AppText numberOfLines={2} className="text-base font-black text-app-text">
                        {job.title}
                      </AppText>
                      {job.company ? (
                        <View className="flex-row items-center gap-1.5 mt-1">
                          <Building2 size={13} color={colors.textMuted} />
                          <AppText numberOfLines={1} className="text-xs font-semibold text-app-text-muted">
                            {job.company}
                          </AppText>
                          {job.businessId ? <VerifiedIcon size={12} /> : null}
                        </View>
                      ) : null}
                    </View>

                    <Badge tone={job.status === 'active' ? 'brand' : 'neutral'}>
                      {job.contractType || 'Job'}
                    </Badge>
                  </View>

                  <View className="flex-row flex-wrap items-center gap-2 pt-1 border-t border-app-border/40">
                    {job.city ? (
                      <View className="flex-row items-center gap-1">
                        <MapPin size={12} color={colors.textMuted} />
                        <Text className="text-xs text-app-text-muted">{job.city}</Text>
                      </View>
                    ) : null}

                    <View className="flex-row items-center gap-1">
                      <Briefcase size={12} color={colors.textMuted} />
                      <Text className="text-xs font-bold text-teal-700 dark:text-teal-300">
                        {salaryStr}
                      </Text>
                    </View>

                    {dateStr ? (
                      <View className="flex-row items-center gap-1 ml-auto">
                        <Clock size={11} color={colors.textFaint} />
                        <Text className="text-[11px] text-app-text-faint">{dateStr}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row items-center justify-between pt-1">
                    <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      Voir l'offre & postuler
                    </Text>
                    <ChevronRight size={15} color={brand[600]} />
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {!displayedJobs.length ? (
            <EmptyState
              title="Aucune offre d'emploi"
              description={
                tab === 'active'
                  ? 'Aucun job actif ne correspond à vos filtres. Modifiez votre recherche ou publiez une offre !'
                  : 'Aucune offre archivée trouvée.'
              }
            />
          ) : null}
        </View>
      </ScrollView>
    </AppChrome>
  );
}
