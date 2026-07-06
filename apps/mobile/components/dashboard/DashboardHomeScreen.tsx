import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';

import { DashboardDiscoverySection } from '@/components/dashboard/DashboardDiscoverySection';
import { DashboardHeroSection } from '@/components/dashboard/DashboardHeroSection';
import { DashboardOverviewSection } from '@/components/dashboard/DashboardOverviewSection';
import { DashboardQuickActionsSection } from '@/components/dashboard/DashboardQuickActionsSection';
import { DashboardSearchSection } from '@/components/dashboard/DashboardSearchSection';
import { DashboardServiceSection } from '@/components/dashboard/DashboardServiceSection';
import { MobileDashboardHeader } from '@/components/layout/MobileDashboardHeader';
import { AppScreen } from '@/components/ui/Card';
import { tw } from '@/constants/dashboardTailwind';
import { useLanguage } from '@/providers/LanguageProvider';
import { supabase } from '@/services/supabase';
import { logout } from '@/store/auth';
import { addFavorite, removeFavorite } from '@/store/favorites';
import { useAppDispatch, useAppSelector } from '@/store/store';

export default function DashboardHomeScreen() {
  const dispatch = useAppDispatch();
  const { translateLabel } = useLanguage();
  const user = useAppSelector((state) => state.auth.user);
  const transfers = useAppSelector((state) => state.transfers.items);
  const parcels = useAppSelector((state) => state.parcels.items);
  const listings = useAppSelector((state) => state.marketplace.items);
  const favorites = useAppSelector((state) => state.favorites.items);
  const conversations = useAppSelector((state) => state.messages.conversations.length);
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [sendAmount, setSendAmount] = useState('5000');
  const [rubToXof, setRubToXof] = useState(true);
  const numericAmount = parseFloat(sendAmount.replace(',', '.')) || 0;
  const estimation = rubToXof ? numericAmount * 7.3953 : numericAmount / 7.3953;
  const currencyFrom = rubToXof ? 'RUB' : 'XOF';
  const currencyTo = rubToXof ? 'XOF' : 'RUB';

  const [jobs, setJobs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !supabase) return;
    (async () => {
      try {
        const [j, e] = await Promise.allSettled([
          supabase
            .from('jobs')
            .select('id, title, city, salary, currency, sector, type')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('events')
            .select('id, title, city, format, category, start_at')
            .order('start_at', { ascending: true })
            .limit(5),
        ]);
        if (j.status === 'fulfilled' && j.value.data) setJobs(j.value.data);
        if (e.status === 'fulfilled' && e.value.data) setEvents(e.value.data);
      } catch {
        /* sections masquées si indisponible */
      }
    })();
  }, [authStatus]);

  const activeTransfers = useMemo(
    () => transfers.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [transfers],
  );
  const toDeclareCount = useMemo(
    () => transfers.filter((t) => t.status === 'pending').length,
    [transfers],
  );

  const profileFields = [user?.firstName, user?.lastName, user?.email, (user as any)?.phone ?? (user as any)?.russianPhone];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const verified = (user as any)?.verified === true;
  const onboardingSteps = [
    { label: 'Vérifier votre compte', done: verified },
    { label: 'Compléter votre profil', done: profileCompletion === 100 },
    { label: 'Réaliser un premier transfert', done: transfers.length > 0 },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;

  function isFav(id: string) {
    return favorites.some((f) => f.id === id && f.type === 'listing');
  }
  function toggleFav(listing: any) {
    if (isFav(listing.id)) {
      dispatch(removeFavorite({ id: listing.id, type: 'listing' }));
    } else {
      dispatch(addFavorite({ id: listing.id, type: 'listing', title: listing.title, subtitle: listing.city }));
    }
  }

  return (
    <AppScreen edges={['top']}>
      <MobileDashboardHeader eyebrow="MOXT" title="Accueil" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName={cnScroll()}>
        <DashboardHeroSection
          firstName={user?.firstName}
          sendAmount={sendAmount}
          setSendAmount={setSendAmount}
          rubToXof={rubToXof}
          setRubToXof={setRubToXof}
          estimation={estimation}
          currencyFrom={currencyFrom}
          currencyTo={currencyTo}
        />
        <DashboardSearchSection />
        <DashboardQuickActionsSection />
        <DashboardOverviewSection
          verified={verified}
          toDeclareCount={toDeclareCount}
          activeTransfers={activeTransfers}
          profileCompletion={profileCompletion}
          onboardingSteps={onboardingSteps}
          onboardingDone={onboardingDone}
        />
        <DashboardServiceSection />
        <DashboardDiscoverySection
          listings={listings}
          parcels={parcels}
          jobs={jobs}
          events={events}
          isFav={isFav}
          toggleFav={toggleFav}
          transfersCount={transfers.length}
          conversationsCount={conversations}
        />

        {isAdmin ? (
          <Pressable
            className="mx-4 items-center rounded-2xl bg-emerald-50 px-5 py-3.5 shadow-sm dark:bg-emerald-950/30"
            onPress={() => router.push('/admin' as any)}>
            <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-300">⚙️  Administration</Text>
          </Pressable>
        ) : null}
        <Pressable
          className={cnSpecial('bg-app-surface shadow-sm dark:bg-zinc-900')}
          onPress={() => router.push('/settings' as any)}>
          <Text className="text-sm font-bold text-app-text-secondary dark:text-zinc-400">
            {translateLabel('Paramètres')}
          </Text>
        </Pressable>
        <Pressable
          className={cnSpecial('bg-red-50 dark:bg-red-950/30')}
          onPress={() => dispatch(logout())}>
          <Text className="text-sm font-bold text-red-600 dark:text-red-400">{translateLabel('Se déconnecter')}</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

function cnScroll() {
  return `${tw.page} pb-32 pt-0`;
}

function cnSpecial(extra: string) {
  return `mx-4 items-center rounded-2xl px-5 py-3.5 ${extra}`;
}
