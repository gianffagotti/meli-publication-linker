import type { MeliItem, StockRuleGroup } from '../models/types';

export interface IDataService {
    searchItems(query: string): Promise<MeliItem[]>;
    getItemDetails(id: string): Promise<MeliItem>;
    getStockRules(): Promise<StockRuleGroup[]>;
    saveStockRule(rule: StockRuleGroup): Promise<void>;
    deleteStockRule(motherId: string, childId: string): Promise<void>;
    deleteStockRuleGroup(motherId: string): Promise<void>;
}
