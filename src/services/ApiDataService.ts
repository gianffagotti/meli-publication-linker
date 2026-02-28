import axios from 'axios';
import type { IDataService } from './IDataService';
import type {
    MeliItem,
    StockRule,
    SkuValidationResult,
    DashboardLogEntry,
    DiscoverFullRulesStartResult,
    DiscoverFullRulesStatus,
    DiscoverFullRulesCancelResult
} from '../models/types';

/** Normalizes API response (PascalCase or camelCase) to DashboardLogEntry. */
function normalizeDashboardLogEntry(raw: Record<string, unknown>): DashboardLogEntry {
    const pk = raw.partitionKey ?? raw.PartitionKey ?? '';
    const rk = raw.rowKey ?? raw.RowKey ?? '';
    const entIds = raw.entityIds ?? raw.EntityIds;
    return {
        partitionKey: String(pk),
        rowKey: String(rk),
        severity: String(raw.severity ?? raw.Severity ?? 'Info'),
        category: String(raw.category ?? raw.Category ?? ''),
        message: String(raw.message ?? raw.Message ?? ''),
        details: String(raw.details ?? raw.Details ?? null),
        entityIds: Array.isArray(entIds) ? entIds.map(String) : [],
        isRead: Boolean(raw.isRead ?? raw.IsRead),
        timestamp: String(raw.timestamp ?? raw.Timestamp ?? null),
    };
}

function normalizeDiscoverStart(raw: Record<string, unknown>): DiscoverFullRulesStartResult {
    return {
        runId: String(raw.runId ?? raw.RunId ?? ''),
        status: String(raw.status ?? raw.Status ?? 'running'),
        mode: String(raw.mode ?? raw.Mode ?? 'manual'),
        statusUrl: String(raw.statusUrl ?? raw.StatusUrl ?? '/api/jobs/discover-full-rules/status'),
    };
}

function normalizeDiscoverResult(raw: Record<string, unknown>): {
    runId?: string | null;
    mode?: string | null;
    status: string;
    processed: number;
    created: number;
    incomplete: number;
    startedAt?: string | null;
    completedAt?: string | null;
    message?: string | null;
} {
    return {
        runId: (raw.runId ?? raw.RunId ?? null) as string | null,
        mode: (raw.mode ?? raw.Mode ?? null) as string | null,
        status: String(raw.status ?? raw.Status ?? ''),
        processed: Number(raw.processed ?? raw.Processed ?? 0),
        created: Number(raw.created ?? raw.Created ?? 0),
        incomplete: Number(raw.incomplete ?? raw.Incomplete ?? 0),
        startedAt: (raw.startedAt ?? raw.StartedAt ?? null) as string | null,
        completedAt: (raw.completedAt ?? raw.CompletedAt ?? null) as string | null,
        message: (raw.message ?? raw.Message ?? null) as string | null,
    };
}

function normalizeDiscoverStatus(raw: Record<string, unknown>): DiscoverFullRulesStatus {
    const last = raw.lastResult ?? raw.LastResult;
    return {
        isRunning: Boolean(raw.isRunning ?? raw.IsRunning),
        runId: (raw.runId ?? raw.RunId ?? null) as string | null,
        mode: (raw.mode ?? raw.Mode ?? null) as string | null,
        status: (raw.status ?? raw.Status ?? null) as string | null,
        startedAt: (raw.startedAt ?? raw.StartedAt ?? null) as string | null,
        updatedAt: (raw.updatedAt ?? raw.UpdatedAt ?? null) as string | null,
        lastResult: last && typeof last === 'object'
            ? normalizeDiscoverResult(last as Record<string, unknown>)
            : null,
    };
}

function normalizeDiscoverCancel(raw: Record<string, unknown>): DiscoverFullRulesCancelResult {
    return {
        cancelled: Boolean(raw.cancelled ?? raw.Cancelled),
        runId: (raw.runId ?? raw.RunId ?? null) as string | null,
        message: (raw.message ?? raw.Message ?? null) as string | null,
    };
}

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

    async getDashboardLogs(date: string, severity?: string, category?: string, signal?: AbortSignal): Promise<DashboardLogEntry[]> {
        const params: Record<string, string> = { date };
        if (severity) params.severity = severity;
        if (category) params.category = category;
        const response = await axios.get<Record<string, unknown>[]>(`/api/dashboard/logs`, { params, signal });
        const raw = Array.isArray(response.data) ? response.data : [];
        return raw.map(normalizeDashboardLogEntry);
    }

    async markDashboardLogRead(partitionKey: string, rowKey: string): Promise<void> {
        await axios.patch(
            `/api/dashboard/logs/${encodeURIComponent(partitionKey)}/${encodeURIComponent(rowKey)}/read`
        );
    }

    async runDiscoverFullRules(): Promise<DiscoverFullRulesStartResult> {
        const response = await axios.post<Record<string, unknown>>(`/api/jobs/discover-full-rules`);
        return normalizeDiscoverStart(response.data ?? {});
    }

    async getDiscoverFullRulesStatus(signal?: AbortSignal): Promise<DiscoverFullRulesStatus> {
        const response = await axios.get<Record<string, unknown>>(`/api/jobs/discover-full-rules/status`, { signal });
        return normalizeDiscoverStatus(response.data ?? {});
    }

    async cancelDiscoverFullRules(runId?: string): Promise<DiscoverFullRulesCancelResult> {
        const params: Record<string, string> = {};
        if (runId) params.runId = runId;
        const response = await axios.post<Record<string, unknown>>(`/api/jobs/discover-full-rules/cancel`, null, { params });
        return normalizeDiscoverCancel(response.data ?? {});
    }
}