export interface MeliVariation {
  id: string | number;
  user_product_id: string;
  attribute_combinations: any[]; // Using any[] as per requirement "[]", but could be more specific if known
  sku: string;
}

export interface MeliItem {
  id: string;
  title: string;
  thumbnail: string;
  logistic_type: string;
  sku: string;
  price: number;
  variations: MeliVariation[];
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
  motherSku: string;
  rules: StockRule[];
  motherTitle?: string;
  motherThumbnail?: string;
}
