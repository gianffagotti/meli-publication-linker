import { describe, expect, it } from 'vitest';
import type { RuleComponentWithItem } from '../components/Rules/RuleComponentsStep';
import type { MeliItem, MeliVariation } from '../models/types';
import { parseSizeFromSku } from '../hooks/useSourceSizes';
import { buildInitialMappings } from './buildInitialMappings';

function variation(id: string, sku: string, description?: string): MeliVariation {
    return { user_product_id: id, sku, description };
}

function item(id: string, variations: MeliVariation[]): MeliItem {
    return { id, variations };
}

function component(source: MeliItem, quantity = 3): RuleComponentWithItem {
    return { sourceItem: source, quantity };
}

describe('buildInitialMappings PACK', () => {
    it('maps a unique suffix, a missing suffix, and a repeated suffix on the same target', () => {
        const source = item('SRC', [
            variation('s-10', 'UNIT#10#1'),
            variation('s-20', 'UNIT#20#2'),
            variation('s-88-a', 'UNITA#88#1'),
            variation('s-88-b', 'OTHER#88#1'),
        ]);
        const target = item('TGT', [
            variation('t-10', '4055G.2#10#1'),
            variation('t-99', '4055G.2#99#1'),
            variation('t-88', '4055G.2#88#1'),
        ]);

        const mappings = buildInitialMappings('PACK', target, [component(source)]);
        const byId = Object.fromEntries(mappings.map((mapping) => [mapping.targetVariantId, mapping]));

        expect(byId['t-10'].strategy).toBe('EXPLICIT');
        expect(byId['t-10'].sourceMatches.map((match) => match.sourceVariantId)).toEqual(['s-10']);

        expect(byId['t-99'].strategy).toBe('DYNAMIC_SIZE');
        expect(byId['t-99'].matchSize).toBe('1');
        expect(byId['t-99'].sourceMatches).toEqual([]);

        expect(byId['t-88'].strategy).toBe('EXPLICIT');
        expect(byId['t-88'].sourceMatches.map((match) => match.sourceVariantId)).toEqual(['s-88-a', 's-88-b']);
    });

    it('reuses the same source hit for every target with that suffix and ignores case and whitespace', () => {
        const source = item('SRC', [variation('s-88', '4055G.2#88#1')]);
        const target = item('TGT', [
            variation('a', '  4055g.2#88#1 '),
            variation('b', '4055G.2#88#1'),
        ]);

        const mappings = buildInitialMappings('PACK', target, [component(source, 1)]);

        expect(mappings).toHaveLength(2);
        for (const mapping of mappings) {
            expect(mapping.strategy).toBe('EXPLICIT');
            expect(mapping.sourceMatches.map((match) => match.sourceVariantId)).toEqual(['s-88']);
        }
    });

    it('normalizes description fallback and full-SKU matches', () => {
        const source = item('SRC', [
            variation('by-desc', 'UNIT#1#9', ' rojo '),
            variation('by-sku', '  abc#1 '),
        ]);
        const packTarget = item('PACK', [variation('p', '4055G.2#ZZ#9', 'Rojo')]);
        const comboTarget = item('COMBO', [variation('c', 'ABC#1')]);

        const packMappings = buildInitialMappings('PACK', packTarget, [component(source)]);
        expect(packMappings[0].strategy).toBe('EXPLICIT');
        expect(packMappings[0].sourceMatches.map((match) => match.sourceVariantId)).toEqual(['by-desc']);

        const comboMappings = buildInitialMappings('COMBO', comboTarget, [component(source, 2)]);
        expect(comboMappings[0].strategy).toBe('EXPLICIT');
        expect(comboMappings[0].sourceMatches.map((match) => match.sourceVariantId)).toEqual(['by-sku']);
    });
});

describe('parseSizeFromSku', () => {
    it('returns the last segment uppercased and trimmed', () => {
        expect(parseSizeFromSku('4055G.2#88#s')).toBe('S');
        expect(parseSizeFromSku('4055G.2#88# S ')).toBe('S');
        expect(parseSizeFromSku('NOSIZE')).toBeNull();
    });
});
