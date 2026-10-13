import type { MeliItem } from '../../models/types';

export function isConsolidatedFamily(item: Pick<MeliItem, 'id' | 'family_id'>): boolean {
    if (item.family_id == null) return false;
    const family = String(item.family_id).trim();
    return family.length > 0 && item.id === family;
}

export function itemSearchName(item: Pick<MeliItem, 'id' | 'family_id' | 'family_name' | 'title'>): string {
    if (isConsolidatedFamily(item)) {
        const family = item.family_name?.trim();
        if (family) return family;
        return item.title?.trim() || '';
    }
    const family = item.family_name?.trim();
    if (family) return family;
    return item.title?.trim() || '';
}

/** Variant title shown only when it adds something the family name does not. */
export function itemSearchSecondaryTitle(item: Pick<MeliItem, 'id' | 'family_id' | 'family_name' | 'title'>): string | null {
    if (isConsolidatedFamily(item)) return null;
    const family = item.family_name?.trim();
    const title = item.title?.trim();
    if (!family || !title || family === title) return null;
    return title;
}

export function itemSearchFamilyLabel(familyId: MeliItem['family_id']): string | null {
    if (familyId == null) return null;
    const text = String(familyId).trim();
    if (!text) return null;
    return `Familia: #${text}`;
}

export function itemSearchLogisticLabel(logisticType?: string | null): string | null {
    if (!logisticType?.trim()) return null;
    const value = logisticType.trim().toLowerCase();
    if (value === 'fulfillment') return 'Full';
    if (value === 'self_service') return 'Flex';
    return logisticType.trim();
}

export function itemSearchMetaLine(item: Pick<MeliItem, 'id' | 'family_id' | 'seller_sku' | 'shipping' | 'logisticsType' | 'variations'>): string {
    const logistic = itemSearchLogisticLabel(item.shipping?.logistic_type ?? item.logisticsType);
    if (isConsolidatedFamily(item)) {
        const count = item.variations?.length ?? 0;
        return [`Familia #${String(item.family_id).trim()}`, `${count} variantes`, logistic]
            .filter((part): part is string => !!part)
            .join(' · ');
    }

    const family = item.family_id == null || String(item.family_id).trim() === ''
        ? null
        : itemSearchFamilyLabel(item.family_id);
    if (family) {
        const sku = item.seller_sku?.trim();
        return [`#${item.id}`, family, sku || null, logistic].filter((part): part is string => !!part).join(' · ');
    }

    const count = item.variations?.length ?? 0;
    const singleSku = count === 1
        ? (item.variations?.[0]?.sku?.trim() || item.seller_sku?.trim() || null)
        : (item.seller_sku?.trim() || null);
    const middle = count > 1 ? `${count} variantes` : singleSku;
    return [`#${item.id}`, middle, logistic].filter((part): part is string => !!part).join(' · ');
}
