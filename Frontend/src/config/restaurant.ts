export const RESTAURANT = {
  // Temporary working identity. Keep brand-sensitive content here until the
  // restaurant's final name, cuisine, hours, and service rules are confirmed.
  name: "Fire House",
  shortName: "FH",
  orderStatus: "Order directly with us",
  estimatedDelivery: "30–40 min",
  currency: "EGP",
  // Only publish verified business details. Empty values hide their links.
  phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE ?? "",
  email: process.env.NEXT_PUBLIC_RESTAURANT_EMAIL ?? "",
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS ?? "",
  hours: process.env.NEXT_PUBLIC_RESTAURANT_HOURS ?? "",
  instagram: process.env.NEXT_PUBLIC_RESTAURANT_INSTAGRAM ?? "",
  facebook: process.env.NEXT_PUBLIC_RESTAURANT_FACEBOOK ?? "",
} as const;
