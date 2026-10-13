import { describe, expect, it } from 'vitest';
import { resolveSourceItemId, savedTargetItemId, variantIdentity } from './ruleSaveIdentity';

describe('rule save identity', () => {
    it('keeps the loaded target id when the detail came back as a family container', () => {
        expect(savedTargetItemId('MLA1', '1780129655050322')).toBe('MLA1');
    });

    it('uses the selected family id for a new rule', () => {
        expect(savedTargetItemId(null, '1780129655050322')).toBe('1780129655050322');
    });

    it('keeps the stored source id when the reloaded publication id is the family', () => {
        const components = [{ selectedId: '1780129655050322', persistedSourceItemId: 'MLA9' }];
        expect(resolveSourceItemId(components, '1780129655050322')).toBe('MLA9');
        expect(resolveSourceItemId(components, 'MLA9')).toBe('MLA9');
    });

    it('uses the selected id for a source added during the edit', () => {
        const components = [{ selectedId: '1780129655050322' }];
        expect(resolveSourceItemId(components, '1780129655050322')).toBe('1780129655050322');
    });

    it('does not use the family id as a variant id', () => {
        expect(variantIdentity({ user_product_id: 'MLAU10' }, '1780129655050322')).toBe('MLAU10');
        expect(variantIdentity({ user_product_id: '1780129655050322', id: 3752456314 }, '1780129655050322')).toBe('3752456314');
    });
});