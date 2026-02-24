import axios from 'axios';
import type { IDataService } from './IDataService';
import type { MeliItem, StockRule, SkuValidationResult, DashboardLogEntry, DiscoverFullRulesResult } from '../models/types';

export class ApiDataService implements IDataService {
    async searchItems(query: string): Promise<MeliItem[]> {
        const response = await axios.get(`/api/meli-proxy/search`, { params: { q: query } });
        return Array.isArray(response.data) ? response.data : [];
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        const response = await axios.get(`/api/meli-proxy/items/${id}`);
        return response.data;
    }

    /** GET rules — matches [Route("rules")] */
    async getStockRules(): Promise<StockRule[]> {
        const response = await axios.get<StockRule[]>(`/api/rules`);
        return Array.isArray(response.data) ? response.data : [];
    }

    /** GET rules/{targetItemId} — matches [Route("rules/{targetItemId}")] */
    async getStockRule(targetItemId: string): Promise<StockRule | undefined> {
        try {
            const response = await axios.get<StockRule>(`/api/rules/${encodeURIComponent(targetItemId)}`);
            return response.data;
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                return undefined;
            }
            throw err;
        }
    }

    async saveStockRule(rule: StockRule): Promise<void> {
        await axios.post(`/api/rules`, rule);
    }

    async deleteStockRule(targetItemId: string): Promise<void> {
        await axios.delete(`/api/rules/${targetItemId}`);
    }

    async validateSkusInZnube(skus: string[]): Promise<SkuValidationResult[]> {
        if (!skus.length) return [];
        const response = await axios.post<{ results: SkuValidationResult[] }>(`/api/znube/validate-skus`, { skus });
        return response.data?.results ?? [];
    }

    async getDashboardLogs(date: string, severity?: string, category?: string): Promise<DashboardLogEntry[]> {
        const params: Record<string, string> = { date };
        if (severity) params.severity = severity;
        if (category) params.category = category;
        const response = await axios.get<DashboardLogEntry[]>(`/api/dashboard/logs`, { params });
        return Array.isArray(response.data) ? response.data : [];
    }

    async markDashboardLogRead(partitionKey: string, rowKey: string): Promise<void> {
        await axios.patch(
            `/api/dashboard/logs/${encodeURIComponent(partitionKey)}/${encodeURIComponent(rowKey)}/read`
        );
    }

    async runDiscoverFullRules(): Promise<DiscoverFullRulesResult> {
        const response = await axios.post<DiscoverFullRulesResult>(`/api/jobs/discover-full-rules`);
        return response.data;
    }
}