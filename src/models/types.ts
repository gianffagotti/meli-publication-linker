export interface MeliVariation {
  user_product_id: string;
  sku?: string;
  description?: string;
}

export interface MeliShipping {
  logistic_type?: string;
}

export interface MeliItem {
  id: string;
  variations: MeliVariation[];
  title?: string;
  thumbnail?: string;
  /** For FULL warning: fulfillment = ML controls stock. */
  shipping?: MeliShipping;
}

export type RuleType = 'FULL' | 'PACK' | 'COMBO';

/** Maps to RuleComponentDto */
export interface RuleComponent {
  sourceItemId: string;
  quantity: number;
}

/** Maps to RuleSourceMatchDto (API payload). */
export interface RuleSourceMatch {
  sourceItemId: string;
  sourceVariantId: string;
  sourceSku: string;
  quantity: number;
}

/** Payload for API: sourceVariantId may be null for "surtido". */
export interface RuleSourceMatchPayload {
  sourceItemId: string;
  sourceVariantId: string | null;
  sourceSku: string;
  quantity: number;
}

/**
 * Variant mapping: one target variant → list of source matches (Simple = 1, Assorted/Pool = many).
 * API: targetVariantId, targetSku, packQuantity?, sourceMatches[].
 */
export interface VariantMapping {
  targetVariantId: string;
  targetSku: string;
  /** Optional per-variant pack size override. Sent as packQuantity. */
  customPackQuantity?: number;
  /** List of source SKUs (one or more). One = Simple, multiple = Surtido/Pool. */
  sourceMatches: RuleSourceMatch[];
}

/** Maps to StockRuleDto. No packMode / packSurtidoGroupBy (Spec V2). */
export interface StockRule {
  targetItemId: string;
  targetTitle: string;
  targetThumbnail?: string | null;
  targetSku: string;
  ruleType: RuleType;
  /** PACK/COMBO: default pack size. Spec V2. */
  defaultPackQuantity: number;
  components: RuleComponent[];
  mappings: VariantMapping[];
  /** Hydrated data for UI (not part of DTO). */
  targetItem?: MeliItem;
  sourceItems?: MeliItem[];
}
