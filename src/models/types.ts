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

export interface RuleComponent {
  sourceItemId: string; // The component (Ingredient)
  quantity: number;
}


export interface RuleSourceMatch {
  sourceItemId: string;
  sourceVariantId: string;
  sourceSku: string;
}

export interface VariantMapping {
  targetVariantId: string;
  targetSku: string;
  sourceMatches: RuleSourceMatch[];
}

export interface StockRule {
  sellerId?: string;
  targetItemId: string; // The Combo/Pack Item ID
  targetTitle: string;
  targetThumbnail: string;
  targetSku: string;
  ruleType: RuleType;
  components: RuleComponent[];
  mappings: VariantMapping[];
  // Hydrated Data (Optional, for UI display)
  targetItem?: MeliItem;
  sourceItems?: MeliItem[];
}
