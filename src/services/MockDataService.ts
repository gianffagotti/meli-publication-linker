import type { IDataService } from './IDataService';
import type { MeliItem, StockRuleGroup } from '../models/types';
import mockItems from '../mocks/mockItems.json';
import mockRules from '../mocks/mockRules.json';

// Initialize in-memory data from JSON files
const MOCK_ITEMS: MeliItem[] = mockItems as MeliItem[];
const MOCK_RULES: StockRuleGroup[] = [...mockRules] as StockRuleGroup[];

export class MockDataService implements IDataService {
    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchItems(query: string): Promise<MeliItem[]> {
        await this.delay(500);
        if (!query) return MOCK_ITEMS;
        const lowerQuery = query.toLowerCase();
        return MOCK_ITEMS.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.sku.toLowerCase().includes(lowerQuery)
        );
    }

    async getItemDetails(id: string): Promise<MeliItem> {
        await this.delay(500);
        const item = MOCK_ITEMS.find(i => i.id === id);
        if (!item) throw new Error('Item not found');
        return item;
    }

    async getStockRules(): Promise<StockRuleGroup[]> {
        await this.delay(500);
        return [...MOCK_RULES];
    }

    async saveStockRule(rule: StockRuleGroup): Promise<void> {
        await this.delay(500);
        const index = MOCK_RULES.findIndex(r => r.motherItemId === rule.motherItemId);
        if (index >= 0) {
            // Update existing group
            MOCK_RULES[index] = rule;
        } else {
            // Add new group
            MOCK_RULES.push(rule);
        }
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await this.delay(500);
        const groupIndex = MOCK_RULES.findIndex(r => r.motherItemId === motherId);

        if (groupIndex >= 0) {
            const group = MOCK_RULES[groupIndex];
            // Filter out the rule for the specific child item
            group.rules = group.rules.filter(r => r.childItemId !== childId);

            // If no rules left in the group, we might want to remove the group itself, 
            // or keep it empty. For now, let's keep it as is or remove if empty?
            // Requirement says "Remove the specific rule", so filtering is correct.
            // If the group becomes empty, it's fine to leave it or remove it.
            // Let's remove the group if it has no rules left to keep it clean.
            if (group.rules.length === 0) {
                MOCK_RULES.splice(groupIndex, 1);
            }
        }
    }
}
