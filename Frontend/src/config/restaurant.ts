// The delivery promise, as numbers rather than only as copy: the confirmation
// message staff send turns these into a clock time, and the badges around the
// site render the string below. Both come from here so they can never disagree.
const DELIVERY_ETA_MINUTES = { min: 30, max: 40 } as const;

export const RESTAURANT = {
  // Temporary working identity. Keep brand-sensitive content here until the
  // restaurant's final name, cuisine, hours, and service rules are confirmed.
  name: "Fire House",
  shortName: "FH",
  orderStatus: "Order directly with us",
  deliveryEtaMinutes: DELIVERY_ETA_MINUTES,
  // Kept as an en dash and this exact spacing: it is a key in the Arabic
  // dictionary, which matches whole strings.
  estimatedDelivery: `${DELIVERY_ETA_MINUTES.min}–${DELIVERY_ETA_MINUTES.max} min`,
  currency: "EGP",
  // Only publish verified business details. Empty values hide their links.
  phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE ?? "",
  email: process.env.NEXT_PUBLIC_RESTAURANT_EMAIL ?? "",
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ?? "",
  hours: process.env.NEXT_PUBLIC_RESTAURANT_HOURS ?? "",
  instagram: process.env.NEXT_PUBLIC_RESTAURANT_INSTAGRAM ?? "",
  facebook: process.env.NEXT_PUBLIC_RESTAURANT_FACEBOOK ?? "",
} as const;
