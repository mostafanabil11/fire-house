import { toWhatsAppNumber, parseRecipients } from './phone.util';

describe('toWhatsAppNumber', () => {
  // Every one of these is the same Egyptian mobile, written the way a real
  // customer might type it into a checkout form.
  it.each([
    '01001234567',
    '0100 123 4567',
    '0100-123-4567',
    '+201001234567',
    '+20 100 123 4567',
    '00201001234567',
    '201001234567',
    '1001234567',
  ])('normalises %s', input => {
    expect(toWhatsAppNumber(input)).toBe('201001234567');
  });

  it('handles every Egyptian mobile prefix', () => {
    expect(toWhatsAppNumber('01012345678')).toBe('201012345678');
    expect(toWhatsAppNumber('01112345678')).toBe('201112345678');
    expect(toWhatsAppNumber('01212345678')).toBe('201212345678');
    expect(toWhatsAppNumber('01512345678')).toBe('201512345678');
  });

  it('reads Arabic-Indic digits', () => {
    expect(toWhatsAppNumber('٠١٠٠١٢٣٤٥٦٧')).toBe('201001234567');
  });

  it('keeps a plausible foreign number as typed', () => {
    expect(toWhatsAppNumber('+971 50 123 4567')).toBe('971501234567');
  });

  // Better to show the raw text than to link a staff member to a stranger.
  it.each([null, undefined, '', '   ', 'not a phone', '0123', '02 2735 1234'])(
    'refuses %s',
    input => {
      expect(toWhatsAppNumber(input)).toBeNull();
    }
  );

  it('refuses an Egyptian mobile with the wrong digit count', () => {
    expect(toWhatsAppNumber('0100123456')).toBeNull();
    expect(toWhatsAppNumber('010012345678')).toBeNull();
  });
});

describe('parseRecipients', () => {
  it('splits on commas, semicolons and whitespace', () => {
    expect(parseRecipients('01001234567, 01112345678; +201212345678')).toEqual([
      '201001234567',
      '201112345678',
      '201212345678',
    ]);
  });

  // The same staff number written two ways must not produce two alerts.
  it('deduplicates numbers that normalise to the same phone', () => {
    expect(parseRecipients('01001234567, +20 100 123 4567')).toEqual(['201001234567']);
  });

  it('drops unusable entries without discarding the rest', () => {
    expect(parseRecipients('01001234567, nonsense, 0123')).toEqual(['201001234567']);
  });

  it('returns nothing when unset', () => {
    expect(parseRecipients(null)).toEqual([]);
    expect(parseRecipients('')).toEqual([]);
  });
});
