import axios from 'axios';
import type { IDataService } from './IDataService';
import type { MeliItem, StockRuleGroup } from '../models/types';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export class ApiDataService implements IDataService {
    async searchItems(query: string): Promise<MeliItem[]> {
        const response = await axios.get(`${BASE_URL}/api/meli-proxy/search`, { params: { q: query } });
        return Array.isArray(response.data) ? response.data : [];
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        const response = await axios.get(`${BASE_URL}/api/meli-proxy/items/${id}`);
        return response.data;
    }

    async getStockRules(): Promise<StockRuleGroup[]> {
        const response = await axios.get(`${BASE_URL}/api/rules`);
        return Array.isArray(response.data) ? response.data : [];
    }

    async saveStockRule(rule: StockRuleGroup): Promise<void> {
        await axios.post(`${BASE_URL}/api/rules`, rule);
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await axios.delete(`${BASE_URL}/api/rules/${motherId}/${childId}`);
    }
}
