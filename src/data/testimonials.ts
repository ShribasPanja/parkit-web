export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "host",
    quote:
      "Listing my spare driveway took five minutes. Now I meet lovely travellers, and the extra income covers my EV charging bill each month.",
    name: "Leah Carter",
    role: "Superhost in Bristol",
  },
  {
    id: "ev-driver",
    quote:
      "I love how Parkit remembers my charger preferences. It feels like Airbnb for my EV—friendly hosts, clear instructions, and no surprises.",
    name: "Marco D'Souza",
    role: "Product Designer & EV Driver",
  },
  {
    id: "fleet",
    quote:
      "For our couriers, Parkit is the missing link. Routes auto-plan with charging breaks, and hosts love the guaranteed bookings.",
    name: "Ivy Reynolds",
    role: "Mobility Lead, MetroSend",
  },
];
