import { createHash } from 'crypto';
import {
  MenuModifierGroup,
  MenuModifierOption,
  MenuVariant,
} from '@/products/schemas/menu-option.schema';

export interface CartCustomizationInput {
  productId: string;
  variantId?: string | null;
  modifierOptionIds?: string[];
  note?: string | null;
}

export function normalizeCartNote(note?: string | null): string | null {
  const normalized = note?.trim().replace(/\s+/g, ' ') ?? '';
  return normalized || null;
}

export function buildCartLineKey(input: CartCustomizationInput): string {
  const identity = JSON.stringify({
    productId: input.productId,
    variantId: input.variantId ?? null,
    modifierOptionIds: [...(input.modifierOptionIds ?? [])].sort(),
    note: normalizeCartNote(input.note),
  });

  return createHash('sha256').update(identity).digest('hex').slice(0, 24);
}

export type ResolvedModifier = Pick<MenuModifierOption, 'id' | 'name' | 'priceAdjustment'> & {
  groupId: string;
  groupName: string;
};

export type CustomizationResolution =
  | {
      valid: true;
      variant: MenuVariant | null;
      modifiers: ResolvedModifier[];
      priceAdjustment: number;
    }
  | { valid: false; message: string };

export function resolveMenuCustomization(
  variants: MenuVariant[],
  modifierGroups: MenuModifierGroup[],
  input: Pick<CartCustomizationInput, 'variantId' | 'modifierOptionIds'>
): CustomizationResolution {
  let variant: MenuVariant | null = null;
  if (variants.length > 0) {
    variant = input.variantId
      ? (variants.find(candidate => candidate.id === input.variantId) ?? null)
      : (variants.find(candidate => candidate.isDefault) ?? null);

    if (!variant || !variant.isAvailable) {
      return { valid: false, message: 'Choose an available variant' };
    }
  } else if (input.variantId) {
    return { valid: false, message: 'This item does not have variants' };
  }

  const requestedIds = input.modifierOptionIds ?? [];
  const requested = new Set(requestedIds);
  if (requested.size !== requestedIds.length) {
    return { valid: false, message: 'A modifier option cannot be selected more than once' };
  }

  const matchedIds = new Set<string>();
  const modifiers: ResolvedModifier[] = [];

  for (const group of modifierGroups) {
    const selected = group.options.filter(option => requested.has(option.id));
    if (selected.length < group.minSelections || selected.length > group.maxSelections) {
      return {
        valid: false,
        message: `Choose between ${group.minSelections} and ${group.maxSelections} option(s) for ${group.name}`,
      };
    }
    if (selected.some(option => !option.isAvailable)) {
      return { valid: false, message: `One of the selected ${group.name} options is unavailable` };
    }

    for (const option of selected) {
      matchedIds.add(option.id);
      modifiers.push({
        id: option.id,
        name: option.name,
        priceAdjustment: option.priceAdjustment,
        groupId: group.id,
        groupName: group.name,
      });
    }
  }

  if (matchedIds.size !== requested.size) {
    return { valid: false, message: 'One or more selected modifier options are invalid' };
  }

  const priceAdjustment =
    (variant?.priceAdjustment ?? 0) +
    modifiers.reduce((sum, modifier) => sum + modifier.priceAdjustment, 0);

  return { valid: true, variant, modifiers, priceAdjustment };
}
