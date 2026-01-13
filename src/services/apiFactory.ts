import type { IDataService } from './IDataService';
import { MockDataService } from './MockDataService';
import { ApiDataService } from './ApiDataService';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const dataService: IDataService = useMock ? new MockDataService() : new ApiDataService();
