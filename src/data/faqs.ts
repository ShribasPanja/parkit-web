export type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export const faqs: FAQ[] = [
  {
    id: "coverage",
    question: "Where is Parkit available?",
    answer:
      "Parkit is live in 180+ cities across Europe and North America, with new neighbourhood hosts joining daily. Request your area and we will fast-track onboarding.",
  },
  {
    id: "host",
    question: "Can I host my driveway or charger?",
    answer:
      "Absolutely. Set your price, choose available days, and share arrival instructions. We verify every guest and transfer payouts 24 hours after checkout.",
  },
  {
    id: "cancellation",
    question: "What if plans change?",
    answer:
      "Guests can cancel free up to 24 hours before arrival. Hosts can opt-in to flexible or firm policies and manage bookings from the Parkit app.",
  },
  {
    id: "mapping",
    question: "Does Parkit work with Google Maps?",
    answer:
      "Yes. Every search, booking, and route plugs directly into Google Maps so you can navigate with step-by-step directions and live traffic.",
  },
];
