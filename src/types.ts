export type TraceState = "running" | "completed" | "failed";
export type SpanStatus = "unset" | "ok" | "error";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  reasoning_tokens: number;
  total: number;
}

export interface Span {
  span_id: string;
  parent_span_id: string | null;
  sequence_number: number | null;
  name: string;
  kind: string;
  otel_kind: string;
  status: SpanStatus;
  attempt: number;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  input: unknown;
  output: unknown;
  attributes: Record<string, unknown>;
  resource: Record<string, unknown>;
  events: Array<Record<string, unknown>>;
  links: Array<Record<string, unknown>>;
  model_name: string | null;
  tool_name: string | null;
  tokens: TokenUsage | null;
  cost_usd: string | null;
  error_message: string | null;
}

export interface TraceSummary {
  trace_id: string;
  workflow_name: string;
  workflow_version: string | null;
  state: TraceState;
  service_names: string[];
  started_at: string | null;
  duration_ms: number | null;
  span_count: number;
  error_count: number;
  total_tokens: number;
  total_cost_usd: string;
  has_error: boolean;
  created_at: string;
  attributes: Record<string, unknown>;
}

export interface TraceListResponse {
  items: TraceSummary[];
  next_cursor: string | null;
}

export interface Trace extends TraceSummary {
  session_id: string | null;
  root_span_id: string | null;
  tags: string[];
  attributes: Record<string, unknown>;
  ended_at: string | null;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  reasoning_tokens: number;
  first_seen_at: string;
  last_seen_at: string;
  completed_at: string | null;
  spans: Span[];
}

export interface MetricDelta {
  baseline: string | null;
  candidate: string | null;
  absolute_delta: string | null;
  percent_delta: number | null;
}

export interface StepComparison {
  alignment_key: string;
  name: string;
  kind: string;
  change: "unchanged" | "changed" | "added" | "removed";
  differences: string[];
  baseline_span_id: string | null;
  candidate_span_id: string | null;
  baseline_status: SpanStatus | null;
  candidate_status: SpanStatus | null;
  baseline_duration_ms: number | null;
  candidate_duration_ms: number | null;
  baseline_tokens: number | null;
  candidate_tokens: number | null;
  baseline_cost_usd: string | null;
  candidate_cost_usd: string | null;
  baseline_input: unknown;
  candidate_input: unknown;
  baseline_output: unknown;
  candidate_output: unknown;
}

export interface EvaluationCheck {
  key: string;
  passed: boolean;
  score: number;
  reason: string;
  evidence_span_ids: string[];
}

export interface Evaluation {
  rubric_version: string;
  passed: boolean;
  score: number;
  checks: EvaluationCheck[];
  review_required: boolean;
  scope?: string;
}

export interface ExperimentCase {
  case_id: string;
  category: string;
  question: string;
  expected: string;
  actual: string;
  passed: boolean;
  score: number;
  trace_id: string | null;
  repeat: number;
  failed_checks: string[];
  duration_ms: number;
  exported: boolean;
}

export interface Experiment {
  experiment_id: string;
  name: string;
  variant: string;
  provider: string;
  model: string;
  data_kind: string;
  dataset_version: string;
  dataset_sha256: string;
  rubric_version: string;
  started_at: string;
  total: number;
  passed: number;
  pass_rate: number;
  confidence_interval: [number, number];
  repetitions: number;
  dimensions: Record<string, { passed: number; total: number }>;
  cases: ExperimentCase[];
  judge: string;
  limitations: string;
}

export interface TraceComparison {
  baseline: TraceSummary;
  candidate: TraceSummary;
  duration: MetricDelta;
  tokens: MetricDelta;
  cost: MetricDelta;
  errors: MetricDelta;
  has_regression: boolean;
  steps: StepComparison[];
}
