import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, BROWSER_SESSION, DEMO_KEY, getComparison, getExperiments, getTrace, getTraces } from './api';
import { getAccount, getProviders, logout, type Account } from './auth';
import { Credentials } from './Credentials';
import { Icon, Mark } from './components/Icon';
import { formatCost, formatDate, formatDuration } from './format';
import { decisionLabel, flattenSpans, outcome, outputText, tracePassed, words } from './view';
import type { Evaluation, Experiment, MetricDelta, Span, StepComparison, TraceSummary } from './types';

const SESSION_KEY = 'tracelab-project-key';
function ButtonIcon({ name, label, onClick, disabled = false }: { name: string; label: string; onClick: () => void; disabled?: boolean }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick} disabled={disabled}><Icon name={name} /></button>;
}
function Status({ passed, label }: { passed?: boolean; label?: string }) {
  return <span className={`status ${passed === true ? 'passed' : passed === false ? 'failed' : 'neutral'}`}><Icon name={passed === false ? 'close' : passed === true ? 'check' : 'clock'} size={13} />{label ?? (passed === true ? 'Checks passed' : passed === false ? 'Needs review' : 'Not evaluated')}</span>;
}
function ErrorMessage({ error, retry }: { error: unknown; retry?: () => void }) {
  return <div className="error-state" role="alert"><Icon name="info" /><div><strong>Could not load this view</strong><p>{error instanceof ApiError ? error.message : 'Check your connection and try again.'}</p>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div></div>;
}
function Loading() { return <div className="loading-state" role="status"><span className="loading-line" />Loading workspace…</div>; }

function Connect({ connect }: { connect: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const providers = useQuery({ queryKey: ['providers'], queryFn: getProviders, retry: false });
  const failedLogin = new URLSearchParams(window.location.search).has('auth_error');
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError('');
    try { await getTraces(key.trim()); connect(key.trim()); } catch (exc) { setError(exc instanceof Error ? exc.message : 'Could not connect.'); }
    finally { setPending(false); }
  }
  return <main className="connect-page">
    <section className="connect-story">
      <a href="/" className="brand"><Mark /><span>TraceLab</span></a>
      <div className="connect-intro"><h1>The answer is only<br />half the story.</h1><p>Follow an agent’s decisions, inspect the evidence, and find out whether your fix actually worked.</p>
        <div className="intro-trace" aria-label="An example debugging path">
          {['Customer request', 'Policy + order lookup', 'Resolution', 'Evidence-based evaluation'].map((label, index) => <div key={label}><span className="intro-node">{index === 3 ? <Icon name="check" size={16} /> : <Icon name={index === 0 ? 'branch' : index === 1 ? 'tool' : 'model'} size={16} />}</span><span>{label}</span>{index === 2 && <small>Inspect what changed</small>}</div>)}
        </div>
      </div>
      <p className="connect-foot">A focused workspace for agent debugging.</p>
    </section>
    <section className="connect-workspace"><div className="connect-form"><div className="connection-icon"><Icon name="key" size={24} /></div><h2>Open your workspace</h2><p>Sign in to create credentials and connect your agent.</p>
      <div className="oauth-buttons">{(['google', 'github'] as const).map(provider => <button className="secondary-button oauth-button" key={provider} disabled={!providers.data?.[provider]} onClick={() => window.location.assign(`/api/v1/auth/${provider}/login`)}><Icon name={provider} size={20} />Continue with {provider === 'google' ? 'Google' : 'GitHub'}<Icon name="arrow" size={16} /></button>)}</div>
      {failedLogin && <p className="form-error" role="alert">Sign-in could not be completed. Try again with Google or GitHub.</p>}
      {providers.isLoading ? <p className="oauth-note" role="status">Checking sign-in availability…</p> : providers.error ? <p className="oauth-note" role="alert">Sign-in could not load. <button className="text-button" onClick={() => void providers.refetch()}>Try again</button></p> : !providers.data?.google && !providers.data?.github ? <p className="oauth-note">Sign-in is unavailable on this deployment. Explore the demo or connect an existing project.</p> : <p className="oauth-note">A private project is created for your account on first sign-in.</p>}
      <div className="form-divider"><span>or use an existing project key</span></div>
      <form onSubmit={submit}><label htmlFor="project-key">Project API key</label><input id="project-key" type="password" autoComplete="off" placeholder="tlk_…" value={key} onChange={event => setKey(event.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={pending || !key.trim()}>{pending ? 'Connecting…' : 'Connect project'}<Icon name="arrow" size={16} /></button></form>
      <div className="form-divider"><span>or inspect a sample project</span></div>
      <button className="secondary-button demo-button" onClick={() => connect(DEMO_KEY)}>Explore the demo<Icon name="arrow" size={16} /></button>
      <p className="demo-disclosure">19 scenarios. Real SDK traces. Scripted fixtures.</p>
      <p className="connection-note">An entered project key is kept in memory until you leave or refresh. Model-provider keys stay on the agent’s machine.</p><a href="/docs" className="text-button">SDK setup guide<Icon name="arrow" size={14} /></a>
    </div></section>
  </main>;
}

function Sidebar({ apiKey, disconnect, account }: { apiKey: string; disconnect: () => void; account?: Account | null }) {
  const demo = apiKey === DEMO_KEY;
  const location = useLocation();
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const active = navigation.current?.querySelector<HTMLAnchorElement>('a.active');
    if (active && navigation.current && navigation.current.scrollWidth > navigation.current.clientWidth) {
      navigation.current.scrollLeft = active.offsetLeft - navigation.current.offsetLeft;
    }
  }, [location.pathname]);
  return <aside className="sidebar"><Link className="brand" to="/"><Mark /><span>TraceLab</span><small>LAB</small></Link><div className="sidebar-mobile-switch"><ButtonIcon name={account ? 'logout' : 'key'} label={account ? 'Sign out' : demo ? 'Connect another project' : 'Disconnect project'} onClick={disconnect} /></div>
    <div className="workspace-switch"><span className="workspace-avatar">T</span><div><strong>{demo ? 'Support agent lab' : 'Connected project'}</strong><span>{demo ? 'Fixture workspace' : 'Project workspace'}</span></div></div>
    <nav ref={navigation} aria-label="Workspace"><NavLink to="/" end><Icon name="runs" />Runs</NavLink><NavLink to="/evaluations"><Icon name="eval" />Evaluations</NavLink><NavLink to="/comparisons"><Icon name="compare" />Compare runs</NavLink>{account && <NavLink to="/credentials"><Icon name="key" />Credentials</NavLink>}<a href="/docs"><Icon name="link" />Docs</a></nav>
    <div className="sidebar-note"><div className="small-path"><span /><span /><span /></div><strong>From failure to evidence.</strong><p>Inspect the run. Test the change.<br />Keep the result honest.</p></div>
    <div className="sidebar-bottom"><span className="connection-dot" /><div><strong>{demo ? 'Demo data' : account ? account.user.name : 'Project connected'}</strong><span>{demo ? 'Generated with the Python SDK' : account ? 'Signed in' : 'Authenticated project API'}</span></div><ButtonIcon name={account ? 'logout' : 'key'} label={account ? 'Sign out' : demo ? 'Connect another project' : 'Disconnect project'} onClick={disconnect} /></div>
  </aside>;
}

function WorkspaceHeader({ apiKey }: { apiKey: string }) {
  const location = useLocation();
  const title = location.pathname.startsWith('/traces') ? 'Run detail' : location.pathname.startsWith('/evaluations') ? 'Evaluations' : location.pathname.startsWith('/comparisons') ? 'Compare runs' : location.pathname.startsWith('/credentials') ? 'Credentials' : 'Runs';
  return <header className="workspace-header"><div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={12} /><strong>{title}</strong></div><div className="header-meta"><span className="environment-pill"><i />{apiKey === DEMO_KEY ? 'Scripted fixtures' : 'Connected project'}</span><span className="avatar">TL</span></div></header>;
}

function Runs({ apiKey }: { apiKey: string }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const traces = useInfiniteQuery({ queryKey: ['runs', apiKey], initialPageParam: '',
    queryFn: ({ pageParam }) => getTraces(apiKey, { cursor: pageParam || undefined }), getNextPageParam: last => last.next_cursor ?? undefined });
  const experiments = useQuery({ queryKey: ['experiments', apiKey], queryFn: () => getExperiments(apiKey) });
  const rows = traces.data?.pages.flatMap(page => page.items).filter(trace => trace.workflow_name !== 'evaluation-experiment') ?? [];
  const visible = rows.filter(trace => filter === 'all' || (filter === 'failed' ? tracePassed(trace) === false : tracePassed(trace) === true))
    .filter(trace => `${trace.attributes.question ?? ''} ${trace.attributes.case_id ?? ''} ${trace.workflow_name} ${trace.trace_id} ${trace.workflow_version}`.toLowerCase().includes(search.toLowerCase()));
  const fixed = experiments.data?.items.find(item => item.variant === 'fixed');
  const baseline = experiments.data?.items.find(item => item.variant === 'baseline' && item.dataset_sha256 === fixed?.dataset_sha256 && item.provider === fixed?.provider && item.model === fixed?.model);
  return <main className="page runs-page"><div className="page-title"><div><h1>Follow the evidence.</h1><p>Every decision, tool call, and check. One place to understand the run.</p></div>{apiKey.startsWith(BROWSER_SESSION) && <Link className="secondary-button" to="/credentials">Manage credentials<Icon name="key" size={16} /></Link>}</div>
    {fixed && baseline && <Link to="/evaluations" className="experiment-banner"><span className="banner-icon"><Icon name="eval" size={24} /></span><div><strong>A fix you can measure.</strong><p>{fixed.total} reference cases · {fixed.dataset_version} · {fixed.data_kind === 'fixture' ? 'Controlled fixture experiment' : 'Model experiment'}</p></div><div className="banner-result"><span>{Math.round(baseline.pass_rate * 100)}%<small>baseline</small></span><Icon name="arrow" /><span>{Math.round(fixed.pass_rate * 100)}%<small>fixed</small></span></div><Icon name="chevron" /></Link>}
    <div className="section-title"><h2>Agent runs <span>{rows.length}</span></h2><div className="section-actions"><span>Most recent first</span><ButtonIcon name="refresh" label="Refresh runs" onClick={() => { void traces.refetch(); void experiments.refetch(); }} disabled={traces.isFetching} /></div></div>
    <div className="table-toolbar"><div className="segmented" aria-label="Filter runs">{[['all','All runs'],['failed','Needs review'],['passed','Checks passed']].map(([value,label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><label className="search-input"><Icon name="search" size={16} /><input aria-label="Search runs" placeholder="Search task, case or trace…" value={search} onChange={event => setSearch(event.target.value)} />{search && <ButtonIcon name="close" label="Clear search" onClick={() => setSearch('')} />}</label></div>
    {traces.isLoading ? <Loading /> : traces.error ? <ErrorMessage error={traces.error} retry={() => void traces.refetch()} /> : <div className="table-scroll"><table className="runs-table"><thead><tr><th>Task / run</th><th>Resolution</th><th>Evaluation</th><th>Steps</th><th>Duration</th><th>Version</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{visible.map(trace => <RunRow key={trace.trace_id} trace={trace} />)}</tbody></table>{!visible.length && <div className="empty-state"><Icon name="search" size={30} /><h3>{rows.length ? 'No matching runs' : 'Your first run starts here'}</h3><p>{rows.length ? 'Try another search or clear the filter.' : 'Runs will appear here as this project receives traces.'}</p>{rows.length ? <button className="secondary-button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button> : apiKey.startsWith(BROWSER_SESSION) && <Link className="secondary-button" to="/credentials">Project credentials</Link>}</div>}</div>}
    <div className="table-footer"><span>{visible.length} of {rows.length} loaded runs{apiKey === DEMO_KEY ? ' · Sample commerce data' : ''}</span>{traces.hasNextPage && <button className="text-button" disabled={traces.isFetchingNextPage} onClick={() => void traces.fetchNextPage()}>{traces.isFetchingNextPage ? 'Loading…' : 'Load older runs'}</button>}<span>Pass labels refer to structured checks.</span></div>
  </main>;
}
function RunRow({ trace }: { trace: TraceSummary }) {
  const navigate = useNavigate();
  return <tr onClick={() => navigate(`/traces/${trace.trace_id}`)}><td><Link className="task-link" to={`/traces/${trace.trace_id}`}><span className={`run-square ${tracePassed(trace) === false ? 'failed' : ''}`}><Icon name="branch" size={15} /></span><span><strong>{String(trace.attributes.question ?? trace.workflow_name)}</strong><small>{String(trace.attributes.case_id ?? trace.trace_id.slice(0,12))}{trace.has_error && tracePassed(trace) === true ? ' · Recovered tool error' : ''}</small></span></Link></td><td><span className="decision-text">{decisionLabel(trace.attributes.decision)}</span></td><td><Status passed={tracePassed(trace)} /></td><td className="numeric">{trace.span_count}</td><td className="numeric">{formatDuration(trace.duration_ms)}</td><td><span className={`version ${trace.workflow_version === 'fixed' ? 'fixed' : ''}`}>{trace.workflow_version ?? 'Unversioned'}</span></td><td><Icon name="chevron" size={15} /></td></tr>;
}

function TraceDetail({ apiKey }: { apiKey: string }) {
  const { traceId = '' } = useParams();
  const query = useQuery({ queryKey: ['trace', apiKey, traceId], queryFn: () => getTrace(apiKey, traceId), refetchInterval: current => current.state.data?.state === 'running' ? 2000 : false });
  const [selectedId, setSelectedId] = useState<string>();
  const [tab, setTab] = useState<'trajectory'|'evaluation'>('trajectory');
  const [copied, setCopied] = useState(false);
  useEffect(() => { setSelectedId(undefined); setTab('trajectory'); setCopied(false); }, [traceId]);
  const flat = useMemo(() => flattenSpans(query.data?.spans ?? []), [query.data]);
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} retry={() => void query.refetch()} />;
  if (!query.data) return null;
  const trace = query.data;
  const result = outcome(trace);
  const selected = trace.spans.find(span => span.span_id === selectedId) ?? trace.spans.find(span => span.kind === 'evaluator' && span.status === 'error') ?? trace.spans.find(span => span.status === 'error') ?? trace.spans[0];
  const index = flat.findIndex(item => item.span.span_id === selected?.span_id);
  const llmSpans = trace.spans.filter(span => span.kind === 'llm');
  const costKnown = llmSpans.length > 0 && llmSpans.every(span => span.cost_usd !== null);
  async function copy() { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); } }
  return <main className="page trace-page"><div className="detail-wayfinding"><Link to="/" className="text-button"><Icon name="back" size={15} />All runs</Link><code>{trace.trace_id}</code><button className="text-button" onClick={() => void copy()}><Icon name="link" size={15} />{copied ? 'Copied' : 'Copy local link'}</button></div>
    <div className="page-title"><div><h1>{decisionLabel(trace.attributes.decision)}</h1><p>{String(trace.attributes.case_id ?? trace.workflow_name)} · {formatDate(trace.created_at)} · <span className="version">{trace.workflow_version}</span></p></div><Status passed={result.evaluation?.passed} label={trace.state === 'running' ? 'Running' : undefined} /></div>
    <section className="outcome-panel"><div className="outcome-input"><span>Request</span><p>{String(trace.attributes.question ?? (result.input as { question?: string } | null)?.question ?? 'Input recorded in the root span.')}</p></div><div className="outcome-answer"><span>Agent response</span><p>{result.answer ?? 'Inspect the model and tool steps for this run’s output.'}</p>{result.resolution && <div className="outcome-tags"><span>{String(result.resolution.action ?? 'none').replaceAll('_',' ')}</span>{Array.isArray(result.resolution.citations) && result.resolution.citations.map(source => <span key={String(source)}>{String(source)}</span>)}</div>}</div></section>
    <div className="run-measurements"><span><Icon name="clock" size={15} /><strong>{formatDuration(trace.duration_ms)}</strong>wall time</span><span><Icon name="branch" size={15} /><strong>{trace.span_count}</strong>steps</span><span><Icon name="model" size={15} /><strong>{trace.attributes.data_kind === 'fixture' ? 'Fixture' : trace.total_tokens.toLocaleString()}</strong>{trace.attributes.data_kind === 'fixture' ? 'no model billed' : 'provider tokens'}</span><span><strong>{costKnown ? formatCost(trace.total_cost_usd) : '—'}</strong>estimated cost</span>{trace.error_count > 0 && <span className="issue-count">{trace.error_count} error {trace.error_count === 1 ? 'signal' : 'signals'}{result.evaluation?.passed ? ' · recovered' : ''}</span>}</div>
    <div className="detail-tabs" role="tablist" aria-label="Run view"><button role="tab" aria-selected={tab === 'trajectory'} className={tab === 'trajectory' ? 'active' : ''} onClick={() => setTab('trajectory')}><Icon name="branch" size={16} />Trajectory<span>{trace.span_count}</span></button><button role="tab" aria-selected={tab === 'evaluation'} className={tab === 'evaluation' ? 'active' : ''} onClick={() => setTab('evaluation')}><Icon name="eval" size={16} />Evaluation{result.evaluation && <span>{result.evaluation.checks?.filter(check => check.passed).length ?? 0}/{result.evaluation.checks?.length ?? 0}</span>}</button><div className="step-controls"><span>{index + 1} / {flat.length}</span><ButtonIcon name="back" label="Previous step" disabled={index <= 0} onClick={() => setSelectedId(flat[index-1]?.span.span_id)} /><ButtonIcon name="arrow" label="Next step" disabled={index >= flat.length-1} onClick={() => setSelectedId(flat[index+1]?.span.span_id)} /></div></div>
    {tab === 'evaluation' ? <EvaluationView evaluation={result.evaluation} selectEvidence={id => { setSelectedId(id); setTab('trajectory'); }} /> : <section className="trace-workspace"><div className="trajectory"><div className="trajectory-labels"><span>Execution path</span><span>Wall time</span><span>State</span></div>{flat.map(({span,depth}) => {
      const width = Math.max(1.5, Math.min(100, ((span.duration_ms ?? 0) / Math.max(trace.duration_ms ?? 1, 0.001)) * 100));
      const offset = Math.min(98, Math.max(0, (Date.parse(span.started_at) - Date.parse(trace.started_at ?? span.started_at)) / Math.max(trace.duration_ms ?? 1, 0.001) * 100));
      return <button className={`span-row ${selected?.span_id === span.span_id ? 'selected' : ''} ${span.status === 'error' ? 'error-row' : ''}`} key={span.span_id} onClick={() => setSelectedId(span.span_id)} aria-pressed={selected?.span_id === span.span_id}><span className="span-identity" style={{ paddingLeft: `${Math.min(depth,7)*17}px` }}><span className={`span-kind ${span.kind}`}><Icon name={span.kind === 'llm' ? 'model' : span.kind === 'tool' ? 'tool' : span.kind === 'evaluator' ? 'eval' : 'branch'} size={14} /></span><span><strong>{words(span.name)}</strong><small>{span.kind}{span.model_name && span.model_name !== 'scripted-fixture' ? ` · ${span.model_name}` : ''}</small></span></span><span className="span-timing"><span className="time-track"><i style={{ left: `${offset}%`, width: `${Math.min(width,100-offset)}%` }} /></span><code>{formatDuration(span.duration_ms)}</code></span><span className={`span-state ${span.status}`}><Icon name={span.status === 'error' ? 'close' : span.status === 'ok' ? 'check' : 'clock'} size={14} /></span></button>;
    })}<p className="trajectory-note">Parent links preserve the execution path. Bars show measured span durations.</p></div><Inspector span={selected} selectEvidence={setSelectedId} /></section>}
  </main>;
}
function EvaluationView({ evaluation, selectEvidence }: { evaluation?: Evaluation; selectEvidence: (id: string) => void }) {
  if (!evaluation?.checks) return <div className="empty-state"><h3>No structured evaluation recorded</h3><p>Inspect the evaluator span for the checks this producer emitted.</p></div>;
  return <div className="evaluation-view"><div className="evaluation-heading"><div><h2>Check the decision against the evidence.</h2><p>{evaluation.rubric_version} · {evaluation.checks.filter(check => check.passed).length} of {evaluation.checks.length} checks passed</p></div><Status passed={evaluation.passed} /></div><div className="review-notice"><Icon name="info" size={16} /><p>{evaluation.review_required ? 'Structured checks completed. Free-form prose has not been reviewed by a model judge or human.' : 'A model judge also reviewed prose faithfulness. Judge verdicts still need calibration against human reviews.'}</p></div><div className="check-list">{evaluation.checks.map(check => <div className="check-row" key={check.key}><span className={`check-icon ${check.passed ? 'passed' : 'failed'}`}><Icon name={check.passed ? 'check' : 'close'} size={17} /></span><div><strong>{words(check.key)}</strong><p>{check.reason}</p><div className="evidence-links">{check.evidence_span_ids?.slice(0,5).map((id,index) => <button key={id} onClick={() => selectEvidence(id)}><Icon name="link" size={12} />Evidence {index + 1}</button>)}</div></div><span className="check-verdict">{check.passed ? 'Pass' : 'Fail'}</span></div>)}</div></div>;
}
function Inspector({ span, selectEvidence }: { span?: Span; selectEvidence: (id: string) => void }) {
  const [tab,setTab] = useState<'output'|'input'|'metadata'>('output');
  useEffect(() => setTab('output'), [span?.span_id]);
  if (!span) return null;
  const value = tab === 'output' ? span.output : tab === 'input' ? span.input : { attributes: span.attributes, resource: span.resource, span_id: span.span_id, parent_span_id: span.parent_span_id, events: span.events };
  const evaluation = span.kind === 'evaluator' ? span.output as Evaluation | null : null;
  return <aside className="inspector"><div className="inspector-heading"><span>Step evidence</span><span className={`span-state ${span.status}`}><Icon name={span.status === 'error' ? 'close' : 'check'} size={15} /></span></div><h2>{words(span.name)}</h2><div className="inspector-facts"><span>{span.kind}</span><span>{formatDuration(span.duration_ms)}</span>{span.model_name && <span>{span.model_name}</span>}</div>{span.error_message && <div className="step-error"><Icon name="info" size={16} /><p>{span.error_message}</p></div>}<div className="inspector-tabs" role="tablist" aria-label="Step evidence">{(['output','input','metadata'] as const).map(value => <button key={value} role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value}</button>)}</div>
    <div key={`${span.span_id}:${tab}`} className="inspector-content">{tab === 'output' && evaluation?.checks ? <><div className="rubric-caption">{evaluation.rubric_version}</div>{evaluation.checks.map(check => <div className={`mini-check ${check.passed ? '' : 'failed'}`} key={check.key}><Icon name={check.passed ? 'check' : 'close'} size={14} /><div><strong>{words(check.key)}</strong><p>{check.reason}</p>{!check.passed && check.evidence_span_ids?.length ? <div className="evidence-links">{check.evidence_span_ids.map((id, index) => <button key={id} aria-label={`Open evidence ${index + 1} for ${words(check.key)}`} onClick={() => selectEvidence(id)}>Evidence {index + 1}<Icon name="arrow" size={12} /></button>)}</div> : null}</div></div>)}</> : <><pre>{tab === 'output' ? outputText(value) : JSON.stringify(value, null, 2) ?? 'No data recorded'}</pre>{tab === 'output' && value !== null && typeof value === 'object' && outputText(value) !== JSON.stringify(value,null,2) && <details><summary>Full recorded output</summary><pre>{JSON.stringify(value,null,2)}</pre></details>}</>}</div>
  </aside>;
}

function Evaluations({ apiKey }: { apiKey: string }) {
  const query = useQuery({ queryKey: ['experiments',apiKey], queryFn: () => getExperiments(apiKey) });
  const [selected,setSelected] = useState('');
  const [failures,setFailures] = useState(false);
  const reports = query.data?.items ?? [];
  const report = reports.find(item => item.experiment_id === selected) ?? reports.find(item => item.variant === 'fixed') ?? reports[0];
  const baseline = reports.find(item => item.variant === 'baseline' && item.dataset_sha256 === report?.dataset_sha256 && item.model === report?.model && item.provider === report?.provider);
  const paired = report?.variant === 'fixed' && baseline;
  return <main className="page"><div className="page-title"><div><h1>Make the fix prove itself.</h1><p>Reference cases, explicit checks, and evidence you can inspect.</p></div><ButtonIcon name="refresh" label="Refresh evaluations" onClick={() => void query.refetch()} disabled={query.isFetching} /></div>{query.isLoading ? <Loading /> : query.error ? <ErrorMessage error={query.error} retry={() => void query.refetch()} /> : !report ? <div className="empty-state"><h3>No experiments yet</h3><p>Evaluation reports will appear here when this project receives them.</p></div> : <>
    <div className="experiment-toolbar"><label>Experiment<select value={report.experiment_id} onChange={event => { setSelected(event.target.value); setFailures(false); }}>{reports.map(item => <option value={item.experiment_id} key={item.experiment_id}>{item.name} · {formatDate(item.started_at)}</option>)}</select></label><span className="environment-pill">{report.data_kind === 'fixture' ? 'Controlled fixtures' : report.model}</span><span>{report.dataset_version}</span></div>
    <section className="experiment-summary"><div className="experiment-score"><h2>{report.passed} <span>/ {report.total}</span></h2><p>cases pass all structured checks</p><div className="score-rule"><i style={{width:`${report.pass_rate*100}%`}} /></div><small>95% Wilson interval: {(report.confidence_interval[0]*100).toFixed(1)}–{(report.confidence_interval[1]*100).toFixed(1)}%<br />{report.repetitions} {report.repetitions === 1 ? 'run' : 'runs'} per case · synthetic dataset</small></div><div className="experiment-context"><h3>{paired ? 'The same cases. A different outcome.' : 'A bounded, inspectable experiment.'}</h3><p>{paired ? `The controlled baseline passes ${baseline.passed} of ${baseline.total} cases. The fixed agent passes ${report.passed}. Open any pair below to see the changed decision and checks.` : report.limitations}</p>{paired && <div className="paired-bars"><div><span>Baseline</span><i><b style={{width:`${baseline.pass_rate*100}%`}} /></i><strong>{Math.round(baseline.pass_rate*100)}%</strong></div><div><span>Fixed</span><i><b style={{width:`${report.pass_rate*100}%`}} /></i><strong>{Math.round(report.pass_rate*100)}%</strong></div></div>}<p className="experiment-honesty">{report.data_kind === 'fixture' ? 'This demonstrates the evaluation harness, not a measured improvement in a real model.' : 'Results describe this model on this dataset; they do not establish performance on unseen tasks.'}</p></div></section>
    <div className="review-notice"><Icon name="info" size={16} /><p>{report.judge === 'not_run' ? 'No model judge was run. Scores cover structured decisions, policy references, action safety and tool trajectories.' : 'A model judge reviewed prose alongside deterministic checks. The judge uses the same provider and should be calibrated against human labels.'}</p></div>
    <div className="section-title"><h2>Case results <span>{report.total}</span></h2><button className={`filter-button ${failures ? 'active' : ''}`} aria-pressed={failures} onClick={() => setFailures(!failures)}>Only failures</button></div><div className="table-scroll"><table className="case-table"><thead><tr><th>Reference case</th><th>Expected → actual</th><th>{paired ? 'Baseline' : 'Category'}</th><th>Result</th><th>Evidence</th></tr></thead><tbody>{report.cases.filter(row => !failures || !row.passed).map(row => {
      const before = baseline?.cases.find(item => item.case_id === row.case_id && item.repeat === row.repeat);
      return <tr key={`${row.case_id}:${row.repeat}`}><td><strong>{words(row.case_id)}</strong><small>{row.question}</small>{row.failed_checks.length > 0 && <small className="failure-list">{row.failed_checks.map(words).join(' · ')}</small>}</td><td><span className="expected-decision">{decisionLabel(row.expected)}</span><span className={row.actual === row.expected ? 'actual-match' : 'actual-mismatch'}>{decisionLabel(row.actual)}</span></td><td data-label={paired ? 'Baseline' : 'Category'}>{paired && before ? <Status passed={before.passed} label={before.passed ? 'Pass' : 'Fail'} /> : words(row.category)}</td><td data-label="Result"><Status passed={row.passed} label={row.passed ? 'Pass' : 'Fail'} /></td><td><div className="case-actions">{row.trace_id && <Link to={`/traces/${row.trace_id}`}>Trace<Icon name="chevron" size={13} /></Link>}{paired && before?.trace_id && row.trace_id && <Link to={`/comparisons?baseline=${before.trace_id}&candidate=${row.trace_id}`}>Compare<Icon name="compare" size={13} /></Link>}</div></td></tr>;
    })}</tbody></table>{failures && !report.cases.some(row => !row.passed) && <div className="empty-state"><h3>No failing cases in this experiment</h3><p>Switch to the baseline to inspect the controlled failures.</p></div>}</div><div className="evaluation-provenance"><details><summary>Dataset and rubric provenance</summary><dl><dt>Dataset SHA-256</dt><dd><code>{report.dataset_sha256}</code></dd><dt>Rubric</dt><dd>{report.rubric_version}</dd><dt>Model / provider</dt><dd>{report.model} / {report.provider}</dd><dt>Scope</dt><dd>{report.limitations}</dd></dl></details></div>
  </>}</main>;
}

function Metric({ label, metric, format = 'number' }: { label: string; metric: MetricDelta; format?: string }) {
  const render = (value: string | null) => value === null ? '—' : format === 'time' ? formatDuration(Number(value)) : format === 'cost' ? formatCost(value) : Number(value).toLocaleString();
  return <div className="comparison-measurement"><span>{label}</span><div><span>{render(metric.baseline)}</span><Icon name="arrow" size={14} /><strong>{render(metric.candidate)}</strong></div><small className={metric.absolute_delta && Number(metric.absolute_delta) < 0 ? 'delta-good' : ''}>{metric.absolute_delta === null ? 'Incomplete measurement' : `${Number(metric.absolute_delta) > 0 ? '+' : ''}${render(metric.absolute_delta)} change`}</small></div>;
}
function DiffStep({ step }: { step: StepComparison }) {
  return <details className={`diff-step ${step.change}`} open={step.change !== 'unchanged'}><summary><span className="diff-identity"><Icon name={step.kind === 'tool' ? 'tool' : step.kind === 'llm' ? 'model' : step.kind === 'evaluator' ? 'eval' : 'branch'} size={15} /><strong>{words(step.name)}</strong><small>{step.kind}</small></span><span className={`change-tag ${step.change}`}>{step.change}</span><span className="diff-fields">{step.differences.join(', ') || 'No recorded differences'}</span><Icon name="chevron" size={14} /></summary>{step.change !== 'unchanged' && <div className="diff-evidence"><div><span>Baseline · {step.baseline_status ?? 'missing'}</span><pre>{outputText(step.baseline_output)}</pre></div><div><span>Candidate · {step.candidate_status ?? 'missing'}</span><pre>{outputText(step.candidate_output)}</pre></div></div>}{step.change === 'unchanged' && <div className="diff-evidence"><div><span>Recorded output</span><pre>{outputText(step.baseline_output)}</pre></div></div>}</details>;
}
function Comparisons({ apiKey }: { apiKey: string }) {
  const [params,setParams] = useSearchParams();
  const [showAll,setShowAll] = useState(false);
  const experiments = useQuery({ queryKey:['experiments',apiKey], queryFn:() => getExperiments(apiKey) });
  const traces = useQuery({ queryKey:['comparison-runs',apiKey], queryFn:() => getTraces(apiKey) });
  const baselineId = params.get('baseline') ?? '';
  const candidateId = params.get('candidate') ?? '';
  useEffect(() => {
    if (baselineId || candidateId || !experiments.data) return;
    const fixed = experiments.data.items.find(item => item.variant === 'fixed');
    const baseline = experiments.data.items.find(item => item.variant === 'baseline' && item.dataset_sha256 === fixed?.dataset_sha256 && item.model === fixed?.model && item.provider === fixed?.provider);
    const before = baseline?.cases.find(item => !item.passed && item.trace_id);
    const after = fixed?.cases.find(item => item.case_id === before?.case_id);
    if (before?.trace_id && after?.trace_id) setParams({baseline:before.trace_id,candidate:after.trace_id}, {replace:true});
  }, [baselineId,candidateId,experiments.data,setParams]);
  const query = useQuery({queryKey:['comparison',apiKey,baselineId,candidateId],queryFn:() => getComparison(apiKey,baselineId,candidateId),enabled:!!baselineId && !!candidateId && baselineId !== candidateId});
  const rows = traces.data?.items ?? [];
  function select(which: string,value: string) { const next = new URLSearchParams(params); next.set(which,value); setParams(next); }
  return <main className="page"><div className="page-title"><div><h1>See what the fix changed.</h1><p>Compare matched runs with their decisions and evidence side by side.</p></div></div><div className="comparison-picker">{[['baseline','Baseline',baselineId],['candidate','Candidate',candidateId]].map(([key,label,value]) => <label key={key}>{label}<select aria-label={label} value={value} onChange={event => select(key,event.target.value)}><option value="">Choose a run</option>{rows.map(row => <option key={row.trace_id} value={row.trace_id}>{String(row.attributes.case_id ?? row.workflow_name)} · {row.workflow_version}</option>)}</select>{value && <Link className="text-button" to={`/traces/${value}`}>Open trace<Icon name="arrow" size={12} /></Link>}</label>)}</div>{traces.error && <ErrorMessage error={traces.error} retry={() => void traces.refetch()} />}{experiments.error && <ErrorMessage error={experiments.error} retry={() => void experiments.refetch()} />}{baselineId && baselineId === candidateId && <div className="review-notice">Choose two different runs to compare.</div>}{query.isLoading && <Loading />}{query.error && <ErrorMessage error={query.error} retry={() => void query.refetch()} />}{!baselineId && !candidateId && <div className="empty-state"><h3>Choose a baseline and candidate</h3><p>Use the same input and dataset case for a meaningful comparison.</p></div>}{query.data && <><section className={`comparison-verdict ${query.data.has_regression ? 'failed' : ''}`}><span className="verdict-icon"><Icon name={query.data.has_regression ? 'info' : 'check'} size={24} /></span><div><h2>{query.data.has_regression ? 'New failing signals detected' : Number(query.data.errors.absolute_delta) < 0 ? 'Fewer failing signals. Inspect the evidence.' : 'No new failing signals detected'}</h2><p>This verdict tracks error states and missing evaluation steps. Changed prose alone does not establish correctness.</p></div></section><div className="comparison-measurements"><Metric label="Wall time" metric={query.data.duration} format="time" /><Metric label="Provider tokens" metric={query.data.tokens} /><Metric label="Estimated cost" metric={query.data.cost} format="cost" /><Metric label="Error signals" metric={query.data.errors} /></div><div className="section-title"><h2>Step differences <span>{query.data.steps.filter(step => step.change !== 'unchanged').length}</span></h2><button className="filter-button" onClick={() => setShowAll(!showAll)} aria-pressed={showAll}>{showAll ? 'Show changes only' : 'Show unchanged steps'}</button></div><div className="diff-list">{query.data.steps.filter(step => showAll || step.change !== 'unchanged').map(step => <DiffStep step={step} key={step.alignment_key} />)}{!query.data.steps.some(step => step.change !== 'unchanged') && !showAll && <div className="empty-state"><h3>No recorded step differences</h3><p>Show unchanged steps to inspect the matched trajectory.</p></div>}</div><p className="table-footer">Steps align by parent context, producer step key and occurrence. Identical repeated steps may need explicit producer identities.</p></>}</main>;
}
function Dashboard({ apiKey, disconnect, account }: { apiKey: string; disconnect: () => void; account?: Account | null }) {
  return <div className="app-shell"><Sidebar apiKey={apiKey} disconnect={disconnect} account={account} /><div className="workspace-main"><WorkspaceHeader apiKey={apiKey} /><Routes><Route path="/" element={<Runs apiKey={apiKey} />} /><Route path="/traces/:traceId" element={<TraceDetail apiKey={apiKey} />} /><Route path="/evaluations" element={<Evaluations apiKey={apiKey} />} /><Route path="/comparisons" element={<Comparisons apiKey={apiKey} />} /><Route path="/guide" element={<Navigate to={account ? "/credentials" : "/"} replace />} /><Route path="/credentials" element={account ? <Credentials account={account} /> : <Navigate to="/" replace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></div></div>;
}
export function App() {
  const [logoutError, setLogoutError] = useState('');
  const [key,setApiKey] = useState(() => {
    const previous = sessionStorage.getItem(SESSION_KEY);
    if (previous !== DEMO_KEY) sessionStorage.removeItem(SESSION_KEY);
    return previous === DEMO_KEY ? DEMO_KEY : '';
  });
  const account = useQuery({ queryKey: ['account'], queryFn: getAccount, retry: false, refetchOnWindowFocus: true });
  const client = useQueryClient();
  const navigate = useNavigate();
  const signedIn = !key && account.data;
  const apiKey = key || (signedIn ? BROWSER_SESSION + signedIn.user.id : '');
  useEffect(() => {
    const expired = () => { client.clear(); client.setQueryData(['account'], null); setApiKey(''); };
    window.addEventListener('tracelab-session-expired', expired);
    return () => window.removeEventListener('tracelab-session-expired', expired);
  }, [client]);
  function connect(next: string) {
    if (next === DEMO_KEY) sessionStorage.setItem(SESSION_KEY, next);
    setApiKey(next); navigate('/');
  }
  async function disconnect() {
    try {
      if (signedIn) await logout(signedIn.csrf_token);
      sessionStorage.removeItem(SESSION_KEY); setApiKey(''); client.clear(); navigate('/');
    } catch (error) { setLogoutError(error instanceof Error ? error.message : 'Could not sign out. Try again.'); }
  }
  if (!key && account.isLoading) return <Loading />;
  return <>{apiKey ? <Dashboard apiKey={apiKey} disconnect={() => void disconnect()} account={signedIn || null} /> : <><Connect connect={connect} />{account.error && <div className="account-connection-error" role="alert">Your session could not be checked. <button className="text-button" onClick={() => void account.refetch()}>Retry connection</button></div>}</>}{logoutError && <div className="account-connection-error" role="alert">{logoutError} <button className="text-button" onClick={() => setLogoutError('')}>Dismiss</button></div>}</>;
}
