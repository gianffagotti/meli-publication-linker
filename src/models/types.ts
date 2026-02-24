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
  /** Convenience: fulfillment | self_service. Use shipping.logistic_type when available. */
  logisticsType?: string;
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

/** Strategy per variant mapping. Explicit = use sourceMatches; DynamicSize = pool by matchSize. */
export type MappingStrategy = 'EXPLICIT' | 'DYNAMIC_SIZE';

/**
 * Variant mapping: one target variant → strategy + source config.
 * API: targetVariantId, targetSku, packQuantity?, strategy, matchSize?, sourceMatches[].
 */
export interface VariantMapping {
  targetVariantId: string;
  targetSku: string;
  /** Optional per-variant pack size override. Sent as packQuantity. */
  customPackQuantity?: number;
  /** Strategy: EXPLICIT (use sourceMatches) or DYNAMIC_SIZE (pool by matchSize). */
  strategy: MappingStrategy;
  /** Used when strategy === 'EXPLICIT'. One = Simple Pack, multiple = manual assorted. */
  sourceMatches: RuleSourceMatch[];
  /** Used when strategy === 'DYNAMIC_SIZE'. e.g. "M", "L", "42". */
  matchSize?: string;
}

/** Form state for Rule Editor (includes defaultPackQuantity and mappings). */
export interface RuleFormData {
  targetMla: string;
  ruleType: RuleType;
  defaultPackQuantity?: number;
  mappings: VariantMapping[];
}

/** Maps to StockRuleDto. No packMode / packSurtidoGroupBy (Spec V2). */
export interface StockRule {
  targetItemId: string;
  targetTitle: string;
  targetThumbnail?: string | null;
  targetSku: string;
  ruleType: RuleType;
  /** FULL: true if one or more variant SKUs were not found in Znube at save time. */
  isIncomplete?: boolean;
  /** PACK/COMBO: default pack size. Spec V2. */
  defaultPackQuantity: number;
  components: RuleComponent[];
  mappings: VariantMapping[];
  /** Hydrated data for UI (not part of DTO). */
  targetItem?: MeliItem;
  sourceItems?: MeliItem[];
}

/** Result of Znube SKU validation (POST /api/znube/validate-skus). */
export interface SkuValidationResult {
  sku: string;
  exists: boolean;
}

/** Dashboard log entry (GET /api/dashboard/logs). */
export interface DashboardLogEntry {
  partitionKey: string;
  rowKey: string;
  severity: string;
  category: string;
  message: string;
  details?: string | null;
  entityIds: string[];
  isRead: boolean;
  timestamp?: string | null;
}

/** Response of POST /api/jobs/discover-full-rules. */
export interface DiscoverFullRulesResult {
  processed: number;
  created: number;
  incomplete: number;
  message?: string;
}
