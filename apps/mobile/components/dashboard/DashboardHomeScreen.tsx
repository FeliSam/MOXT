import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { isParcelBrowseArchived } from '@moxt/shared/domain/parcelRules.js';
import { selectDashboardP2POffers } from '@moxt/shared/domain/p2pRules.js';
import { TRANSFER_STATUS, transferCurrenciesForCountry } from '@moxt/shared/domain/transferConfig.js';

import { DashboardBento } from '@/components/dashboard/DashboardBento';
import { DashboardCalcBand } from '@/components/dashboard/DashboardCalcBand';
import { DashboardDiscoverySection } from '@/components/dashboard/DashboardDiscoverySection';
import { DashboardOverviewPanels } from '@/components/dashboard/DashboardOverviewPanels';
import { DashboardSearchSection } from '@/components/dashboard/DashboardSearchSection';
import { buildDashboardTodos, buildOnboardingSteps } from '@/components/dashboard/dashboardInbox';
import { DashboardTodoInbox } from '@/components/dashboard/DashboardTodoInbox';
import { P2POfferCard } from '@/components/dashboard/P2POfferCard';
import { StatusRail } from '@/components/dashboard/StatusRail';
import { WebSectionHeading } from '@/components/dashboard/webUi';
import { AppScreen } from '@/components/ui/Card';
import { usePublishMenu } from '@/components/chrome/PublishMenuSheet';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useLanguage } from '@/providers/LanguageProvider';
import { addFavorite, removeFavorite } from '@/store/favorites';
import type { P2POffer } from '@/store/dashboard';
import { canAccessModule } from '@/store/platform';
import { useAppDispatch, useAppSelector } from '@/store/store';

/** Carrousel P2P : w-[min(20.5rem,86vw)] à 390 px. */
const P2P_CARD_W = Math.min(328, 390 * 0.86);

/**
 * Accueil connecté — même ordre que moxt-react/src/pages/DashboardPage.jsx (viewport mobile) :
 * statuts, bento des services, bandeau calculette, recherche, offres P2P, actions à faire,
 * entreprises, taux, transferts en cours, découverte (colis, jobs, événements, annonces,
 * actualités, activité). Les actions rapides sont masquées sur mobile comme sur le web.
 */
export default function DashboardHomeScreen() {
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const openPublish = usePublishMenu();
  const user = useAppSelector((s) => s.auth.user);
  const transfers = useAppSelector((s) => s.transfers.items);
  const parcels = useAppSelector((s) => s.parcels.items);
  const listings = useAppSelector((s) => s.marketplace.items);
  const favorites = useAppSelector((s) => s.favorites.items);
  const conversations = useAppSelector((s) => s.messages.conversations.length);
  const flags = useAppSelector((s) => s.platform.flags);
  const dash = useAppSelector((s) => s.dashboard);
  const posts = useAppSelector((s) => s.feed.posts);
  const rate = useExchangeRate('XOF');

  const originCountry = user?.originCountry || (user?.country !== 'RU' ? user?.country : 'BJ') || 'BJ';
  const p2pOffers = useMemo(
    () =>
      selectDashboardP2POffers(dash.p2pOffers, { currencies: transferCurrenciesForCountry(originCountry) }) as P2POffer[],
    [dash.p2pOffers, originCountry],
  );

  const myTransfers = useMemo(() => transfers.filter((item) => item.userId === user?.id), [transfers, user?.id]);
  const activeTransfers = useMemo(
    () =>
      myTransfers.filter(
        (item) =>
          ![TRANSFER_STATUS.COMPLETED, TRANSFER_STATUS.CANCELLED, TRANSFER_STATUS.EXPIRED].includes(item.status ?? ''),
      ),
    [myTransfers],
  );
  const parcelRequests = useAppSelector((s) => s.parcels.requests);
  const todoItems = useMemo(
    () =>
      buildDashboardTodos({
        userId: user?.id,
        transfers: myTransfers,
        parcelRequests: [...dash.incomingParcelRequests, ...parcelRequests],
        jobApplications: dash.jobApplications,
      }),
    [dash.incomingParcelRequests, dash.jobApplications, myTransfers, parcelRequests, user?.id],
  );
  const onboardingSteps = useMemo(
    () => (user ? buildOnboardingSteps(user, myTransfers.length) : []),
    [myTransfers.length, user],
  );

  // Web selectDashboard* : colis actifs, jobs actifs, événements publiés, annonces actives.
  const liveParcels = useMemo(
    () =>
      (parcels as { status?: string }[])
        .filter((p) => p.status === 'active' && !isParcelBrowseArchived(p))
        .slice(0, 5),
    [parcels],
  );
  const jobs = useMemo(
    () => (dash.jobs as { status?: string }[]).filter((j) => j.status === 'active').slice(0, 5),
    [dash.jobs],
  );
  const events = useMemo(() => dash.events.filter((e) => e.status === 'published').slice(0, 5), [dash.events]);
  const activeListings = useMemo(() => listings.filter((l) => l.status === 'active').slice(0, 4), [listings]);
  const newsPosts = useMemo(
    () =>
      canAccessModule(flags, 'news')
        ? posts.filter((p) => !p.status || p.status === 'published').slice(0, 4)
        : [],
    [posts, flags],
  );

  const isFav = (id: string) => favorites.some((f) => f.id === id && f.type === 'listing');
  const toggleFav = (listing: { id: string; title?: string; city?: string }) => {
    if (isFav(listing.id)) dispatch(removeFavorite({ id: listing.id, type: 'listing' }));
    else dispatch(addFavorite({ id: listing.id, type: 'listing', title: listing.title ?? '', subtitle: listing.city }));
  };

  if (!user) return <AppScreen edges={[]}>{null}</AppScreen>;

  return (
    <AppScreen edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 128, gap: 24 }}>
        <StatusRail onAdd={() => openPublish()} />
        <DashboardBento />
        <DashboardCalcBand user={user} />
        <DashboardSearchSection />

        {p2pOffers.length > 0 ? (
          <View style={{ gap: 12 }}>
            <WebSectionHeading
              title={t('dashboard.discovery.latestP2P')}
              link="/p2p"
              linkLabel={t('dashboard.discovery.viewP2P')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, gap: 12 }}>
              {p2pOffers.map((offer) => (
                <View key={offer.id} style={{ width: P2P_CARD_W }}>
                  <P2POfferCard
                    offer={offer}
                    orders={dash.p2pOrders}
                    reviews={dash.reviews}
                    ownerVerified={offer.ownerId === user.id ? user.verified : undefined}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <DashboardTodoInbox todoItems={todoItems} />
        <DashboardOverviewPanels
          activeTransfers={activeTransfers}
          onboardingSteps={onboardingSteps}
          rate={rate}
          user={user}
        />

        <View style={{ marginHorizontal: -16 }}>
          <DashboardDiscoverySection
            listings={activeListings}
            parcels={liveParcels}
            jobs={jobs}
            events={events}
            posts={newsPosts}
            isFav={isFav}
            toggleFav={toggleFav}
            transfersCount={myTransfers.length}
            conversationsCount={conversations}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}
