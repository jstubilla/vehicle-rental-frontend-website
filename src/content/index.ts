/**
 * ALL user-facing copy lives here. Components import `content` instead of
 * hardcoding text, so wording can be changed (or translated later) in one place.
 * As pages are added, add their sections below.
 */
export const content = {
  site: {
    name: "Car Rental Co.",
    tagline: "Placeholder tagline goes here",
    description:
      "Placeholder description: rent a car in the Philippines with simple online booking.",
    contactPhone: "+63 917 000 0000",
    contactEmail: "hello@example.com",
  },

  seo: {
    titleTemplate: "%s | Car Rental Co.",
    defaultTitle: "Car Rental Co. | Rent a car in the Philippines",
    locale: "en_PH",
  },

  nav: {
    public: [
      { label: "Home", href: "/" },
      { label: "Vehicles", href: "/vehicles" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    bookCta: { label: "Book now", href: "/book/dates" },
    primaryLabel: "Main navigation",
    skipToContent: "Skip to main content",
  },

  socials: [
    { label: "Facebook", href: "https://facebook.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "TikTok", href: "https://tiktok.com" },
  ],

  footer: {
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Vehicles", href: "/vehicles" },
          { label: "Book now", href: "/book/dates" },
          { label: "About us", href: "/about" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Contact us", href: "/contact" },
          { label: "Staff login", href: "/admin/login" },
        ],
      },
    ],
    socialsTitle: "Follow us",
    legal: "© 2026 Car Rental Co. All rights reserved.",
  },

  /** Built-in labels used inside UI kit components (mostly accessibility text). */
  ui: {
    loading: "Loading…",
    close: "Close",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    previousMonth: "Go to previous month",
    nextMonth: "Go to next month",
    selectDate: "Select date",
    selectTime: "Select time",
    dismiss: "Dismiss",
    required: "required",
    opensInNewTab: "opens in a new tab",
    notifications: "Notifications",
    pagination: {
      label: "Pagination",
      previous: "Previous",
      next: "Next",
      page: "Page",
    },
    stepper: { label: "Progress", step: "Step", of: "of", complete: "completed" },
    sort: { ascending: "sorted ascending", descending: "sorted descending" },
    alert: {
      info: "Note",
      success: "Success",
      warning: "Warning",
      danger: "Error",
    },
  },

  /** Wording for the reusable empty / error / loading states. */
  states: {
    emptyTitle: "Nothing here yet",
    emptyDescription: "There is nothing to show right now.",
    errorTitle: "Something went wrong",
    errorDescription: "We could not load this. Please try again.",
    retry: "Try again",
    notFoundTitle: "Page not found",
    notFoundDescription: "The page you are looking for does not exist or has moved.",
    backHome: "Back to home",
  },

  /** Placeholder home page copy; replaced by the real home page in Phase 2. */
  home: {
    title: "Home",
    description: "The home page is built in Phase 2.",
  },
} as const;

export type Content = typeof content;
