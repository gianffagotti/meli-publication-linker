import type {
    MeliItem,
    StockRule,
    SkuValidationResult,
    DashboardLogEntry,
    DiscoverFullRulesStartResult,
    DiscoverFullRulesStatus,
    DiscoverFullRulesCancelResult
} from '../models/types';

export interface IDataService {
    searchItems(query: string): Promise<MeliItem[]>;
    getItemDetails(id: string): Promise<MeliItem>;
    getStockRules(): Promise<StockRule[]>;
    getStockRule(targetItemId: string): Promise<StockRule | undefined>;
    saveStockRule(rule: StockRule): Promise<void>;
    deleteStockRule(targetItemId: string): Promise<void>;
    /** Validate SKUs in Znube (for FULL rule editor). Returns exists per SKU. */
    validateSkusInZnube(skus: string[]): Promise<SkuValidationResult[]>;
    /** Dashboard logs for a date (yyyy-MM-dd), optional severity/category. */
    getDashboardLogs(date: string, severity?: string, category?: string, signal?: AbortSignal): Promise<DashboardLogEntry[]>;
    /** Mark a log entry as read. */
    markDashboardLogRead(partitionKey: string, rowKey: string): Promise<void>;
    /** Run Full Rule Discovery job. */
    runDiscoverFullRules(): Promise<DiscoverFullRulesStartResult>;
    /** Status of Full Rule Discovery job. */
    getDiscoverFullRulesStatus(signal?: AbortSignal): Promise<DiscoverFullRulesStatus>;
    /** Cancel a running Full Rule Discovery job. */
    cancelDiscoverFullRules(runId?: string): Promise<DiscoverFullRulesCancelResult>;
}
