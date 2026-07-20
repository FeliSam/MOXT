/** @typedef {'mobile' | 'desktop'} TourVariant */
/** @typedef {'center' | 'auto' | 'top' | 'bottom' | 'left' | 'right'} TourPlacement */
/** @typedef {'open' | 'close' | undefined} TourMoreState */

/**
 * @typedef {object} TourStep
 * @property {string} id
 * @property {string | null} [selector]
 * @property {TourPlacement} [placement]
 * @property {number} [pad]
 * @property {number} [radius]
 * @property {TourMoreState} [more]
 * @property {string} titleKey
 * @property {string} bodyKey
 */

/** @type {TourStep[]} */
export const MOBILE_TOUR_STEPS = [
  {
    id: 'welcome',
    selector: null,
    placement: 'center',
    titleKey: 'onboarding.tour.welcome.title',
    bodyKey: 'onboarding.tour.welcome.body',
  },
  {
    id: 'bottom-nav',
    selector: '[data-tour="bottom-nav"]',
    placement: 'top',
    pad: 10,
    radius: 18,
    titleKey: 'onboarding.tour.mobile.bottomNav.title',
    bodyKey: 'onboarding.tour.mobile.bottomNav.body',
  },
  {
    id: 'nav-transfers',
    selector: '[data-tour="nav-transfers"]',
    placement: 'top',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.transfers.title',
    bodyKey: 'onboarding.tour.mobile.transfers.body',
  },
  {
    id: 'nav-marketplace',
    selector: '[data-tour="nav-marketplace"]',
    placement: 'top',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.marketplace.title',
    bodyKey: 'onboarding.tour.mobile.marketplace.body',
  },
  {
    id: 'nav-parcels',
    selector: '[data-tour="nav-parcels"]',
    placement: 'top',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.parcels.title',
    bodyKey: 'onboarding.tour.mobile.parcels.body',
  },
  {
    id: 'nav-more',
    selector: '[data-tour="nav-more"]',
    placement: 'top',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.more.title',
    bodyKey: 'onboarding.tour.mobile.more.body',
  },
  {
    id: 'more-drawer',
    selector: '[data-tour="more-panel"]',
    placement: 'top',
    pad: 12,
    radius: 24,
    more: 'open',
    titleKey: 'onboarding.tour.mobile.morePanel.title',
    bodyKey: 'onboarding.tour.mobile.morePanel.body',
  },
  {
    id: 'more-guide',
    selector: '[data-tour="more-guide"]',
    placement: 'top',
    pad: 8,
    radius: 14,
    more: 'open',
    titleKey: 'onboarding.tour.guide.title',
    bodyKey: 'onboarding.tour.guide.body',
  },
  {
    id: 'header',
    selector: '[data-tour="header"]',
    placement: 'bottom',
    pad: 8,
    radius: 20,
    more: 'close',
    titleKey: 'onboarding.tour.mobile.header.title',
    bodyKey: 'onboarding.tour.mobile.header.body',
  },
  {
    id: 'header-news',
    selector: '[data-tour="header-news"]',
    placement: 'bottom',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.news.title',
    bodyKey: 'onboarding.tour.news.body',
  },
  {
    id: 'done',
    selector: null,
    placement: 'center',
    more: 'close',
    titleKey: 'onboarding.tour.done.title',
    bodyKey: 'onboarding.tour.done.body',
  },
]

/** @type {TourStep[]} */
export const DESKTOP_TOUR_STEPS = [
  {
    id: 'welcome',
    selector: null,
    placement: 'center',
    titleKey: 'onboarding.tour.welcome.title',
    bodyKey: 'onboarding.tour.welcome.body',
  },
  {
    id: 'sidebar',
    selector: '[data-tour="sidebar"]',
    placement: 'right',
    pad: 10,
    radius: 28,
    titleKey: 'onboarding.tour.desktop.sidebar.title',
    bodyKey: 'onboarding.tour.desktop.sidebar.body',
  },
  {
    id: 'nav-transfers',
    selector: '[data-tour="nav-transfers"]',
    placement: 'right',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.transfers.title',
    bodyKey: 'onboarding.tour.mobile.transfers.body',
  },
  {
    id: 'nav-marketplace',
    selector: '[data-tour="nav-marketplace"]',
    placement: 'right',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.mobile.marketplace.title',
    bodyKey: 'onboarding.tour.mobile.marketplace.body',
  },
  {
    id: 'nav-news',
    selector: '[data-tour="nav-news"]',
    placement: 'right',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.news.title',
    bodyKey: 'onboarding.tour.news.body',
  },
  {
    id: 'nav-more',
    selector: '[data-tour="nav-more"]',
    placement: 'right',
    pad: 8,
    radius: 14,
    titleKey: 'onboarding.tour.desktop.more.title',
    bodyKey: 'onboarding.tour.desktop.more.body',
  },
  {
    id: 'more-panel',
    selector: '[data-tour="more-panel"]',
    placement: 'right',
    pad: 12,
    radius: 20,
    more: 'open',
    titleKey: 'onboarding.tour.desktop.morePanel.title',
    bodyKey: 'onboarding.tour.desktop.morePanel.body',
  },
  {
    id: 'more-guide',
    selector: '[data-tour="more-guide"]',
    placement: 'right',
    pad: 8,
    radius: 14,
    more: 'open',
    titleKey: 'onboarding.tour.guide.title',
    bodyKey: 'onboarding.tour.guide.body',
  },
  {
    id: 'search',
    selector: '[data-tour="header-search"]',
    placement: 'bottom',
    pad: 10,
    radius: 16,
    more: 'close',
    titleKey: 'onboarding.tour.desktop.search.title',
    bodyKey: 'onboarding.tour.desktop.search.body',
  },
  {
    id: 'header-actions',
    selector: '[data-tour="header-actions"]',
    placement: 'bottom',
    pad: 10,
    radius: 16,
    titleKey: 'onboarding.tour.desktop.actions.title',
    bodyKey: 'onboarding.tour.desktop.actions.body',
  },
  {
    id: 'profile',
    selector: '[data-tour="header-profile"]',
    placement: 'bottom',
    pad: 8,
    radius: 16,
    titleKey: 'onboarding.tour.desktop.profile.title',
    bodyKey: 'onboarding.tour.desktop.profile.body',
  },
  {
    id: 'done',
    selector: null,
    placement: 'center',
    more: 'close',
    titleKey: 'onboarding.tour.done.title',
    bodyKey: 'onboarding.tour.done.body',
  },
]

/**
 * @param {TourVariant} variant
 * @returns {TourStep[]}
 */
export function getTourSteps(variant) {
  return variant === 'desktop' ? DESKTOP_TOUR_STEPS : MOBILE_TOUR_STEPS
}

export const TOUR_DESKTOP_MQ = '(min-width: 1024px)'
