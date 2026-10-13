export function savedTargetItemId(lockedTargetItemId: string | null | undefined, selectedItemId: string): string {
    const locked = lockedTargetItemId?.trim();
    return locked ? locked : selectedItemId;
}

export function resolveSourceItemId(
    components: { selectedId: string; persistedSourceItemId?: string }[],
    sourceItemId: string,
): string {
    const comp = components.find((c) => c.selectedId === sourceItemId || c.persistedSourceItemId === sourceItemId);
    const persisted = comp?.persistedSourceItemId?.trim();
    return persisted || sourceItemId;
}

/** Publication key is the family id. Variant key is the user product, or the numeric MLA id when the UP is missing. */
export function variantIdentity(
    variation: { user_product_id?: string | null; id?: number | string | null },
    familyId?: string | number | null,
): string {
    const family = familyId == null ? '' : String(familyId).trim();
    const up = variation.user_product_id?.toString().trim() ?? '';
    if (up && up !== family) return up;
    if (variation.id != null && String(variation.id) !== '0') {
        const numeric = String(variation.id).trim();
        if (numeric && numeric !== family) return numeric;
    }
    return up;
}
