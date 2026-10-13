import type { MeliItem } from '../../models/types';

export function itemSearchName(item: Pick<MeliItem, 'family_name' | 'title'>): string {
    const family = item.family_name?.trim();
    if (family) return family;
    return item.title?.trim() || '';
}

/** Variant title shown only when it adds something the family name does not. */
export function itemSearchSecondaryTitle(item: Pick<MeliItem, 'family_name' | 'title'>): string | null {
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

export function itemSearchMetaLine(item: Pick<MeliItem, 'id' | 'family_id' | 'seller_sku' | 'shipping' | 'logisticsType'>): string {
    const family = itemSearchFamilyLabel(item.family_id);
    const sku = item.seller_sku?.trim();
    const logistic = itemSearchLogisticLabel(item.shipping?.logistic_type ?? item.logisticsType);
    return [`#${item.id}`, family, sku || null, logistic].filter((part): part is string => !!part).join(' · ');
}
