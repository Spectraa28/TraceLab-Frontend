'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Braces, Check, ChevronDown, ChevronRight, CircleCheck, CircleX, Code2, GitBranch, Layers, Menu, MoreHorizontal, Play, Radio, Search, Terminal, X, Zap } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;
function subscribeMotion(callback: () => void) { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); query.addEventListener('change', callback); return () => query.removeEventListener('change', callback); }
function useReducedMotion() { return useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true); }
const spans = [
  { name: 'support_agent', kind: 'agent', depth: 0, duration: '2.41s', tokens: '1,824', start: 0, width: 98, prompt: 'Can I return my order after 31 days?', output: 'Agent completed with one evaluation failure.', cost: '$0.0038' },
  { name: 'retrieve_context', kind: 'tool', depth: 1, duration: '184ms', tokens: '-', start: 2, width: 13, prompt: 'Retrieve the return policy and order history.', output: 'Return window: 30 days. Order age: 31 days.', cost: '-' },
  { name: 'vector_search', kind: 'tool', depth: 2, duration: '92ms', tokens: '-', start: 4, width: 7, prompt: 'query: return policy', output: '3 documents retrieved · policy/returns.md', cost: '-' },
  { name: 'llm.generate', kind: 'llm', depth: 1, duration: '1.82s', tokens: '1,824', start: 17, width: 70, prompt: 'Use the retrieved policy to answer the customer. Prompt v14.', output: 'Yes, you can return your order. I’ll start a refund for you.', cost: '$0.0038' },
  { name: 'check_faithfulness', kind: 'eval', depth: 1, duration: '312ms', tokens: '-', start: 85, width: 13, prompt: 'Does the answer agree with the retrieved return policy?', output: 'The answer contradicts the 30-day return window.', cost: '-', failed: true },
];
function Logo({ small = false }: { small?: boolean }) {
  return <span className={`tl-logo ${small ? 'small' : ''}`}><svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M4 5h7v7h7v7h6M4 12h7M11 19h7M18 5v7" stroke="currentColor" strokeWidth="2" /><circle cx="24" cy="19" r="2" fill="currentColor" /><circle cx="18" cy="5" r="2" fill="currentColor" /></svg><span>TraceLab<span className="logo-period">.</span></span></span>;
}
function Button({ children, href = '/app', secondary = false, className = '' }: { children: ReactNode; href?: string; secondary?: boolean; className?: string }) {
  return <a className={`tl-button ${secondary ? 'secondary' : 'primary'} ${className}`} href={href}>{children}<ArrowUpRight size={16} strokeWidth={1.5} /></a>;
}
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={`tl-reveal ${className}`} data-delay={delay}>{children}</div>;
}
function Eyebrow({ children }: { children: ReactNode }) { return <p className="tl-eyebrow"><span />{children}</p>; }
function Spotlight({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`tl-spotlight ${className}`} onPointerMove={e => { if (e.pointerType === 'touch') return; const box = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - box.left}px`); e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - box.top}px`); }}>{children}</div>;
}
function Counter({ target }: { target: number }) {
  const element = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = element.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!node || reduced.matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 1100);
        node.textContent = (target * (1 - Math.pow(1 - progress, 3))).toFixed(2);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [target]);
  return <span ref={element}>{target.toFixed(2)}</span>;
}
function TraceConsole() {
  const [selected, setSelected] = useState(3);
  const [tab, setTab] = useState('Output');
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  useEffect(() => { if (!playing) return; const timer = setTimeout(() => setPlaying(false), 1800); return () => clearTimeout(timer); }, [playing]);
  return <div className="trace-console" aria-label="Interactive example trace console">
    <div className="console-toolbar"><div className="console-project"><span className="project-symbol"><Layers size={13} /></span>demo / <strong>support-agent</strong><ChevronDown size={12} /></div><span className="console-demo"><span className="live-dot" />Interactive demo</span></div>
    <div className="console-body">
      <aside className="console-sidebar"><Logo small /><div className="sidebar-item active"><GitBranch />Traces<span>8</span></div><a href="#evaluations" className="sidebar-item"><CircleCheck />Evaluations</a><a href="#regressions" className="sidebar-item"><Radio />Alerts<span className="alert-count">1</span></a><div className="sidebar-bottom"><span className="live-dot" />Development</div></aside>
      <div className="console-main"><div className="trace-title"><div><div className="trace-breadcrumb">Traces <ChevronRight size={11} /><span>tr_8f2a91</span></div><h2>support_agent <span className="demo-label">EXAMPLE RUN</span></h2></div><button className="console-play" aria-label="Replay trace animation" disabled={playing} onClick={() => { setReplay(x => x + 1); setPlaying(true); }}><Play size={12} />{playing ? 'Replaying' : 'Replay'}</button></div>
      <div className="trace-meta"><span><span className="live-dot" />Completed</span><span>2.41s <small>duration</small></span><span>1,824 <small>tokens</small></span><span>$0.0038 <small>cost</small></span></div>
      <div className="waterfall-heading"><span>SPAN NAME</span><div><span>0s</span><span>1.2s</span><span>2.4s</span></div><span>TIME</span></div>
      <div className="waterfall" key={replay}>{spans.map((span, index) => <button key={span.name} style={{ '--span-delay': `${0.35 + index * 0.13}s` } as CSSProperties} className={`waterfall-row ${selected === index ? 'selected' : ''} ${span.failed ? 'span-failed' : ''}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><span className="span-name" style={{ '--depth': span.depth } as CSSProperties}>{span.depth === 0 ? <ChevronDown size={12} /> : <span className="tree-elbow" />}{span.kind === 'llm' ? <Braces size={13} /> : span.failed ? <CircleX size={13} /> : <GitBranch size={13} />}<span>{span.name}</span></span><span className="bar-track"><span className={`trace-bar ${span.kind} ${span.failed ? 'failed' : ''}`} style={{ left: `${span.start}%`, width: `${span.width}%` }} /></span><span className="span-duration">{span.duration}</span></button>)}</div>
      <div className="eval-score-row"><span className="eval-caption"><CircleCheck size={13} />EVALUATION SCORES</span><span className="score-chip">faithfulness <strong><Counter target={0.91} /></strong></span><span className="score-chip">relevance <strong><Counter target={0.87} /></strong></span><span className="fail-chip"><CircleX size={12} />1 failed check</span></div>
      <div className="console-bottom"><span><span className="live-dot" />5 spans captured</span><span>Python SDK <span className="muted">/</span> prompt v14</span></div></div>
      <aside className="console-inspector"><div className="inspector-title"><Braces size={14} /><strong>{spans[selected].name}</strong><MoreHorizontal size={16} /></div><div className="inspector-tabs" role="tablist" aria-label="Span details">{['Input', 'Output'].map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div><div className="inspector-content" role="tabpanel"><p className="data-label">{tab === 'Input' ? 'PROMPT' : 'RESPONSE'}</p><div className="code-json"><span>{'{'}</span><p><span className="json-key">"content"</span>:<br /><span className="json-string">"{tab === 'Input' ? spans[selected].prompt : spans[selected].output}"</span></p><span>{'}'}</span></div><div className="inspector-metrics"><span>Model<strong>{spans[selected].kind === 'llm' ? 'gpt-4o-mini' : spans[selected].kind}</strong></span><span>Tokens<strong>{spans[selected].tokens}</strong></span><span>Cost<strong>{spans[selected].cost}</strong></span></div>{(selected === 3 || spans[selected].failed) && <div className="inspector-warning"><CircleX size={14} /><div><strong>Policy contradiction</strong><p>Answer exceeds the 30-day return window.</p><a href="#regressions">Inspect the regression<ArrowRight size={12} /></a></div></div>}</div></aside>
    </div>
  </div>;
}
function SpanInspector() {
  const [active, setActive] = useState(1);
  const rows = [spans[0], spans[3], spans[1]];
  return <Spotlight className="span-inspector-panel"><div className="panel-topline"><span><GitBranch size={14} />TRACE EXPLORER</span><span className="demo-label">DEMO DATA</span></div><div className="explorer-body"><div className="explorer-tree">{rows.map((s, i) => <button key={s.name} className={active === i ? 'active' : ''} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} style={{ paddingLeft: i ? 28 : 16 }} aria-pressed={active === i}>{i ? <span className="tree-elbow" /> : <ChevronDown size={12} />}<span>{s.name}</span><small>{s.duration}</small></button>)}<div className="hover-hint"><Search size={12} />Hover or select a span</div></div><div className="explorer-details" aria-live="polite"><div><span className="data-label">PROMPT</span><p>{rows[active].prompt}</p></div><div><span className="data-label">OUTPUT</span><p className="output-text">{rows[active].output}</p></div><div className="detail-cost"><span>ESTIMATED COST</span><strong>{rows[active].cost}</strong></div></div></div></Spotlight>;
}
const evalRows = [
  ['Return within window', '0.92', '0.97', '+0.05', true],
  ['Return after 30 days', '0.94', '0.41', '−0.53', false],
  ['Missing order ID', '0.86', '0.93', '+0.07', true],
  ['Partial refund request', '0.88', '0.91', '+0.03', true],
  ['Policy citation', '0.91', '0.96', '+0.05', true],
] as const;
function EvalTable() {
  const [failOnly, setFailOnly] = useState(false);
  return <Spotlight className="eval-panel"><div className="eval-panel-header"><div><span className="dataset-icon"><Layers size={15} /></span><strong>support-agent-evals</strong><span className="demo-label">DEMO DATA</span></div><span className="eval-version">prompt v13 <ArrowRight size={13} />prompt v14</span><button className={`filter-fail ${failOnly ? 'active' : ''}`} aria-pressed={failOnly} onClick={() => setFailOnly(x => !x)}><CircleX size={13} />{failOnly ? 'Show all cases' : 'Failures only'}</button></div><div className="eval-table-scroll"><table className="eval-table"><thead><tr><th>TEST CASE</th><th>v13 <span>BASELINE</span></th><th>v14 <span>CANDIDATE</span></th><th>DELTA</th><th>RESULT</th></tr></thead><tbody>{evalRows.filter(r => !failOnly || !r[4]).map(([name, before, after, delta, passed]) => <tr key={name} className={passed ? '' : 'failed-eval'}><td><span className={`result-dot ${passed ? '' : 'bad'}`} />{name}</td><td>{before}</td><td>{after}</td><td className={passed ? 'positive' : 'negative'}>{delta}</td><td><span className={`result-chip ${passed ? 'pass' : 'fail'}`}>{passed ? <Check size={12} /> : <X size={12} />}{passed ? 'PASS' : 'FAIL'}</span></td></tr>)}</tbody></table></div><div className="eval-panel-footer"><span><CircleCheck size={13} />Same dataset. Same rubric. Comparable results.</span><span>4 passed <span className="muted">/</span> 1 failed</span></div></Spotlight>;
}
function RegressionChart() {
  const [version, setVersion] = useState('v14');
  return <Spotlight className="regression-panel"><div className="panel-topline"><span><Radio size={14} />FAITHFULNESS OVER TIME</span><span className="demo-label">DEMO DATA</span></div><div className="chart-heading"><span>Faithfulness <strong>{version === 'v14' ? '0.72' : '0.94'}<small className={version === 'v14' ? 'negative' : 'positive'}>{version === 'v14' ? '−0.22' : 'baseline'}</small></strong></span><div className="chart-versions">{['v13', 'v14'].map(v => <button key={v} className={version === v ? 'active' : ''} onClick={() => setVersion(v)} aria-pressed={version === v}>{v}</button>)}</div></div><div className="chart"><div className="chart-y"><span>1.0</span><span>0.8</span><span>0.6</span></div><svg viewBox="0 0 560 160" role="img" aria-label={`Illustrative faithfulness chart: ${version === 'v14' ? 'score drops after prompt v14' : 'stable baseline for prompt v13'}`}><path className="chart-grid" d="M0 20H560M0 80H560M0 140H560" /><path className="threshold" d="M0 99H560" /><text x="3" y="93" className="threshold-label">THRESHOLD 0.80</text><path className="chart-deploy" d="M348 0V160" /><path key={version} pathLength={1} style={{ strokeDasharray: '1 1', strokeDashoffset: 0 }} className="chart-line" d={version === 'v14' ? 'M0 34L28 30L56 37L84 29L112 31L140 25L168 32L196 25L224 34L252 28L280 31L310 24L338 29L362 78L390 108L418 116L446 106L474 112L502 103L530 109L560 108' : 'M0 34L28 30L56 37L84 29L112 31L140 25L168 32L196 25L224 34L252 28L280 31L310 24L338 29L362 31L390 26L418 34L446 29L474 33L502 24L530 29L560 25'} /><circle cx="348" cy="47" r="4" className="chart-point" /><text x="360" y="17" className="deploy-label">prompt v14 deployed</text></svg><div className="chart-x"><span>09:00</span><span>10:00</span><span>11:00</span><span>12:00</span></div></div><div className={`root-cause ${version === 'v13' ? 'baseline' : ''}`}>{version === 'v14' ? <CircleX size={16} /> : <CircleCheck size={16} />}<div><strong>{version === 'v14' ? 'Regression detected' : 'Baseline within threshold'}</strong><span>{version === 'v14' ? 'root cause: prompt v14' : 'prompt v13 · no threshold breach'}</span></div><span className="root-cause-time">11:04:32</span></div></Spotlight>;
}
function HowItWorks() {
  return <section id="how-it-works" className="tl-section how-section"><Reveal className="how-heading"><Eyebrow>FROM REQUEST TO RESOLUTION</Eyebrow><h2>A tighter feedback loop.</h2><p>Follow the call. Test the change. Know what shipped.</p></Reveal><div className="how-progress"><span /></div><div className="how-steps">{[
    { number: '01', title: 'Instrument', text: 'Connect the SDK and wrap your agent workflow. Capture the calls that make up a request.', icon: Terminal, sample: 'client.trace("support-agent")' },
    { number: '02', title: 'Evaluate', text: 'Run a dataset against your prompts. Score outputs with an explicit, versioned rubric.', icon: CircleCheck, sample: 'faithfulness > 0.85' },
    { number: '03', title: 'Iterate', text: 'Inspect failing cases, compare versions, and rerun the same tests before your next release.', icon: GitBranch, sample: 'v13 → v14 · compare' },
  ].map(({ number, title, text, icon: Icon, sample }) => <div className="how-step" key={number}><span className="step-number">{number}<Icon size={18} strokeWidth={1.5} /></span><h3>{title}</h3><p>{text}</p><code>{sample}</code></div>)}</div></section>;
}
export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let cleanup: (() => void) | undefined;
    let disposed = false;
    const initialize = () => { Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis'), import('motion/mini')]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }, { animate }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ autoRaf: true, anchors: true, duration: 0.8 });
      lenis.on('scroll', ScrollTrigger.update);
      const context = gsap.context(() => {
        gsap.fromTo('.how-progress > span', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.how-section', start: 'top 75%', end: 'bottom 65%', scrub: true } });
        gsap.fromTo('.how-step', { y: 16, opacity: 0.45 }, { y: 0, opacity: 1, stagger: 0.2, ease: 'none', scrollTrigger: { trigger: '.how-section', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      }, root);
      const animations: { stop: () => void }[] = [];
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        animations.push(animate(element, element.classList.contains('chart-line') ? { strokeDashoffset: [1, 0] } : { opacity: [0.5, 1], y: [16, 0] }, { duration: 0.6, ease, delay: Number(element.dataset.delay ?? 0) }));
        observer.unobserve(element);
      }), { threshold: 0.12 });
      root.current?.querySelectorAll('.tl-reveal, .chart-line').forEach(element => observer.observe(element));
      cleanup = () => { observer.disconnect(); animations.forEach(animation => animation.stop()); context.revert(); lenis.destroy(); };
    }).catch(() => { /* Native scrolling and visible content remain available. */ }); };
    window.addEventListener('scroll', initialize, { once: true, passive: true });
    return () => { disposed = true; window.removeEventListener('scroll', initialize); cleanup?.(); };
  }, [reduced]);
  const navLinks = [['Product', '#product'], ['Evaluations', '#evaluations'], ['Workflow', '#how-it-works'], ['Docs', '/docs'], ['Workspace', '/app']];
  return <div className="tl-landing" ref={root}><a href="#main" className="skip-link">Skip to content</a><header className="tl-nav"><div className="tl-container nav-inner"><a href="/" aria-label="TraceLab home"><Logo /></a><nav aria-label="Main navigation" className={menuOpen ? 'open' : ''}>{navLinks.map(([label, href]) => <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav><div className="nav-actions"><Button className="nav-cta">Get started</Button><button className="menu-button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(x => !x)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></div></div></header>
    <main id="main"><section className="tl-hero" aria-labelledby="hero-title"><div className="hero-grid" /><div className="tl-container"><div className="hero-copy"><a href="#product" className="hero-pill"><span className="live-dot" /><span>EVERY CALL. THE WHOLE STORY.</span><ArrowRight size={12} /></a><h1 id="hero-title">See the trace.<br /><span>Ship with confidence.</span></h1><p>The observability and evaluation layer for LLM apps and agents. <br className="desktop-break" />Trace every call. Score every output. Catch the regression.</p><div className="hero-actions"><Button>Get started</Button><Button href="#product" secondary><Play size={14} />Explore the product</Button></div><div className="hero-caption"><span className="caption-rule" />Built for engineers shipping AI<span className="caption-rule" /></div></div><div className="hero-product"><div className="mockup-caption"><span><span className="live-dot" />THE SIGNAL BEHIND THE RESPONSE</span><span>TRACE VIEW <span className="muted">/</span> 001</span></div><TraceConsole /></div></div></section>
    <div className="tl-container"><div className="proof-strip" aria-label="Integration targets"><span className="proof-label">ENGINEERING TARGETS</span><span><Zap size={15} /><strong>p95 overhead &lt;5ms</strong></span><span><Layers size={15} /><strong>OpenTelemetry native</strong></span><span><Code2 size={15} /><strong>2 lines to integrate</strong></span></div>
    <section id="product" className="tl-section tracing-section"><Reveal className="feature-copy"><Eyebrow>TRACING</Eyebrow><h2>The answer is only<br />half the story.</h2><p>Follow the request through every model call, retrieval, and tool. See the prompt, output, latency, and cost in context.</p><ul className="feature-list"><li><Check />Nested spans. One complete picture.</li><li><Check />Inputs and outputs, side by side.</li><li><Check />The slow call is no longer a guess.</li></ul><a href="/app" className="text-link">Follow a trace<ArrowRight size={15} /></a></Reveal><Reveal delay={0.08}><SpanInspector /></Reveal></section>
    <section id="evaluations" className="tl-section evaluations-section"><Reveal className="eval-section-heading"><div><Eyebrow>EVALUATIONS</Eyebrow><h2>A better prompt?<br />Make it prove it.</h2></div><div><p>Run the same cases against two versions. See what improved, what broke, and exactly which output needs another look.</p><a href="/app" className="text-link">Compare the evidence<ArrowRight size={15} /></a></div></Reveal><Reveal delay={0.08}><EvalTable /></Reveal><div className="eval-under-label"><span>VERSIONED PROMPTS</span><span>REPEATABLE DATASETS</span><span>EXPLICIT RUBRICS</span></div></section>
    <section id="regressions" className="tl-section regression-section"><Reveal><RegressionChart /></Reveal><Reveal className="feature-copy" delay={0.08}><Eyebrow>REGRESSION ALERTS</Eyebrow><h2>Find the dip.<br />Then find the why.</h2><p>A falling score is the starting point. Follow it back to the prompt version and the failing trace, while the evidence is still fresh.</p><div className="feature-note"><span className="live-dot" /><span>From a signal to a specific call.</span></div><a href="/app" className="text-link">Inspect a failing run<ArrowRight size={15} /></a><span className="preview-note">Alert timeline shown as a product preview.</span></Reveal></section>
    <HowItWorks />
    <section className="final-cta tl-section"><Reveal><div className="cta-symbol"><GitBranch size={30} strokeWidth={1.5} /></div><Eyebrow>LESS GUESSWORK. BETTER AGENTS.</Eyebrow><h2>Your next deploy.<br />With the evidence.</h2><p>See what your agent did. Know what to change.</p><Button>Get started</Button><span className="final-caption">Explore the demo. No API key needed.</span></Reveal></section>
    </div></main><footer className="tl-footer"><div className="tl-container"><div className="footer-main"><a href="/" aria-label="TraceLab home"><Logo /></a><p>Good outputs start with good evidence.</p><nav aria-label="Footer navigation"><a href="#product">Product</a><a href="/app">Workspace</a><a href="#how-it-works">Workflow</a><a href="/docs">Docs</a></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} TraceLab</span><span><span className="live-dot" />Interactive demo</span><a href="#main">Back to top<ArrowUpRight size={12} /></a></div></div></footer></div>;
}
