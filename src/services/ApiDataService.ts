import axios from 'axios';
import type { IDataService } from './IDataService';
import type { MeliItem, StockRuleGroup } from '../models/types';

const BASE_URL = 'http://localhost:7171';

export class ApiDataService implements IDataService {
    async searchItems(query: string): Promise<MeliItem[]> {
        const response = await axios.get(`${BASE_URL}/api/meli-proxy/items`, { params: { q: query } });
        return response.data;
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        const response = await axios.get(`${BASE_URL}/api/meli-proxy/items/${id}`);
        return response.data;
    }

    async getStockRules(): Promise<StockRuleGroup[]> {
        const response = await axios.get(`${BASE_URL}/api/rules`);
        return response.data;
    }

    async saveStockRule(rule: StockRuleGroup): Promise<void> {
        await axios.post(`${BASE_URL}/api/rules`, rule);
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await axios.delete(`${BASE_URL}/api/rules/${motherId}/${childId}`);
    }
}
