import axios from 'axios';
import type { IDataService } from './IDataService';
import type { MeliItem, StockRuleGroup } from '../models/types';

export class ApiDataService implements IDataService {
    async searchItems(query: string): Promise<MeliItem[]> {
        const response = await axios.get(`/api/meli-proxy/search`, { params: { q: query } });
        return Array.isArray(response.data) ? response.data : [];
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        const response = await axios.get(`/api/meli-proxy/items/${id}`);
        return response.data;
    }

    async getStockRules(): Promise<StockRuleGroup[]> {
        const response = await axios.get(`/api/rules`);
        return Array.isArray(response.data) ? response.data : [];
    }

    async saveStockRule(rule: StockRuleGroup): Promise<void> {
        await axios.post(`/api/rules`, rule);
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await axios.delete(`/api/rules/${motherId}/${childId}`);
    }

    async deleteStockRuleGroup(motherItemId: string): Promise<void> {
        await axios.delete(`/api/rules/group/${motherItemId}`);
    }
}