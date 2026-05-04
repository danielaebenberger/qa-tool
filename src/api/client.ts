import {
  RunsResponseSchema,
  type RunsResponse,
} from '../core/contracts/RunSummary';
import {
  Failures24hResponseSchema,
  TopFailingResponseSchema,
  type Failures24hResponse,
  type TopFailingResponse,
} from '../core/contracts/Metrics';
import {
  DashboardOverviewSchema,
  type DashboardOverview,
} from '../core/contracts/Dashboard';
import {
  StabilityOverviewSchema,
  type StabilityOverview,
} from '../core/contracts/Stability';

const BASE = '/api';

async function apiFetch<T>(url: string, schema: { parse: (v: unknown) => T }): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText} (${url})`);
  }
  const json: unknown = await res.json();
  return schema.parse(json);
}

export function fetchRuns(projectId: number, days = 7): Promise<RunsResponse> {
  return apiFetch(
    `${BASE}/runs?projectId=${projectId}&days=${days}`,
    RunsResponseSchema
  );
}

export function fetchFailures24h(projectId: number): Promise<Failures24hResponse> {
  return apiFetch(
    `${BASE}/metrics/failures-24h?projectId=${projectId}`,
    Failures24hResponseSchema
  );
}

export function fetchTopFailing(
  projectId: number,
  limit = 10,
  days = 7
): Promise<TopFailingResponse> {
  return apiFetch(
    `${BASE}/metrics/top-failing?projectId=${projectId}&limit=${limit}&days=${days}`,
    TopFailingResponseSchema
  );
}

export interface DashboardQuery {
  projectId: number;
  days?: number;
  from?: string;
  to?: string;
  config?: string;
}

export function fetchDashboard(query: DashboardQuery): Promise<DashboardOverview> {
  const params = new URLSearchParams();
  params.set('projectId', String(query.projectId));
  if (query.days !== undefined) params.set('days', String(query.days));
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.config) params.set('config', query.config);
  return apiFetch(`${BASE}/dashboard?${params.toString()}`, DashboardOverviewSchema);
}

export interface StabilityQuery {
  projectId: number;
  days?: number;
  history?: number;
}

export function fetchStability(query: StabilityQuery): Promise<StabilityOverview> {
  const params = new URLSearchParams();
  params.set('projectId', String(query.projectId));
  if (query.days !== undefined) params.set('days', String(query.days));
  if (query.history !== undefined) params.set('history', String(query.history));
  return apiFetch(`${BASE}/stability?${params.toString()}`, StabilityOverviewSchema);
}
