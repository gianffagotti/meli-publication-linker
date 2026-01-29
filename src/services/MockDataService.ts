import type { IDataService } from './IDataService';
import type { MeliItem, StockRule } from '../models/types';
import mockItems from '../mocks/mockItems.json';

// Initialize in-memory data from JSON files
const MOCK_ITEMS: MeliItem[] = mockItems as unknown as MeliItem[];

// Hardcoded new rules
const MOCK_RULES: StockRule[] = [
    {
        sellerId: "123",
        targetItemId: "MLA-BOXER-FULL",
        ruleType: "FULL",
        components: [
            { sourceItemId: "MLA-BOXER-FLEX", quantity: 1 }
        ],
        mappings: [
            {
                targetVariantId: "201",
                sourceMatches: { "MLA-BOXER-FLEX": "101" }
            },
            {
                targetVariantId: "202",
                sourceMatches: { "MLA-BOXER-FLEX": "102" }
            },
            {
                targetVariantId: "203",
                sourceMatches: { "MLA-BOXER-FLEX": "103" }
            }
        ]
    },
    {
        sellerId: "123",
        targetItemId: "MLA-BOXER-PACK3",
        ruleType: "PACK",
        components: [
            { sourceItemId: "MLA-BOXER-FLEX", quantity: 3 }
        ],
        mappings: [
            {
                targetVariantId: "301",
                sourceMatches: { "MLA-BOXER-FLEX": "101" }
            },
            {
                targetVariantId: "302",
                sourceMatches: { "MLA-BOXER-FLEX": "102" }
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
}
