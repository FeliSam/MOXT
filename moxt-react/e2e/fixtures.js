export const E2E_USER_ID = 'e2e-user-00000000-0000-4000-8000-000000000001'
export const E2E_ADMIN_ID = 'e2e-admin-00000000-0000-4000-8000-000000000002'
export const E2E_LISTING_ID = 'ANN-E2E-1'

export const E2E_USER = {
  id: E2E_USER_ID,
  email: 'e2e.user@example.com',
  firstName: 'Nadia',
  lastName: 'Demo',
  city: 'Moscou',
  originCountry: 'BJ',
  country: 'RU',
  phone: '+79991234567',
  role: 'user',
  status: 'verified',
  verified: true,
  phoneVerified: true,
  phoneVerifiedAt: '2026-08-01T10:00:00.000Z',
  emailVerified: true,
  emailVerifiedAt: '2026-08-01T10:00:00.000Z',
}

export const E2E_ADMIN = {
  ...E2E_USER,
  id: E2E_ADMIN_ID,
  email: 'e2e.admin@example.com',
  firstName: 'Admin',
  lastName: 'Moxt',
  role: 'admin',
}

export const E2E_EVENT_ID = 'EVT-E2E-1'

export const E2E_LISTING = {
  id: E2E_LISTING_ID,
  ownerId: 'e2e-seller',
  sellerName: 'Vendeur E2E',
  type: 'product',
  category: 'Telephone',
  title: 'Smartphone double SIM',
  description: 'Telephone neuf Dual Connect 5G avec accessoires.',
  price: 25000,
  currency: 'RUB',
  city: 'Moscou',
  country: 'RU',
  contact: '+79990001122',
  status: 'active',
  views: 12,
  contactCount: 0,
  shareCount: 0,
  favorites: [],
  images: ['/assets/marketplace/smartphone.svg'],
  deliveryOptions: ['pickup'],
  brand: 'Dual Connect',
  model: '5G',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-01T10:00:00.000Z',
}

export const E2E_EVENT = {
  id: E2E_EVENT_ID,
  ownerId: 'e2e-organizer',
  title: 'Meetup diaspora',
  status: 'published',
  city: 'Moscou',
  country: 'RU',
  startDate: '2026-09-01',
  createdAt: '2026-08-01T10:00:00.000Z',
}

export const E2E_FAVORITES = [
  {
    id: 'FAV-E2E-1',
    userId: E2E_USER_ID,
    relatedType: 'listing',
    relatedId: E2E_LISTING_ID,
    title: 'Smartphone double SIM',
    path: `/marketplace/${E2E_LISTING_ID}`,
    snapshot: { title: 'Smartphone double SIM', city: 'Moscou', type: 'product' },
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'FAV-E2E-2',
    userId: E2E_USER_ID,
    relatedType: 'event',
    relatedId: E2E_EVENT_ID,
    title: 'Meetup diaspora',
    path: `/events/${E2E_EVENT_ID}`,
    snapshot: { title: 'Meetup diaspora' },
    createdAt: '2026-08-01T11:00:00.000Z',
  },
]

export function e2eSession(user = E2E_USER) {
  return { user, token: `e2e-token-${user.role}` }
}

export function e2eAccountState(userId = E2E_USER_ID) {
  return {
    favorites: userId === E2E_USER_ID ? E2E_FAVORITES : [],
    subscriptions: [],
    subscriberBans: [],
    subscriberReports: [],
    transferProfiles: [],
    documents: [],
    verificationRequests: [],
    phoneAssistRequests: [],
    preferences: {
      [userId]: { language: 'fr' },
    },
    deletionRequests: [],
    viewedListings: [],
  }
}
