import type { IDataService } from './IDataService';
import type { MeliItem, StockRuleGroup } from '../models/types';

const MOCK_ITEMS: MeliItem[] = [
    {
        id: 'MLA123456789',
        title: 'Camiseta de Algodón Premium',
        thumbnail: 'http://http2.mlstatic.com/D_812345-MLA123456789_012023-I.jpg',
        logistic_type: 'fulfillment',
        sku: 'TSHIRT-001',
        price: 1500,
        variations: [
            {
                id: '12345678901',
                user_product_id: 'UPID-1',
                attribute_combinations: [],
                sku: 'TSHIRT-001-S'
            },
            {
                id: '12345678902',
                user_product_id: 'UPID-2',
                attribute_combinations: [],
                sku: 'TSHIRT-001-M'
            }
        ]
    },
    {
        id: 'MLA987654321',
        title: 'Pack x3 Calcetines Deportivos',
        thumbnail: 'http://http2.mlstatic.com/D_987654-MLA987654321_012023-I.jpg',
        logistic_type: 'cross_docking',
        sku: 'SOCKS-PACK-3',
        price: 3000,
        variations: []
    }
];

const MOCK_RULES: StockRuleGroup[] = [
    {
        motherItemId: 'MLA123456789',
        motherSku: 'TSHIRT-001',
        rules: [
            {
                motherUserProductId: 'UPID-1',
                childUserProductId: 'UPID-CHILD-1',
                type: 'PACK',
                packQuantity: 1,
                motherItemId: 'MLA123456789',
                childItemId: 'MLA987654321',
                active: true
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
        return MOCK_ITEMS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.sku.toLowerCase().includes(query.toLowerCase())
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
            MOCK_RULES[index] = rule;
        } else {
            MOCK_RULES.push(rule);
        }
    }

    async deleteStockRule(motherId: string, childId: string): Promise<void> {
        await this.delay(500);
        const group = MOCK_RULES.find(r => r.motherItemId === motherId);
        if (group) {
            group.rules = group.rules.filter(r => r.childItemId !== childId);
        }
    }
}
