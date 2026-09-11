const EGYPT_COUNTRY_CODE = '20';

// Egyptian mobile numbers are 10 digits after the country code and always
// start with 1 (010/011/012/015 written locally, where the leading 0 is a
// national trunk prefix that is dropped internationally).
const EGYPT_MOBILE = /^1[0125]\d{8}$/;

/**
 * Normalises whatever a customer typed into the digits WhatsApp expects:
 * country code first, no '+', no spaces, no leading zero.
 *
 * People write their number every way imaginable — `0100 123 4567`,
 * `+20 100 123 4567`, `0020-100-123-4567`. All of those are the same phone,
 * and a staff member tapping "WhatsApp" should reach it in every case.
 *
 * Returns null when the result is not a number worth dialling, so callers can
 * degrade to showing the raw text rather than linking somewhere wrong.
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Arabic-Indic digits appear when the customer types on an Arabic keyboard.
  const westernised = raw.replace(/[٠-٩]/g, d =>
    String(d.charCodeAt(0) - 0x0660)
  );
  let digits = westernised.replace(/\D/g, '');
  if (!digits) return null;

  // 00 is the international access prefix used across the region; strip it so
  // 0020… and +20… end up identical.
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(EGYPT_COUNTRY_CODE)) {
    const national = digits.slice(EGYPT_COUNTRY_CODE.length);
    return EGYPT_MOBILE.test(national) ? EGYPT_COUNTRY_CODE + national : null;
  }

  // Local form: 01xxxxxxxxx.
  if (digits.startsWith('0')) {
    const national = digits.slice(1);
    return EGYPT_MOBILE.test(national) ? EGYPT_COUNTRY_CODE + national : null;
  }

  // Already national, no prefix at all: 1xxxxxxxxx.
  if (EGYPT_MOBILE.test(digits)) {
    return EGYPT_COUNTRY_CODE + digits;
  }

  // Something outside Egypt. Accept it if it is a plausible international
  // number rather than refusing to contact a customer roaming on a foreign
  // SIM, but never invent a country code for it.
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/**
 * Splits a configured recipient list ("201001234567, 201119876543") into
 * normalised numbers, dropping anything unusable.
 */
export function parseRecipients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(/[,;\s]+/)) {
    const number = toWhatsAppNumber(part);
    if (number) seen.add(number);
  }
  return [...seen];
}
