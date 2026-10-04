import type { Evaluation, Span, Trace, TraceSummary } from './types';
export const words = (value: string) => value.replaceAll('_', ' ').replaceAll('-', ' ');
export const decisionLabel = (value: unknown) => ({ refund_eligible: 'Refund eligible', refund_denied: 'Refund declined', shipping_status: 'Shipment located', cancel_eligible: 'Cancellation draft', cancel_denied: 'Cancellation declined', policy_answer: 'Policy answered', escalate: 'Human handoff' }[String(value)] ?? 'Agent run');
export function outcome(trace: Trace) {
  const root = trace.spans.find(span => span.span_id === trace.root_span_id) ?? trace.spans[0];
  const value = root?.output as { answer?: string; evaluation?: Evaluation; resolution?: Record<string, unknown> } | null;
  const evaluator = trace.spans.find(span => span.kind === 'evaluator')?.output as Evaluation | undefined;
  return { answer: value?.answer, evaluation: value?.evaluation ?? evaluator, resolution: value?.resolution, input: root?.input };
}
export function tracePassed(trace: TraceSummary): boolean | undefined {
  return typeof trace.attributes.evaluation_passed === 'boolean' ? trace.attributes.evaluation_passed : undefined;
}
export function flattenSpans(spans: Span[]): Array<{ span: Span; depth: number }> {
  const byId = new Map(spans.map(span => [span.span_id, span]));
  const children = new Map<string, Span[]>();
  for (const span of spans) {
    const parent = span.parent_span_id && byId.has(span.parent_span_id) ? span.parent_span_id : '';
    children.set(parent, [...(children.get(parent) ?? []), span]);
  }
  const result: Array<{ span: Span; depth: number }> = [];
  const visited = new Set<string>();
  const visit = (root: Span) => {
    const stack = [{ span: root, depth: 0 }];
    while (stack.length) {
      const node = stack.pop()!;
      if (visited.has(node.span.span_id)) continue;
      visited.add(node.span.span_id); result.push(node);
      stack.push(...(children.get(node.span.span_id) ?? []).map(span => ({ span, depth: node.depth + 1 })).reverse());
    }
  };
  (children.get('') ?? []).forEach(visit);
  spans.filter(span => !visited.has(span.span_id)).forEach(visit);
  return result;
}
export function outputText(value: unknown): string {
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    if (typeof object.answer === 'string') return object.answer;
    if (Array.isArray(object.checks)) return object.checks.map(check =>
      `${check.passed ? 'PASS' : 'FAIL'}  ${words(check.key)}\n${check.reason}`).join('\n\n');
    if (typeof object.text === 'string' && object.text) {
      try { const parsed = JSON.parse(object.text); if (parsed.answer) return parsed.answer; } catch { /* Plain model response. */ }
      return object.text;
    }
  }
  return JSON.stringify(value, null, 2) ?? 'No data recorded';
}
