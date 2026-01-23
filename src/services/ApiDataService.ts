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
        const data = response.data;

        // Check if data is already grouped (PascalCase 'Rules')
        if (Array.isArray(data) && data.length > 0 && 'Rules' in data[0]) {
            return data.map((g: any) => ({
                motherItemId: g.MotherItemId || g.motherItemId,
                motherTitle: g.MotherTitle || g.motherTitle,
                motherThumbnail: g.MotherThumbnail || g.motherThumbnail,
                rules: (g.Rules || []).map((r: any) => ({
                    ...r,
                    motherItemId: r.MotherItemId || r.motherItemId,
                    childItemId: r.ChildItemId || r.childItemId,
                    type: r.Type || r.type,
                    packQuantity: r.PackQuantity || r.packQuantity,
                    childUserProductId: r.ChildUserProductId || r.childUserProductId,
                    motherUserProductId: r.MotherUserProductId || r.motherUserProductId,
                    active: r.Active !== undefined ? r.Active : r.active
                }))
            }));
        }

        // Check if data is a flat array of rules (heuristic: check if first item has 'motherItemId' but no 'rules')
        if (Array.isArray(data) && data.length > 0 && !('rules' in data[0])) {
            // Group by motherItemId
            const groupsMap = new Map<string, StockRuleGroup>();

            for (const item of data) {
                // item is effectively a StockRule + potential extra fields
                const rule = item as any;
                const motherId = rule.motherItemId || rule.MotherItemId;

                if (!motherId) continue;

                if (!groupsMap.has(motherId)) {
                    groupsMap.set(motherId, {
                        motherItemId: motherId,
                        motherTitle: rule.motherTitle || rule.MotherTitle,
                        motherThumbnail: rule.motherThumbnail || rule.MotherThumbnail,
                        rules: []
                    });
                }

                groupsMap.get(motherId)!.rules.push(rule);
            }

            return Array.from(groupsMap.values());
        }

        return data;
    }

    async saveStockRule(rule: StockRuleGroup): Promise<void> {
        await axios.post(`${BASE_URL}/api/rules`, rule);
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await axios.delete(`${BASE_URL}/api/rules/${motherId}/${childId}`);
    }
}
