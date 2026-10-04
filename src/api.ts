import type { Experiment, Trace, TraceComparison, TraceListResponse, TraceState } from './types';

export const DEMO_KEY = 'fixture-workspace';
export const BROWSER_SESSION = 'browser-session:';
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}
interface Demo { traces: Trace[]; experiments: Experiment[]; comparisons: Record<string, TraceComparison> }
let demoPromise: Promise<Demo> | undefined;
function demo(): Promise<Demo> {
  return demoPromise ??= fetch('/demo.json').then(async response => {
    if (!response.ok) throw new ApiError('Demo data could not load. Refresh and try again.', response.status);
    return response.json() as Promise<Demo>;
  }).catch(error => { demoPromise = undefined; throw error; });
}
async function request<T>(path: string, key: string): Promise<T> {
  const browser = key.startsWith(BROWSER_SESSION);
  const response = await fetch(path, {
    credentials: browser ? 'same-origin' : 'omit', cache: 'no-store',
    headers: browser ? {} : { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}). Try refreshing.`;
    try { const body = await response.json(); if (typeof body.detail === 'string') message = body.detail; } catch { /* Non-JSON proxy response. */ }
    if (browser && response.status === 401) window.dispatchEvent(new Event('tracelab-session-expired'));
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}
export interface TraceFilters { state?: TraceState; hasError?: boolean; cursor?: string; workflow?: string }
export async function getTraces(key: string, filters: TraceFilters = {}): Promise<TraceListResponse> {
  if (key === DEMO_KEY) {
    const rows = (await demo()).traces.filter(trace => trace.workflow_name !== 'evaluation-experiment')
      .filter(trace => filters.state === undefined || trace.state === filters.state)
      .filter(trace => filters.hasError === undefined || trace.has_error === filters.hasError)
      .filter(trace => filters.workflow === undefined || trace.workflow_name === filters.workflow);
    const offset = Number(filters.cursor ?? 0);
    return { items: rows.slice(offset, offset + 50), next_cursor: rows.length > offset + 50 ? String(offset + 50) : null };
  }
  const search = new URLSearchParams({ limit: '50' });
  if (filters.state) search.set('state', filters.state);
  if (filters.hasError !== undefined) search.set('has_error', String(filters.hasError));
  if (filters.cursor) search.set('cursor', filters.cursor);
  if (filters.workflow) search.set('workflow_name', filters.workflow);
  return request(`/api/v1/traces?${search}`, key);
}
export async function getTrace(key: string, id: string): Promise<Trace> {
  if (key === DEMO_KEY) {
    const trace = (await demo()).traces.find(item => item.trace_id === id);
    if (!trace) throw new ApiError('This trace is not in the fixture workspace. Return to Runs.', 404);
    return trace;
  }
  return request(`/api/v1/traces/${encodeURIComponent(id)}`, key);
}
export async function getComparison(key: string, baseline: string, candidate: string): Promise<TraceComparison> {
  if (key === DEMO_KEY) {
    const result = (await demo()).comparisons[`${baseline}:${candidate}`];
    if (!result) throw new ApiError('Choose a matched baseline → fixed case from Evaluations. Custom comparisons are available in a connected project.', 400);
    return result;
  }
  return request(`/api/v1/comparisons?${new URLSearchParams({ baseline_trace_id: baseline, candidate_trace_id: candidate })}`, key);
}
export async function getExperiments(key: string): Promise<{ items: Experiment[] }> {
  return key === DEMO_KEY ? { items: (await demo()).experiments } : request('/api/v1/experiments', key);
}
