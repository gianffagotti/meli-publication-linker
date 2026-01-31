import type { MeliItem, StockRule } from '../models/types';

export interface IDataService {
    searchItems(query: string): Promise<MeliItem[]>;
    getItemDetails(id: string): Promise<MeliItem>;
    getStockRules(): Promise<StockRule[]>;
    getStockRule(targetItemId: string): Promise<StockRule | undefined>;
    saveStockRule(rule: StockRule): Promise<void>;
    deleteStockRule(targetItemId: string): Promise<void>;
}
