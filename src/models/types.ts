export interface MeliVariation {
  id: number;
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

export interface VariantMapping {
  targetVariantId: string;
  // Key: SourceItemId, Value: SourceVariantId
  sourceMatches: { [sourceItemId: string]: string };
}

export interface StockRule {
  sellerId?: string;
  targetItemId: string; // The Combo/Pack Item ID
  ruleType: RuleType;
  components: RuleComponent[];
  mappings: VariantMapping[];
  // Hydrated Data (Optional, for UI display)
  targetItem?: MeliItem;
  sourceItems?: MeliItem[];
}
