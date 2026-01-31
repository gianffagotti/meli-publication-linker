import axios from 'axios';
import type { IDataService } from './IDataService';
import type { MeliItem, StockRule } from '../models/types';

export class ApiDataService implements IDataService {
    async searchItems(query: string): Promise<MeliItem[]> {
        const response = await axios.get(`/api/meli-proxy/search`, { params: { q: query } });
        return Array.isArray(response.data) ? response.data : [];
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        const response = await axios.get(`/api/meli-proxy/items/${id}`);
        return response.data;
    }

    async getStockRules(): Promise<StockRule[]> {
        const response = await axios.get(`/api/rules`);
        return Array.isArray(response.data) ? response.data : [];
    }

    async getStockRule(targetItemId: string): Promise<StockRule | undefined> {
        const rules = await this.getStockRules();
        return rules.find(r => r.targetItemId === targetItemId);
    }

    async saveStockRule(rule: StockRule): Promise<void> {
        await axios.post(`/api/rules`, rule);
    }

    async deleteStockRule(targetItemId: string): Promise<void> {
        await axios.delete(`/api/rules/${targetItemId}`);
    }
}