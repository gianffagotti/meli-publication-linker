export interface MeliVariation {
  user_product_id: string;
  sku?: string;
  description?: string;
}

export interface MeliItem {
  id: string;
  variations: MeliVariation[];
  title?: string;
  thumbnail?: string;
}

export type RuleType = 'FULL' | 'PACK' | 'COMBO';

/** Maps to RuleComponentDto */
export interface RuleComponent {
  sourceItemId: string;
  quantity: number;
}

/** Maps to RuleSourceMatchDto */
export interface RuleSourceMatch {
  sourceItemId: string;
  sourceVariantId: string;
  sourceSku: string;
  quantity: number;
}

/** Payload for API: sourceVariantId may be null for "surtido" (GROUP#...). */
export interface RuleSourceMatchPayload {
  sourceItemId: string;
  sourceVariantId: string | null;
  sourceSku: string;
  quantity: number;
}

/** Maps to VariantMappingDto */
export interface VariantMapping {
  targetVariantId: string;
  targetSku: string;
  sourceMatches: RuleSourceMatch[];
}

/** Maps to StockRuleDto. Optional fields match C# nullability. */
export interface StockRule {
  targetItemId: string;
  targetTitle: string;
  targetThumbnail?: string | null;
  targetSku: string;
  ruleType: RuleType;
  /** Optional. For PACK: "fixed" | "assorted". If null, mode inferred from Mappings. */
  packMode?: string | null;
  /** Optional. For PACK surtido: grouping key, e.g. "Size", "Code+Size". */
  packSurtidoGroupBy?: string | null;
  components: RuleComponent[];
  mappings: VariantMapping[];
  /** Hydrated data for UI (not part of DTO). */
  targetItem?: MeliItem;
  sourceItems?: MeliItem[];
}
