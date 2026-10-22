import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';

import { fromRows } from '@moxt/shared/utils/remoteRowMapper.js';

import { AppChrome } from '@/components/chrome/AppChrome';
import { LinkifiedText } from '@/components/ui/LinkifiedText';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';
import { useAppSelector } from '@/store/store';
import { useTheme } from '@/theme/ThemeContext';
import { showNotice } from '@/utils/notice';

type Application = { id: string; jobId?: string; status?: string; message?: string; applicantName?: string; userName?: string };

/** Candidatures reçues sur les offres du compte (JobApplicationsPage). */
export default function JobApplicationsScreen() {
  const { colors, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const jobs = useAppSelector((state) => state.dashboard.jobs);
  const [items, setItems] = useState<Application[]>([]);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    const owned = jobs.filter((job) => job.ownerId === user.id).map((job) => String(job.id));
    if (!owned.length) {
      setItems([]);
      return;
    }
    void supabase
      .from('job_applications')
      .select('*')
      .in('job_id', owned)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data, error }) => {
        if (error) showNotice('Candidatures', error.message);
        else setItems(fromRows(data || []) as Application[]);
      });
  }, [jobs, user?.id]);

  async function setStatus(id: string, status: 'accepted' | 'rejected') {
    if (!supabase) return;
    const { error } = await supabase.from('job_applications').update({ status }).eq('id', id);
    if (error) showNotice('Candidatures', error.message);
    else setItems((list) => list.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <AppChrome pathname="/jobs/applications">
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 128 }}>
        <Pressable onPress={() => router.push('/jobs' as never)}><AppText className="text-sm font-bold text-app-accent">← Emplois</AppText></Pressable>
        <AppText className="text-2xl font-black text-app-text">Candidatures</AppText>
        {items.length === 0 ? <AppText className="text-sm text-app-text-muted">Aucune candidature sur vos offres.</AppText> : null}
        {items.map((item) => {
          const job = jobs.find((entry) => entry.id === item.jobId);
          return (
            <View key={item.id} style={{ borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, gap: 8 }}>
              <AppText className="font-black text-app-text">{item.applicantName || item.userName || 'Candidat'}</AppText>
              <AppText className="text-sm text-app-text-muted">{String(job?.title || item.jobId || 'Offre')}</AppText>
              {item.message ? <LinkifiedText text={String(item.message)} /> : null}
              <AppText className="text-xs font-bold uppercase text-app-accent">{item.status || 'submitted'}</AppText>
              {item.status === 'submitted' || !item.status ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => void setStatus(item.id, 'accepted')} style={{ flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}>
                    <AppText className="font-bold" style={{ color: isDark ? '#020617' : '#fff' }}>Accepter</AppText>
                  </Pressable>
                  <Pressable onPress={() => void setStatus(item.id, 'rejected')} style={{ flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
                    <AppText className="font-bold text-app-text">Refuser</AppText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </AppChrome>
  );
}
