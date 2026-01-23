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

export interface StockRule {
  motherUserProductId: string;
  childUserProductId: string;
  type: 'FULL' | 'PACK';
  packQuantity: number;
  motherItemId: string;
  childItemId: string;
  active: boolean;
  childSku?: string;
  childTitle?: string;
}

export interface StockRuleGroup {
  motherItemId: string;
  rules: StockRule[];
  motherTitle?: string;
  motherThumbnail?: string;
}
