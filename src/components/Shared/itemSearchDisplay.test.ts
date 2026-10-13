import { describe, expect, it } from 'vitest';
import type { MeliItem } from '../../models/types';
import { itemSearchMetaLine, itemSearchName, itemSearchSecondaryTitle } from './itemSearchDisplay';

function option(partial: Partial<MeliItem> & Pick<MeliItem, 'id'>): MeliItem {
    return { variations: [], ...partial };
}

describe('item search disambiguation', () => {
    const red = option({
        id: 'MLA1',
        title: 'Remera roja M',
        family_name: 'Remera dry fit',
        family_id: '4270357590777233',
        seller_sku: 'ABC#ROJO#M',
        shipping: { logistic_type: 'fulfillment' },
    });
    const blue = option({
        id: 'MLA2',
        title: 'Remera azul L',
        family_name: 'Remera dry fit',
        family_id: '4270357590777233',
        seller_sku: 'ABC#AZUL#L',
        shipping: { logistic_type: 'self_service' },
    });

    it('shows the family name and the distinct variant title', () => {
        expect(itemSearchName(red)).toBe('Remera dry fit');
        expect(itemSearchSecondaryTitle(red)).toBe('Remera roja M');
        expect(itemSearchSecondaryTitle(blue)).toBe('Remera azul L');
    });

    it('distinguishes siblings by publication id, family, sku and logistics', () => {
        expect(itemSearchMetaLine(red)).toBe('#MLA1 · Familia: #4270357590777233 · ABC#ROJO#M · Full');
        expect(itemSearchMetaLine(blue)).toBe('#MLA2 · Familia: #4270357590777233 · ABC#AZUL#L · Flex');
    });

    it('omits family and sku when the publication has neither', () => {
        const lone = option({ id: 'MLA9', title: 'Media unica' });
        expect(itemSearchName(lone)).toBe('Media unica');
        expect(itemSearchSecondaryTitle(lone)).toBeNull();
        expect(itemSearchMetaLine(lone)).toBe('#MLA9');
    });
});
