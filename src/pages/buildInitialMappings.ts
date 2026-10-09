import type { MeliItem, MeliVariation, RuleType, VariantMapping } from '../models/types';
import type { RuleComponentWithItem } from '../components/Rules/RuleComponentsStep';
import { normalizeSkuToken } from '../utils/skuToken';

export function getSkuSegments(sku: string): string[] {
    return sku
        .split('#')
        .map((part) => normalizeSkuToken(part))
        .filter((part) => part.length > 0);
}

/** Last two normalized segments: COLOR#TALLE. Size is the SKU termination. */
export function getSkuColorSizeSuffix(sku: string): { suffix: string; size: string } | null {
    const segments = getSkuSegments(sku);
    if (segments.length < 2) return null;
    const size = segments[segments.length - 1];
    const color = segments[segments.length - 2];
    return { suffix: `${color}#${size}`, size };
}

function toExplicitMapping(
    targetVariantId: string,
    targetSku: string,
    comp: RuleComponentWithItem,
    matches: MeliVariation[],
): VariantMapping {
    return {
        targetVariantId,
        targetSku,
        strategy: 'EXPLICIT',
        sourceMatches: matches.map((match) => ({
            sourceItemId: comp.sourceItem.id,
            sourceVariantId: match.user_product_id.toString(),
            sourceSku: match.sku || '',
            quantity: comp.quantity,
        })),
    };
}

/** Build initial mappings by SKU when entering Step 3. */
export function buildInitialMappings(
    ruleType: RuleType,
    details: MeliItem,
    comps: RuleComponentWithItem[],
): VariantMapping[] {
    const newMappings: VariantMapping[] = [];
    if (!details.variations?.length) return newMappings;
    details.variations.forEach((targetVar) => {
        const targetVariantId = targetVar.user_product_id.toString();
        const targetSku = targetVar.sku || '';

        if (ruleType === 'PACK') {
            const comp = comps[0];
            const targetSuffix = targetSku ? getSkuColorSizeSuffix(targetSku) : null;
            const sourceVariants = comp?.sourceItem.variations ?? [];
            const matches = targetSuffix
                ? sourceVariants.filter((sv) => {
                    if (!sv.sku) return false;
                    const sourceSuffix = getSkuColorSizeSuffix(sv.sku);
                    return sourceSuffix?.suffix === targetSuffix.suffix;
                })
                : [];

            if (matches.length >= 1 && comp) {
                newMappings.push(toExplicitMapping(targetVariantId, targetSku, comp, matches));
                return;
            }

            // Fallback: si no matcheó por SKU (COLOR#TALLE), intentar por descripción
            const targetDesc = targetVar.description ? normalizeSkuToken(targetVar.description) : '';
            if (matches.length === 0 && targetDesc) {
                const descMatches = sourceVariants.filter((sv) => {
                    const srcDesc = normalizeSkuToken(sv.description ?? '');
                    return srcDesc.length > 0 && srcDesc === targetDesc;
                });
                if (descMatches.length === 1 && comp) {
                    newMappings.push(toExplicitMapping(targetVariantId, targetSku, comp, descMatches));
                    return;
                }
            }

            if (matches.length === 0 && targetSuffix?.size) {
                newMappings.push({
                    targetVariantId,
                    targetSku,
                    strategy: 'DYNAMIC_SIZE',
                    matchSize: targetSuffix.size,
                    sourceMatches: [],
                });
                return;
            }
        }

        const sourceMatches: VariantMapping['sourceMatches'] = [];
        comps.forEach((comp) => {
            const match = comp.sourceItem.variations?.find(
                (sv) => sv.sku && targetVar.sku && normalizeSkuToken(sv.sku) === normalizeSkuToken(targetVar.sku)
            );
            if (match) {
                sourceMatches.push({
                    sourceItemId: comp.sourceItem.id,
                    sourceVariantId: match.user_product_id.toString(),
                    sourceSku: match.sku || '',
                    quantity: comp.quantity,
                });
            }
        });
        newMappings.push({
            targetVariantId,
            targetSku,
            strategy: 'EXPLICIT',
            sourceMatches,
        });
    });
    return newMappings;
}
