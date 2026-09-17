const EGYPT_COUNTRY_CODE = "20";
const EGYPT_MOBILE = /^1[0125]\d{8}$/;

/**
 * Turns whatever the customer typed into the digits WhatsApp expects: country
 * code first, no '+', no leading zero.
 *
 * Mirrors the backend's phone.util.ts. Duplicated rather than shared because
 * the two run in different processes, and a staff member tapping "WhatsApp"
 * must reach the same number the alert was addressed to.
 *
 * Returns null when the result would not be a real number, so the UI can show
 * the raw text instead of linking a staff member to a stranger.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const westernised = raw.replace(/[٠-٩]/g, (d) =>
    String(d.charCodeAt(0) - 0x0660),
  );
  let digits = westernised.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith(EGYPT_COUNTRY_CODE)) {
    const national = digits.slice(EGYPT_COUNTRY_CODE.length);
    return EGYPT_MOBILE.test(national) ? EGYPT_COUNTRY_CODE + national : null;
  }
  if (digits.startsWith("0")) {
    const national = digits.slice(1);
    return EGYPT_MOBILE.test(national) ? EGYPT_COUNTRY_CODE + national : null;
  }
  if (EGYPT_MOBILE.test(digits)) return EGYPT_COUNTRY_CODE + digits;

  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/**
 * A click-to-chat link, optionally pre-filled. This is how staff reach the
 * *customer* — it opens WhatsApp on their own phone and needs no API, no
 * template approval and no business number.
 */
export function whatsAppLink(phone: string | null | undefined, message?: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}

export function telLink(phone: string | null | undefined): string | null {
  const number = toWhatsAppNumber(phone);
  return number ? `tel:+${number}` : null;
}

/** Opens the address in whatever maps app the staff member has. */
export function mapsLink(parts: (string | null | undefined)[]): string {
  const query = parts.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
