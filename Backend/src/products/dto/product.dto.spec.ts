import { createProductSchema } from './create-product.dto';
import { updateProductSchema } from './update-product.dto';

// Importing update-product.dto at all is half the point of this file: building
// it used to call `.partial()` on a schema that already carried refinements,
// which Zod rejects by throwing at module load. `tsc` was perfectly happy, so
// nothing caught it until the whole API failed to boot.

const validProduct = {
  name: 'Classic Beef Burger',
  category: '6aa0d5af357573496977c3d6',
  price: 14500,
  images: ['/images/restaurant/menu/classic-beef-burger.png'],
};

describe('product DTO schemas', () => {
  describe('createProductSchema', () => {
    it('accepts a minimal menu item', () => {
      expect(createProductSchema.safeParse(validProduct).success).toBe(true);
    });

    it('rejects duplicate variant ids', () => {
      const result = createProductSchema.safeParse({
        ...validProduct,
        variants: [
          { id: 'regular', name: 'Regular' },
          { id: 'regular', name: 'Large' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects a modifier group whose limits cannot be met', () => {
      const result = createProductSchema.safeParse({
        ...validProduct,
        modifierGroups: [
          {
            id: 'sauce',
            name: 'Sauce',
            minSelections: 1,
            maxSelections: 3,
            options: [{ id: 'garlic', name: 'Garlic' }],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('requires a stock quantity when inventory tracking is on', () => {
      const result = createProductSchema.safeParse({ ...validProduct, trackInventory: true });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProductSchema', () => {
    it('accepts a partial payload that changes one field', () => {
      const result = updateProductSchema.safeParse({ price: 15500 });
      expect(result.success).toBe(true);
    });

    it('accepts an empty payload', () => {
      expect(updateProductSchema.safeParse({}).success).toBe(true);
    });

    it('accepts isActive, which only exists on updates', () => {
      expect(updateProductSchema.safeParse({ isActive: false }).success).toBe(true);
    });

    // The cross-field rules have to survive being re-attached to the partial
    // schema, otherwise an update becomes a way to write data a create rejects.
    it('still rejects duplicate variant ids', () => {
      const result = updateProductSchema.safeParse({
        variants: [
          { id: 'regular', name: 'Regular' },
          { id: 'regular', name: 'Large' },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('still rejects more than one default variant', () => {
      const result = updateProductSchema.safeParse({
        variants: [
          { id: 'regular', name: 'Regular', isDefault: true },
          { id: 'large', name: 'Large', isDefault: true },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('still rejects duplicate modifier option ids within a group', () => {
      const result = updateProductSchema.safeParse({
        modifierGroups: [
          {
            id: 'sauce',
            name: 'Sauce',
            minSelections: 0,
            maxSelections: 2,
            options: [
              { id: 'garlic', name: 'Garlic' },
              { id: 'garlic', name: 'Extra garlic' },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    // A payload that never mentions variants must not be judged against the
    // absent field — this is what makes the shared rules safe on a partial.
    it('does not invent errors for fields the update leaves alone', () => {
      expect(updateProductSchema.safeParse({ name: 'Renamed dish' }).success).toBe(true);
      expect(updateProductSchema.safeParse({ trackInventory: false }).success).toBe(true);
    });
  });
});
