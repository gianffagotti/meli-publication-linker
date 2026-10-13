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

    it('renders a consolidated family without an MLA or a single SKU', () => {
        const family = option({
            id: '1780129655050322',
            family_id: '1780129655050322',
            family_name: 'Remera dry fit',
            title: 'Remera roja M',
            seller_sku: 'ABC#ROJO#M',
            shipping: { logistic_type: 'fulfillment' },
            variations: [
                { user_product_id: 'MLAU1', sku: 'ABC#ROJO#M' },
                { user_product_id: 'MLAU2', sku: 'ABC#AZUL#L' },
            ],
        });
        expect(itemSearchName(family)).toBe('Remera dry fit');
        expect(itemSearchSecondaryTitle(family)).toBeNull();
        expect(itemSearchMetaLine(family)).toBe('Familia #1780129655050322 · 2 variantes · Full');
        expect(itemSearchMetaLine(family)).not.toContain('#MLA');
        expect(itemSearchMetaLine(family)).not.toContain('ABC#');
    });

    it('uses the title when the consolidated family has no name', () => {
        const family = option({ id: '1780129655050322', family_id: 1780129655050322, title: 'Remera' });
        expect(itemSearchName(family)).toBe('Remera');
        expect(itemSearchMetaLine(family)).toContain('Familia #1780129655050322');
        expect(itemSearchMetaLine(family)).toContain('0 variantes');
    });

    it('shows the MLA, a single SKU and logistics for a legacy publication', () => {
        const legacy = option({
            id: 'MLA100',
            title: 'Media',
            seller_sku: 'ABC#AZUL#M',
            shipping: { logistic_type: 'self_service' },
            variations: [{ user_product_id: 'UP', sku: 'ABC#AZUL#M' }],
        });
        expect(itemSearchMetaLine(legacy)).toBe('#MLA100 · ABC#AZUL#M · Flex');
    });
});
