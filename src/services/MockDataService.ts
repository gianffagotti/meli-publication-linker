import type { IDataService } from './IDataService';
import type { MeliItem, StockRule } from '../models/types';
import mockItems from '../mocks/mockItems.json';

// Initialize in-memory data from JSON files
const MOCK_ITEMS: MeliItem[] = mockItems as unknown as MeliItem[];

// Hardcoded new rules
const MOCK_RULES: StockRule[] = [
    {
        targetItemId: "MLA-BOXER-FULL",
        targetTitle: "Boxer Full Example",
        targetThumbnail: "http://http2.mlstatic.com/D_812345-MLA123456789_122020-O.jpg",
        targetSku: "BOXER-FULL-001",
        ruleType: "FULL",
        defaultPackQuantity: 1,
        components: [
            { sourceItemId: "MLA-BOXER-FLEX", quantity: 1 }
        ],
        mappings: [
            {
                targetVariantId: "201",
                targetSku: "VAR-FULL-201",
                strategy: "EXPLICIT",
                sourceMatches: [{
                    sourceItemId: "MLA-BOXER-FLEX",
                    sourceVariantId: "101",
                    sourceSku: "VAR-FLEX-101",
                    quantity: 1
                }]
            },
            {
                targetVariantId: "202",
                targetSku: "VAR-FULL-202",
                strategy: "EXPLICIT",
                sourceMatches: [{
                    sourceItemId: "MLA-BOXER-FLEX",
                    sourceVariantId: "102",
                    sourceSku: "VAR-FLEX-102",
                    quantity: 1
                }]
            },
            {
                targetVariantId: "203",
                targetSku: "VAR-FULL-203",
                strategy: "EXPLICIT",
                sourceMatches: [{
                    sourceItemId: "MLA-BOXER-FLEX",
                    sourceVariantId: "103",
                    sourceSku: "VAR-FLEX-103",
                    quantity: 1
                }]
            }
        ]
    },
    {
        targetItemId: "MLA-BOXER-PACK3",
        targetTitle: "Boxer Pack x3 Example",
        targetThumbnail: "http://http2.mlstatic.com/D_812345-MLA123456789_122020-O.jpg",
        targetSku: "BOXER-PACK-003",
        ruleType: "PACK",
        defaultPackQuantity: 3,
        components: [
            { sourceItemId: "MLA-BOXER-FLEX", quantity: 3 }
        ],
        mappings: [
            {
                targetVariantId: "301",
                targetSku: "VAR-PACK-301",
                strategy: "EXPLICIT",
                sourceMatches: [{
                    sourceItemId: "MLA-BOXER-FLEX",
                    sourceVariantId: "101",
                    sourceSku: "VAR-FLEX-101",
                    quantity: 3
                }]
            },
            {
                targetVariantId: "302",
                targetSku: "VAR-PACK-302",
                strategy: "EXPLICIT",
                sourceMatches: [{
                    sourceItemId: "MLA-BOXER-FLEX",
                    sourceVariantId: "102",
                    sourceSku: "VAR-FLEX-102",
                    quantity: 3
                }]
            }
        ]
    }
];

export class MockDataService implements IDataService {
    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchItems(query: string): Promise<MeliItem[]> {
        await this.delay(500);
        if (!query) return MOCK_ITEMS;
        const lowerQuery = query.toLowerCase();
        return MOCK_ITEMS.filter(item =>
            (item.title?.toLowerCase().includes(lowerQuery) ?? false)
        );
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        await this.delay(500);
        const item = MOCK_ITEMS.find(i => i.id === id);
        if (!item) throw new Error('Item not found');
        return item;
    }

    async getStockRules(): Promise<StockRule[]> {
        await this.delay(500);
        return MOCK_RULES.map(rule => {
            const targetItem = MOCK_ITEMS.find(i => i.id === rule.targetItemId);
            const sourceItems = rule.components.map(c => MOCK_ITEMS.find(i => i.id === c.sourceItemId)).filter((i): i is MeliItem => !!i);
            return {
                ...rule,
                targetItem,
                sourceItems
            };
        });
    }

    async getStockRule(targetItemId: string): Promise<StockRule | undefined> {
        await this.delay(500);
        const rules = await this.getStockRules();
        return rules.find(r => r.targetItemId === targetItemId);
    }

    async saveStockRule(rule: StockRule): Promise<void> {
        await this.delay(500);
        const index = MOCK_RULES.findIndex(r => r.targetItemId === rule.targetItemId);
        if (index >= 0) {
            // Update existing rule
            MOCK_RULES[index] = rule;
        } else {
            // Add new rule
            MOCK_RULES.push(rule);
        }
    }

    async deleteStockRule(targetItemId: string): Promise<void> {
        await this.delay(500);
        const index = MOCK_RULES.findIndex(r => r.targetItemId === targetItemId);
        if (index >= 0) {
            MOCK_RULES.splice(index, 1);
        }
    }

    async validateSkusInZnube(skus: string[]): Promise<import('../models/types').SkuValidationResult[]> {
        await this.delay(300);
        return skus.map(sku => ({ sku: sku.trim(), exists: true }));
    }

    async getDashboardLogs(_date: string, _severity?: string, _category?: string, _signal?: AbortSignal): Promise<import('../models/types').DashboardLogEntry[]> {
        await this.delay(400);
        return [];
    }

    async markDashboardLogRead(_partitionKey: string, _rowKey: string): Promise<void> {
        await this.delay(200);
    }

    async runDiscoverFullRules(): Promise<import('../models/types').DiscoverFullRulesResult> {
        await this.delay(1500);
        return { processed: 0, created: 0, incomplete: 0, message: 'Discovery completed (mock).' };
    }
}
