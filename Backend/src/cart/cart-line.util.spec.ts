import { buildCartLineKey, normalizeCartNote, resolveMenuCustomization } from './cart-line.util';
import { MenuModifierGroup, MenuVariant } from '@/products/schemas/menu-option.schema';

const variants: MenuVariant[] = [
  { id: 'regular', name: 'Regular', priceAdjustment: 0, isDefault: true, isAvailable: true },
  { id: 'large', name: 'Large', priceAdjustment: 2500, isDefault: false, isAvailable: true },
];

const modifierGroups: MenuModifierGroup[] = [
  {
    id: 'protein',
    name: 'Choose a protein',
    minSelections: 1,
    maxSelections: 1,
    options: [
      { id: 'chicken', name: 'Chicken', priceAdjustment: 3000, isAvailable: true },
      { id: 'beef', name: 'Beef', priceAdjustment: 4500, isAvailable: false },
    ],
  },
  {
    id: 'extras',
    name: 'Extras',
    minSelections: 0,
    maxSelections: 2,
    options: [{ id: 'cheese', name: 'Cheese', priceAdjustment: 1000, isAvailable: true }],
  },
];

describe('restaurant cart line utilities', () => {
  it('uses the default variant and totals modifier adjustments', () => {
    const result = resolveMenuCustomization(variants, modifierGroups, {
      modifierOptionIds: ['chicken', 'cheese'],
    });

    expect(result).toMatchObject({
      valid: true,
      variant: { id: 'regular' },
      priceAdjustment: 4000,
    });
  });

  it('rejects a missing required modifier', () => {
    expect(resolveMenuCustomization(variants, modifierGroups, { modifierOptionIds: [] })).toEqual({
      valid: false,
      message: 'Choose between 1 and 1 option(s) for Choose a protein',
    });
  });

  it('rejects an unavailable modifier option', () => {
    expect(
      resolveMenuCustomization(variants, modifierGroups, { modifierOptionIds: ['beef'] })
    ).toEqual({
      valid: false,
      message: 'One of the selected Choose a protein options is unavailable',
    });
  });

  it('creates the same line key regardless of modifier order or note whitespace', () => {
    const first = buildCartLineKey({
      productId: 'dish-1',
      variantId: 'large',
      modifierOptionIds: ['cheese', 'chicken'],
      note: '  no   onions ',
    });
    const second = buildCartLineKey({
      productId: 'dish-1',
      variantId: 'large',
      modifierOptionIds: ['chicken', 'cheese'],
      note: 'no onions',
    });

    expect(first).toBe(second);
    expect(normalizeCartNote('  no   onions ')).toBe('no onions');
  });

  it('keeps differently noted dishes as separate cart lines', () => {
    const withoutOnions = buildCartLineKey({ productId: 'dish-1', note: 'no onions' });
    const withoutSauce = buildCartLineKey({ productId: 'dish-1', note: 'no sauce' });

    expect(withoutOnions).not.toBe(withoutSauce);
  });
});
