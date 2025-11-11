export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const features: Feature[] = [
  {
    id: "instant-search",
    title: "Instant search",
    description:
      "Enter a neighborhood and see verified driveways, garages, and chargers populate instantly on a live Google Map.",
    icon: "�",
  },
  {
    id: "host-ready",
    title: "Host-ready tools",
    description:
      "Set your availability, nightly price, and access instructions. We handle reminders, payouts, and guest messaging.",
    icon: "🏡",
  },
  {
    id: "simple-payments",
    title: "Simple payments",
    description:
      "Accept Apple Pay, cards, or invoices automatically, with transparent fees and instant payouts after each stay.",
    icon: "💳",
  },
  {
    id: "smart-navigation",
    title: "Smart navigation",
    description:
      "Optimise every trip with charger suggestions, saved favourites, and gentle reroutes when traffic changes.",
    icon: "🗺️",
  },
];
