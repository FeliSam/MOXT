import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AuthLayout } from '../components/layout/AuthLayout'
import { PublicSiteLayout } from '../components/layout/PublicSiteLayout'
import { LegacyDetailRedirect } from '../components/routing/LegacyDetailRedirect'
import { ProtectedRoute } from '../components/routing/ProtectedRoute'
import { PublicOnlyRoute } from '../components/routing/PublicOnlyRoute'
import {
  MARKETPLACE_LEGACY_PATHS,
  MY_LISTINGS_LEGACY_PATHS,
  ROUTES,
  SIMPLE_LEGACY_REDIRECTS,
} from '../config/routes'

function lazyPage(loader, exportName) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] })))
}

const AdminPage = lazyPage(() => import('../pages/AdminPage'), 'AdminPage')
const ActivitiesPage = lazyPage(() => import('../pages/ActivitiesPage'), 'ActivitiesPage')
const BusinessesPage = lazyPage(() => import('../pages/BusinessesPage'), 'BusinessesPage')
const BusinessDetailPage = lazyPage(
  () => import('../pages/BusinessDetailPage'),
  'BusinessDetailPage',
)
const BusinessPublicationsPage = lazyPage(
  () => import('../pages/BusinessPublicationsPage'),
  'BusinessPublicationsPage',
)
const BusinessSetupPage = lazyPage(() => import('../pages/BusinessSetupPage'), 'BusinessSetupPage')
const DashboardPage = lazyPage(() => import('../pages/DashboardPage'), 'DashboardPage')
const DiscoverPage = lazyPage(() => import('../pages/DiscoverPage'), 'DiscoverPage')
const DisputesPage = lazyPage(() => import('../pages/DisputesPage'), 'DisputesPage')
const DesignSystemPage = lazyPage(() => import('../pages/DesignSystemPage'), 'DesignSystemPage')
const DesignDirectionsIndexPage = lazyPage(
  () => import('../pages/DesignDirectionsPage'),
  'DesignDirectionsIndexPage',
)
const DesignDirectionRoutePage = lazyPage(
  () => import('../pages/DesignDirectionsPage'),
  'DesignDirectionRoutePage',
)
const EventDetailPage = lazyPage(() => import('../pages/EventDetailPage'), 'EventDetailPage')
const EventsPage = lazyPage(() => import('../pages/EventsPage'), 'EventsPage')
const EditListingPage = lazyPage(() => import('../pages/EditListingPage'), 'EditListingPage')
const FavoritesPage = lazyPage(() => import('../pages/FavoritesPage'), 'FavoritesPage')
const SubscriptionsPage = lazyPage(
  () => import('../pages/SubscriptionsPage'),
  'SubscriptionsPage',
)
const FeatureMatrixPage = lazyPage(() => import('../pages/FeatureMatrixPage'), 'FeatureMatrixPage')
const ExchangersPage = lazyPage(() => import('../pages/ExchangersPage'), 'ExchangersPage')
const ExchangerDetailPage = lazyPage(
  () => import('../pages/ExchangerDetailPage'),
  'ExchangerDetailPage',
)
const ForgotPasswordPage = lazyPage(
  () => import('../pages/ForgotPasswordPage'),
  'ForgotPasswordPage',
)
const FaqPage = lazyPage(() => import('../pages/FaqPage'), 'FaqPage')
const JobApplicationsPage = lazyPage(
  () => import('../pages/JobApplicationsPage'),
  'JobApplicationsPage',
)
const JobDetailPage = lazyPage(() => import('../pages/JobDetailPage'), 'JobDetailPage')
const JobsPage = lazyPage(() => import('../pages/JobsPage'), 'JobsPage')
const ListingDetailPage = lazyPage(() => import('../pages/ListingDetailPage'), 'ListingDetailPage')
const LoginPage = lazyPage(() => import('../pages/LoginPage'), 'LoginPage')
const LocalDataPage = lazyPage(() => import('../pages/LocalDataPage'), 'LocalDataPage')
const MarketplacePage = lazyPage(() => import('../pages/MarketplacePage'), 'MarketplacePage')
const MyListingsPage = lazyPage(() => import('../pages/MyListingsPage'), 'MyListingsPage')
const MyPublicationsPage = lazyPage(
  () => import('../pages/MyPublicationsPage'),
  'MyPublicationsPage',
)
const UserPublicationsPage = lazyPage(
  () => import('../pages/UserPublicationsPage'),
  'UserPublicationsPage',
)
const UserListingsRedirect = lazyPage(
  () => import('../pages/UserPublicationsPage').then((m) => ({ default: m.UserListingsRedirect })),
  'UserListingsRedirect',
)
const PublishListingPage = lazyPage(
  () => import('../pages/PublishListingPage'),
  'PublishListingPage',
)
const PublishParcelPage = lazyPage(() => import('../pages/PublishParcelPage'), 'PublishParcelPage')
const PublishJobPage = lazyPage(() => import('../pages/PublishJobPage'), 'PublishJobPage')
const PublishEventPage = lazyPage(() => import('../pages/PublishEventPage'), 'PublishEventPage')
const EditJobPage = lazyPage(() => import('../pages/EditJobPage'), 'EditJobPage')
const EditEventPage = lazyPage(() => import('../pages/EditEventPage'), 'EditEventPage')
const EditParcelPage = lazyPage(() => import('../pages/EditParcelPage'), 'EditParcelPage')
const EditPostPage = lazyPage(() => import('../pages/EditPostPage'), 'EditPostPage')
const MessagesPage = lazyPage(() => import('../pages/MessagesPage'), 'MessagesPage')
const DocumentsPage = lazyPage(() => import('../pages/DocumentsPage'), 'DocumentsPage')
const AddressesPage = lazyPage(() => import('../pages/AddressesPage'), 'AddressesPage')
const NewTransferPage = lazyPage(() => import('../pages/NewTransferPage'), 'NewTransferPage')
const NewsPage = lazyPage(() => import('../pages/NewsPage'), 'NewsPage')
const NotFoundPage = lazyPage(() => import('../pages/NotFoundPage'), 'NotFoundPage')
const NotificationsPage = lazyPage(() => import('../pages/NotificationsPage'), 'NotificationsPage')
const ParcelDetailPage = lazyPage(() => import('../pages/ParcelDetailPage'), 'ParcelDetailPage')
const ParcelsPage = lazyPage(() => import('../pages/ParcelsPage'), 'ParcelsPage')
const P2POrderPage = lazyPage(() => import('../pages/P2POrderPage'), 'P2POrderPage')
const P2PDetailPage = lazyPage(() => import('../pages/P2PDetailPage'), 'P2PDetailPage')
const P2PPage = lazyPage(() => import('../pages/P2PPage'), 'P2PPage')
const PaymentsPage = lazyPage(() => import('../pages/PaymentsPage'), 'PaymentsPage')
const ProfilePage = lazyPage(() => import('../pages/ProfilePage'), 'ProfilePage')
const PersonalInformationPage = lazyPage(
  () => import('../pages/PersonalInformationPage'),
  'PersonalInformationPage',
)
const ProfessionalPage = lazyPage(() => import('../pages/ProfessionalPage'), 'ProfessionalPage')
const PublicHomePage = lazyPage(() => import('../pages/PublicHomePage'), 'PublicHomePage')
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'), 'RegisterPage')
const ResetPasswordPage = lazyPage(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage')
const ReceiptsPage = lazyPage(() => import('../pages/ReceiptsPage'), 'ReceiptsPage')
const SupportPage = lazyPage(() => import('../pages/SupportPage'), 'SupportPage')
const SettingsPage = lazyPage(() => import('../pages/SettingsPage'), 'SettingsPage')
const VersionPage = lazyPage(() => import('../pages/VersionPage'), 'VersionPage')
const SecurityPage = lazyPage(() => import('../pages/SecurityPage'), 'SecurityPage')
const SuperAdminPage = lazyPage(() => import('../pages/SuperAdminPage'), 'SuperAdminPage')
const ReceiveTransferScreen = lazyPage(
  () => import('../pages/ReceiveTransferScreen'),
  'ReceiveTransferScreen',
)
const TransferDetailPage = lazyPage(
  () => import('../pages/TransferDetailPage'),
  'TransferDetailPage',
)
const TransfersPage = lazyPage(() => import('../pages/TransfersPage'), 'TransfersPage')
const ReferralPage = lazyPage(() => import('../pages/ReferralPage'), 'ReferralPage')
const PublicationShell = lazyPage(
  () => import('../components/routing/PublicationShell'),
  'PublicationShell',
)
const InviteRedirect = lazyPage(() => import('../pages/InviteRedirect'), 'InviteRedirect')
const TrustPage = lazyPage(() => import('../pages/TrustPage'), 'TrustPage')
const LegalPage = lazyPage(() => import('../pages/LegalPage'), 'LegalPage')
const VerificationPage = lazyPage(() => import('../pages/VerificationPage'), 'VerificationPage')
const WalletPage = lazyPage(() => import('../pages/WalletPage'), 'WalletPage')

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[var(--app-bg)] text-sm font-bold text-[var(--app-text-muted)]">
          Chargement de MOXT...
        </div>
      }
    >
      <Routes>
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route element={<PublicationShell />}>
          <Route path="/users/:userId/publications" element={<UserPublicationsPage />} />
          <Route path="/users/:userId/annonces" element={<UserListingsRedirect />} />
          <Route
            path="/businesses/:businessId/publications/:contentType"
            element={<BusinessPublicationsPage />}
          />
        </Route>

        <Route element={<PublicSiteLayout />}>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/trust" element={<TrustPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/legal" element={<Navigate to="/legal/mentions" replace />} />
          <Route path="/legal/:sectionId" element={<LegalPage />} />
          <Route path="/invite/:code" element={<InviteRedirect />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/design-directions" element={<DesignDirectionsIndexPage />} />
          <Route path="/design-directions/:directionId" element={<DesignDirectionRoutePage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {SIMPLE_LEGACY_REDIRECTS.map(([path, target]) => (
              <Route key={path} path={path} element={<Navigate to={target} replace />} />
            ))}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/share-badge" element={<Navigate to="/referral" replace />} />
            <Route path="/profile/information" element={<PersonalInformationPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/version" element={<VersionPage />} />
            <Route path={ROUTES.localData} element={<LocalDataPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:postId/edit" element={<EditPostPage />} />
            <Route path="/transfers" element={<NewTransferPage />} />
            <Route path="/transfers/history" element={<TransfersPage />} />
            <Route path="/transfers/new" element={<NewTransferPage />} />
            <Route path="/transfers/:transferId/receive" element={<ReceiveTransferScreen />} />
            <Route path="/transfers/:transferId" element={<TransferDetailPage />} />
            <Route path="/exchangers" element={<ExchangersPage />} />
            <Route path="/exchangers/:exchangerId" element={<ExchangerDetailPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route
              path="/transfer-detail"
              element={<LegacyDetailRedirect fallback="/transfers" target="/transfers" />}
            />
            <Route
              path="/transfert-detail"
              element={<LegacyDetailRedirect fallback="/transfers" target="/transfers" />}
            />
            <Route path="/businesses" element={<BusinessesPage />} />
            <Route path="/businesses/setup" element={<BusinessSetupPage />} />
            <Route path="/businesses/:businessId" element={<BusinessDetailPage />} />
            <Route path="/professional" element={<ProfessionalPage />} />
            <Route
              path="/business-detail"
              element={<LegacyDetailRedirect fallback="/businesses" target="/businesses" />}
            />
            <Route path="/parcels" element={<ParcelsPage />} />
            <Route path="/parcels/publish" element={<PublishParcelPage />} />
            <Route path="/parcels/:parcelId/edit" element={<EditParcelPage />} />
            <Route path="/parcels/:parcelId" element={<ParcelDetailPage />} />
            <Route
              path="/parcel-detail"
              element={<LegacyDetailRedirect fallback="/parcels" target="/parcels" />}
            />
            <Route path="/p2p" element={<P2PPage />} />
            <Route path="/p2p/orders/:orderId" element={<P2POrderPage />} />
            <Route path="/p2p/:offerId" element={<P2PDetailPage />} />
            <Route
              path="/p2p-order-detail"
              element={<LegacyDetailRedirect fallback="/p2p" target="/p2p/orders" />}
            />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/publish" element={<PublishListingPage />} />
            <Route path="/publications/mine" element={<MyPublicationsPage />} />
            <Route path="/marketplace/mine" element={<MyListingsPage />} />
            <Route path="/marketplace/:listingId/edit" element={<EditListingPage />} />
            <Route path="/marketplace/:listingId" element={<ListingDetailPage />} />
            {MARKETPLACE_LEGACY_PATHS.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<Navigate to="/marketplace" replace />}
              />
            ))}
            {MY_LISTINGS_LEGACY_PATHS.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<Navigate to="/publications/mine" replace />}
              />
            ))}
            <Route
              path="/sales-detail"
              element={<LegacyDetailRedirect fallback="/marketplace" target="/marketplace" />}
            />
            <Route
              path="/sale-detail"
              element={<LegacyDetailRedirect fallback="/marketplace" target="/marketplace" />}
            />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/applications" element={<JobApplicationsPage />} />
            <Route path="/jobs/publish" element={<PublishJobPage />} />
            <Route path="/jobs/:jobId/edit" element={<EditJobPage />} />
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
            <Route
              path="/job-detail"
              element={<LegacyDetailRedirect fallback="/jobs" target="/jobs" />}
            />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/publish" element={<PublishEventPage />} />
            <Route path="/events/:eventId/edit" element={<EditEventPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route
              path="/event-detail"
              element={<LegacyDetailRedirect fallback="/events" target="/events" />}
            />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
            <Route path="/feature-matrix" element={<FeatureMatrixPage />} />
            <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/superadmin" element={<SuperAdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
