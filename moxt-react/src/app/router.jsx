import { lazy } from 'react'
import { AppSuspense } from '../components/layout/AppSuspense'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AuthLayout } from '../components/layout/AuthLayout'
import { PublicSiteLayout } from '../components/layout/PublicSiteLayout'
import { LegacyDetailRedirect } from '../components/routing/LegacyDetailRedirect'
import { ProtectedRoute } from '../components/routing/ProtectedRoute'
import { DevModuleRoute } from '../components/routing/DevModuleRoute'
import { AccountStatusGate } from '../components/routing/AccountStatusGate'
import { PublicOnlyRoute } from '../components/routing/PublicOnlyRoute'
import {
  MARKETPLACE_LEGACY_PATHS,
  MY_LISTINGS_LEGACY_PATHS,
  ROUTES,
  SIMPLE_LEGACY_REDIRECTS,
} from '../config/routes'

function lazyPage(loader, exportName) {
  return lazy(() =>
    loader().then((module) => {
      const page = module[exportName]
      if (!page) {
        throw new Error(`Missing page export: ${exportName}`)
      }
      return { default: page }
    }),
  )
}

const AdminPage = lazyPage(() => import('../pages/AdminPage'), 'AdminPage')
const ModerationPage = lazyPage(() => import('../pages/ModerationPage'), 'ModerationPage')
const HelpGuidePage = lazyPage(() => import('../pages/HelpGuidePage'), 'HelpGuidePage')
const ProductHelpPage = lazyPage(() => import('../pages/ProductHelpPage'), 'ProductHelpPage')
const ProductHelpSessionPage = lazyPage(
  () => import('../pages/ProductHelpPage'),
  'ProductHelpSessionPage',
)
const InstallAppPage = lazyPage(() => import('../pages/InstallAppPage'), 'InstallAppPage')
const HelpArticleDetailPage = lazyPage(
  () => import('../pages/HelpGuidePage'),
  'HelpArticleDetailPage',
)
const AdminHelpArticlesPage = lazyPage(
  () => import('../pages/AdminHelpArticlesPage'),
  'AdminHelpArticlesPage',
)
const ActivitiesPage = lazyPage(() => import('../pages/ActivitiesPage'), 'ActivitiesPage')
const BusinessesPage = lazyPage(() => import('../pages/BusinessesPage'), 'BusinessesPage')
const BusinessDetailPage = lazyPage(
  () => import('../pages/BusinessDetailPage'),
  'BusinessDetailPage',
)
const BusinessPublicationsRedirect = lazyPage(
  () => import('../pages/BusinessPublicationsRedirect'),
  'BusinessPublicationsRedirect',
)
const BusinessSetupPage = lazyPage(() => import('../pages/BusinessSetupPage'), 'BusinessSetupPage')
const DashboardPage = lazyPage(() => import('../pages/DashboardPage'), 'DashboardPage')
const MoxtHubPage = lazyPage(() => import('../pages/MoxtHubPage'), 'MoxtHubPage')
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
const FeedPage = lazyPage(() => import('../pages/FeedPage'), 'FeedPage')
const VideosFeedPage = lazyPage(() => import('../pages/VideosFeedPage'), 'VideosFeedPage')
const VideoShareRedirect = lazyPage(() => import('../pages/VideosFeedPage'), 'VideoShareRedirect')
const PublishVideoPage = lazyPage(() => import('../pages/PublishVideoPage'), 'PublishVideoPage')
const EditVideoPage = lazyPage(() => import('../pages/EditVideoPage'), 'EditVideoPage')
const EditListingPage = lazyPage(() => import('../pages/EditListingPage'), 'EditListingPage')
const FavoritesPage = lazyPage(() => import('../pages/FavoritesPage'), 'FavoritesPage')
const SubscriptionsRedirect = lazyPage(
  () => import('../components/routing/SubscriptionsRedirect'),
  'SubscriptionsRedirect',
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
const PublishP2PPage = lazyPage(() => import('../pages/PublishP2PPage'), 'PublishP2PPage')
const EditP2POfferPage = lazyPage(() => import('../pages/EditP2POfferPage'), 'EditP2POfferPage')
const PaymentsPage = lazyPage(() => import('../pages/PaymentsPage'), 'PaymentsPage')
const ContributePage = lazyPage(() => import('../pages/ContributePage'), 'ContributePage')
const ProfilePage = lazyPage(() => import('../pages/ProfilePage'), 'ProfilePage')
const PersonalInformationPage = lazyPage(
  () => import('../pages/PersonalInformationPage'),
  'PersonalInformationPage',
)
const ProfessionalPage = lazyPage(() => import('../pages/ProfessionalPage'), 'ProfessionalPage')
const PublicHomePage = lazyPage(() => import('../pages/PublicHomePage'), 'PublicHomePage')
const PresentationPage = lazyPage(() => import('../pages/PresentationPage'), 'PresentationPage')
const RegisterPage = lazyPage(() => import('../pages/RegisterPage'), 'RegisterPage')
const AuthCallbackPage = lazyPage(() => import('../pages/AuthCallbackPage'), 'AuthCallbackPage')
const ResetPasswordPage = lazyPage(() => import('../pages/ResetPasswordPage'), 'ResetPasswordPage')
const ReceiptsPage = lazyPage(() => import('../pages/ReceiptsPage'), 'ReceiptsPage')
const ReceiptDetailPage = lazyPage(() => import('../pages/ReceiptDetailPage'), 'ReceiptDetailPage')
const SupportPage = lazyPage(() => import('../pages/SupportPage'), 'SupportPage')
const SettingsPage = lazyPage(() => import('../pages/SettingsPage'), 'SettingsPage')
const AccountStatusPage = lazyPage(() => import('../pages/AccountStatusPage'), 'AccountStatusPage')
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
const ExchangerDashboardPage = lazyPage(
  () => import('../pages/ExchangerDashboardPage'),
  'ExchangerDashboardPage',
)
const ReferralPage = lazyPage(() => import('../pages/ReferralPage'), 'ReferralPage')
const StarsWalletPage = lazyPage(() => import('../pages/StarsWalletPage'), 'StarsWalletPage')
const StarsBuyPage = lazyPage(() => import('../pages/StarsBuyPage'), 'StarsBuyPage')
const StarsCheckoutPage = lazyPage(() => import('../pages/StarsCheckoutPage'), 'StarsCheckoutPage')
const PublicationShell = lazyPage(
  () => import('../components/routing/PublicationShell'),
  'PublicationShell',
)
const FeedAccessShell = lazyPage(
  () => import('../components/routing/FeedAccessShell'),
  'FeedAccessShell',
)
const InviteRedirect = lazyPage(() => import('../pages/InviteRedirect'), 'InviteRedirect')
const TrustPage = lazyPage(() => import('../pages/TrustPage'), 'TrustPage')
const LegalPage = lazyPage(() => import('../pages/LegalPage'), 'LegalPage')
const VerificationPage = lazyPage(() => import('../pages/VerificationPage'), 'VerificationPage')
const isProd = import.meta.env.PROD

export function AppRouter() {
  return (
    <AppSuspense>
      <Routes>
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route element={<PublicationShell />}>
          <Route path="/users/:userId/publications" element={<UserPublicationsPage />} />
          <Route path="/users/:userId/annonces" element={<UserListingsRedirect />} />
          <Route path="/businesses/:businessId" element={<BusinessDetailPage />} />
          <Route
            path="/businesses/:businessId/publications/:contentType"
            element={<BusinessPublicationsRedirect />}
          />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:listingId" element={<ListingDetailPage />} />
          {MARKETPLACE_LEGACY_PATHS.map((path) => (
            <Route
              key={path}
              path={`/${path}`}
              element={<Navigate to="/marketplace" replace />}
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
        </Route>

        <Route element={<FeedAccessShell />}>
          <Route path="/feed" element={<FeedPage />} />
        </Route>

        <Route element={<PublicSiteLayout />}>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/presentation" element={<PresentationPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/trust" element={<TrustPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/legal" element={<Navigate to="/legal/mentions" replace />} />
          <Route path="/legal/:sectionId" element={<LegalPage />} />
          <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
          <Route path="/invite/:code" element={<InviteRedirect />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          {!isProd ? (
            <>
              <Route path="/design-directions" element={<DesignDirectionsIndexPage />} />
              <Route path="/design-directions/:directionId" element={<DesignDirectionRoutePage />} />
            </>
          ) : null}
          <Route path="/account/status" element={<AccountStatusPage />} />
          <Route element={<AccountStatusGate />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            {SIMPLE_LEGACY_REDIRECTS.map(([path, target]) => (
              <Route key={path} path={path} element={<Navigate to={target} replace />} />
            ))}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path={ROUTES.moxt} element={<MoxtHubPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/share-badge" element={<Navigate to="/referral" replace />} />
            <Route path="/profile/information" element={<PersonalInformationPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsRedirect />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/version" element={<VersionPage />} />
            <Route path={ROUTES.localData} element={<LocalDataPage />} />
            <Route
              path="/news"
              element={
                <DevModuleRoute moduleId="news">
                  <NewsPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/news/:postId/edit"
              element={
                <DevModuleRoute moduleId="news">
                  <EditPostPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/news/:postId"
              element={
                <DevModuleRoute moduleId="news">
                  <NewsPage />
                </DevModuleRoute>
              }
            />
            <Route path="/transfers" element={<NewTransferPage />} />
            <Route path="/transfers/history" element={<TransfersPage />} />
            <Route path="/transfers/new" element={<NewTransferPage />} />
            <Route path="/transfers/:transferId/receive" element={<ReceiveTransferScreen />} />
            <Route path="/transfers/:transferId" element={<TransferDetailPage />} />
            <Route path="/exchangers" element={<ExchangersPage />} />
            <Route path="/exchangers/:exchangerId" element={<ExchangerDetailPage />} />
            <Route path="/wallet" element={<Navigate to="/receipts" replace />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route
              path="/stars"
              element={
                <DevModuleRoute moduleId="stars">
                  <StarsWalletPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/stars/buy"
              element={
                <DevModuleRoute moduleId="stars">
                  <StarsBuyPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/stars/buy/checkout/:purchaseId"
              element={
                <DevModuleRoute moduleId="stars">
                  <StarsCheckoutPage />
                </DevModuleRoute>
              }
            />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route
              path="/contribute"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <ContributePage />
                </ProtectedRoute>
              }
            />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/receipts/:receiptId" element={<ReceiptDetailPage />} />
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
            <Route path="/professional" element={<ProfessionalPage />} />
            <Route path="/exchanger" element={<ExchangerDashboardPage />} />
            <Route
              path="/business-detail"
              element={<LegacyDetailRedirect fallback="/businesses" target="/businesses" />}
            />
            <Route
              path="/parcels"
              element={
                <DevModuleRoute moduleId="parcels">
                  <ParcelsPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/parcels/publish"
              element={
                <DevModuleRoute moduleId="parcels">
                  <PublishParcelPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/parcels/:parcelId/edit"
              element={
                <DevModuleRoute moduleId="parcels">
                  <EditParcelPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/parcels/:parcelId"
              element={
                <DevModuleRoute moduleId="parcels">
                  <ParcelDetailPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/parcel-detail"
              element={<LegacyDetailRedirect fallback="/parcels" target="/parcels" />}
            />
            <Route path="/p2p" element={<P2PPage />} />
            <Route path="/p2p/publish" element={<PublishP2PPage />} />
            <Route path="/p2p/orders/:orderId" element={<P2POrderPage />} />
            <Route path="/p2p/:offerId/edit" element={<EditP2POfferPage />} />
            <Route path="/p2p/:offerId" element={<P2PDetailPage />} />
            <Route
              path="/p2p-order-detail"
              element={<LegacyDetailRedirect fallback="/p2p" target="/p2p/orders" />}
            />
            <Route path="/marketplace/publish" element={<PublishListingPage />} />
            <Route path="/publications/mine" element={<MyPublicationsPage />} />
            <Route path="/marketplace/mine" element={<MyListingsPage />} />
            <Route path="/marketplace/:listingId/edit" element={<EditListingPage />} />
            {MY_LISTINGS_LEGACY_PATHS.map((path) => (
              <Route
                key={path}
                path={`/${path}`}
                element={<Navigate to="/publications/mine" replace />}
              />
            ))}
            <Route
              path="/jobs"
              element={
                <DevModuleRoute moduleId="jobs">
                  <JobsPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/jobs/applications"
              element={
                <DevModuleRoute moduleId="jobs">
                  <JobApplicationsPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/jobs/publish"
              element={
                <DevModuleRoute moduleId="jobs">
                  <PublishJobPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/jobs/:jobId/edit"
              element={
                <DevModuleRoute moduleId="jobs">
                  <EditJobPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/jobs/:jobId"
              element={
                <DevModuleRoute moduleId="jobs">
                  <JobDetailPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/job-detail"
              element={<LegacyDetailRedirect fallback="/jobs" target="/jobs" />}
            />
            <Route
              path="/events"
              element={
                <DevModuleRoute moduleId="events">
                  <EventsPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/events/publish"
              element={
                <DevModuleRoute moduleId="events">
                  <PublishEventPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/events/:eventId/edit"
              element={
                <DevModuleRoute moduleId="events">
                  <EditEventPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/events/:eventId"
              element={
                <DevModuleRoute moduleId="events">
                  <EventDetailPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/event-detail"
              element={<LegacyDetailRedirect fallback="/events" target="/events" />}
            />
            <Route
              path="/videos"
              element={
                <DevModuleRoute moduleId="videos">
                  <VideosFeedPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/videos/publish"
              element={
                <DevModuleRoute moduleId="videos">
                  <PublishVideoPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/videos/:videoId/edit"
              element={
                <DevModuleRoute moduleId="videos">
                  <EditVideoPage />
                </DevModuleRoute>
              }
            />
            <Route
              path="/videos/:videoId"
              element={
                <DevModuleRoute moduleId="videos">
                  <VideoShareRedirect />
                </DevModuleRoute>
              }
            />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/support" element={<SupportPage />} />
            {!isProd ? <Route path="/design-system" element={<DesignSystemPage />} /> : null}
            <Route
              path="/feature-matrix"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <FeatureMatrixPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/moderation"
              element={
                <ProtectedRoute allowedRoles={['moderator', 'admin', 'superadmin']}>
                  <ModerationPage />
                </ProtectedRoute>
              }
            />
            <Route path="/guide" element={<HelpGuidePage />} />
            <Route path="/guide/:articleId" element={<HelpArticleDetailPage />} />
            <Route path="/aide" element={<ProductHelpPage />} />
            <Route path="/aide/:sessionId" element={<ProductHelpSessionPage />} />
            <Route path="/install" element={<InstallAppPage />} />
            <Route
              path="/admin/guide"
              element={
                <ProtectedRoute allowedRoles={['moderator', 'admin', 'superadmin']}>
                  <AdminHelpArticlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <SuperAdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppSuspense>
  )
}
