/**
 * An address as one line, from whatever parts it actually has. Checkout asks
 * only for the address line now; older addresses also carry an area and a
 * governorate, which are still worth showing when present.
 */
export function addressText(address: {
  addressLine: string;
  city?: string | null;
  governorate?: string | null;
}): string {
  return [address.addressLine, address.city, address.governorate]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}
