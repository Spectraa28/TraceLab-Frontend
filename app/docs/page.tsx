import type { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Mark } from '../../src/components/Icon';
import { CodeBlock, SetupCode } from '../../src/docs/CodeBlock';
import '../../src/styles.css';
import '../../src/docs/docs.css';

export const metadata: Metadata = {
  title: 'TraceLab Docs | Python SDK setup',
  description: 'Install the TraceLab Python SDK, create credentials, record your first trace, instrument agents and RAG workflows, and troubleshoot exports.',
};

const sections = [['quickstart', 'Quickstart'], ['credentials', 'Credentials'], ['tracing', 'Tracing & RAG'], ['evaluations', 'Usage & checks'], ['exports', 'Export & recovery'], ['troubleshooting', 'Troubleshooting']];
function Contents() {
  return <nav aria-label="Documentation sections">{sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav>;
}

const firstTrace = `import os
from pathlib import Path

from tracelab import TraceLabClient

client = TraceLabClient(
    base_url=os.environ["TRACELAB_URL"],
    api_key=os.environ["TRACELAB_API_KEY"],
    service_name="my-agent",
    spool_dir=Path.home() / ".tracelab" / "spool",
)

try:
    with client.trace("first-run", workflow_version="v1") as trace:
        with trace.span("normalize-input", "tool", input="  hello tracelab  ") as span:
            result = "  hello tracelab  ".strip()
            span.set_output(result)
        trace.set_output(result)
    print("Trace ID:", trace.trace_id)
    print("Export error:", client.last_export_error or "none")
finally:
    client.close()`;

const instrument = `def traced_answer(client, question, retrieve, call_model):
    with client.trace(
        "answer-question",
        workflow_version="prompt-v1",
        input={"question": question},
    ) as trace:
        with trace.span("retrieve-context", "retriever", input=question) as span:
            context = retrieve(question)
            span.set_output(context)

        with trace.span(
            "generate-answer",
            "llm",
            input={"question": question, "context": context},
        ) as span:
            answer = call_model(question, context)
            span.set_output(answer)

        trace.set_output(answer)
    return answer`;

const check = `def check_answer(trace, answer):
    with trace.span(
        "non-empty-answer",
        "evaluator",
        input=answer,
        attributes={"rubric_version": "non-empty-v1"},
    ) as span:
        passed = isinstance(answer, str) and bool(answer.strip())
        span.set_output({"passed": passed, "score": 1 if passed else 0})
        if not passed:
            span.set_error("Answer is empty.")
    return passed`;

export default function DocsPage() {
  return <div className="docs-shell"><a className="docs-skip" href="#docs-content">Skip to documentation</a>
    <header className="docs-header"><div className="docs-header-inner"><a href="/" className="brand" aria-label="TraceLab home"><Mark /><span>TraceLab</span></a><a href="/docs" className="docs-header-label" aria-current="page">Docs</a><nav aria-label="Documentation header"><a href="https://pypi.org/project/tracelab-sdk/0.1.0/">Python SDK<ArrowUpRight size={14} /></a><a href="/app" className="primary-button">Open workspace<ArrowUpRight size={15} /></a></nav></div></header>
    <div className="docs-layout"><aside className="docs-sidebar"><p>Python SDK</p><Contents /><div className="docs-sidebar-bottom"><span>SDK 0.1.0</span><span>Python 3.11+</span><a href="https://pypi.org/project/tracelab-sdk/0.1.0/">View package<ArrowUpRight size={13} /></a></div></aside>
      <main id="docs-content" className="docs-article"><div className="docs-intro"><h1>Get started with TraceLab.</h1><p>Connect your application. Capture a request. Follow the evidence in your workspace.</p><div className="docs-requirements"><span>Python 3.11+</span><span>SDK 0.1.0</span><span>A project API key</span></div></div>
        <details className="docs-mobile-contents"><summary>On this page<ChevronDown size={16} /></summary><Contents /></details>
        <section id="quickstart" className="docs-section" aria-labelledby="quickstart-title"><h2 id="quickstart-title">Send your first trace.</h2><p>This example checks the connection without calling a model. Use an existing TraceLab deployment and run these commands in your application’s folder.</p>
          <h3>1. Install the SDK</h3><p>Create a virtual environment so the SDK stays separate from your system Python. Then install the version covered by this guide.</p><SetupCode kind="install" /><p className="docs-caption">Already have a virtual environment? Activate it and run the install command. <a href="https://docs.python.org/3/library/venv.html">About Python environments<ArrowUpRight size={12} /></a></p>
          <h3>2. Create a project key</h3><p><a href="/app/credentials">Sign in and open Credentials</a>. Give your key a name, choose an expiry, and select <strong>Create key</strong>. Save the full key when it appears; it is shown only once.</p>
          <h3>3. Set your connection</h3><p>Copy the <strong>API endpoint</strong> from Credentials. Replace both values below with that endpoint and your new key. Set them in the terminal where you will run Python.</p><SetupCode kind="environment" /><p className="docs-caption">Use your project API key here. Google, GitHub, and model-provider credentials are different credentials.</p>
          <h3>4. Record a request</h3><p>Save this as <code>first_trace.py</code>. It records a real operation, sends the trace when the context closes, and prints the trace ID.</p><CodeBlock label="first_trace.py" code={firstTrace} /><CodeBlock label="Run first trace" code="python first_trace.py" />
          <div className="docs-next"><div><strong>Find it in your workspace.</strong><p>If the export error is <code>none</code>, open Runs, refresh, and search for <code>first-run</code> or the printed trace ID. The workspace must be connected to the same project.</p></div><a href="/app" className="text-button">Open Runs<ArrowRight size={15} /></a></div>
        </section>
        <section id="credentials" className="docs-section" aria-labelledby="credentials-title"><h2 id="credentials-title">Credentials</h2><p>A project key authenticates SDK ingestion. Your Google or GitHub sign-in gives you access to create and manage those keys in the workspace.</p><ul><li>Keep keys in your application’s server environment or secret manager. Never embed them in browser code or commit them to a repository.</li><li>Keys are scoped to one project. Create a separate key for each application or environment so you can revoke access independently.</li><li>Rotate a key by creating its replacement, updating your application, verifying an export, then revoking the old key.</li><li>An expired or revoked key cannot ingest traces. Create a replacement in Credentials.</li></ul><a href="/app/credentials" className="text-button">Manage credentials<ArrowRight size={15} /></a></section>
        <section id="tracing" className="docs-section" aria-labelledby="tracing-title"><h2 id="tracing-title">Trace your agent or RAG workflow.</h2><p>A trace describes one request. Spans describe the operations inside it: retrieval, model calls, tools, and checks. Nest spans inside the same trace to keep their parent relationships.</p><p>Pass a shared <code>TraceLabClient</code> and your existing retrieval and model functions to this wrapper. The retrieval function receives the question; the model function receives the question and retrieved context.</p><CodeBlock label="Instrument a RAG workflow" code={instrument} /><p>Return JSON-serializable inputs and outputs: strings, numbers, booleans, lists, dictionaries, or <code>None</code>. Extract the relevant fields from provider response objects before recording them.</p><p>Reuse the client across requests and call <code>client.close()</code> at application shutdown. The client is synchronous; account for export time in your request path.</p>
          <div className="docs-table-scroll" tabIndex={0} aria-label="Trace and span API reference"><table><thead><tr><th>Method</th><th>What it records</th></tr></thead><tbody><tr><td><code>client.trace(name, workflow_version=...)</code></td><td>A request and its application or prompt version.</td></tr><tr><td><code>trace.span(name, kind, input=...)</code></td><td>A timed operation, nested in the current span.</td></tr><tr><td><code>span.set_output(value)</code></td><td>The operation’s result.</td></tr><tr><td><code>trace.set_output(value)</code></td><td>The request’s final result.</td></tr><tr><td><code>span.set_attribute(name, value)</code></td><td>Additional operation metadata.</td></tr><tr><td><code>span.set_error(message)</code></td><td>A failed operation without raising an exception.</td></tr></tbody></table></div><p className="docs-caption">Useful span kinds include <code>agent</code>, <code>llm</code>, <code>tool</code>, <code>retriever</code>, <code>embedding</code>, and <code>evaluator</code>. Uncaught exceptions inside a span are recorded and re-raised.</p></section>
        <section id="evaluations" className="docs-section" aria-labelledby="evaluations-title"><h2 id="evaluations-title">Record usage and checks.</h2><h3>Token counts and cost</h3><p>Inside an LLM span, call <code>set_usage</code> with provider-reported counts. These example counts are illustrative; replace them with the usage returned by your model.</p><CodeBlock label="Record provider usage" code={'span.set_usage(input_tokens=12, output_tokens=7)'} /><p>You can also supply <code>cached_input_tokens</code>, <code>reasoning_tokens</code>, and <code>cost_usd</code>. The SDK records the cost you supply; it does not calculate model prices.</p><h3>Explicit evaluation</h3><p>Implement a check and record it in an <code>evaluator</code> span. Call this helper inside your trace after obtaining an answer. A non-empty answer check is a connection example, not a correctness or faithfulness evaluation.</p><CodeBlock label="Record an evaluation check" code={check} /><p>Inspect the evaluator in the run’s trajectory. Use <code>workflow_version</code> to label changes, rerun the same inputs, and choose a baseline and candidate in <strong>Compare runs</strong>.</p><div className="docs-note"><strong>What the SDK does today</strong><p>Instrumentation and checks are explicit. The SDK does not automatically intercept model calls, judge answers, create evaluation datasets or experiment reports, or send regression notifications. Automated regression notifications are upcoming.</p></div></section>
        <section id="exports" className="docs-section" aria-labelledby="exports-title"><h2 id="exports-title">Export and recovery</h2><p>A trace exports when its <code>with</code> block exits. Exports are synchronous, with bounded retries for transient failures. An export failure emits a warning and preserves your application’s result or original exception.</p><p>Set <code>spool_dir</code> when creating the client to save failed HTTP exports to private JSON files. The Quickstart uses <code>.tracelab/spool</code> inside your home directory, outside your application’s repository. After restoring the connection, replay them with the same client configuration:</p><CodeBlock label="Retry saved exports" code={'sent = client.retry_exports()\nprint("Recovered traces:", sent)'} /><p>Successfully acknowledged files are removed; unsuccessful files remain. Keep the spool directory writable and outside your repository. Retry errors propagate, so handle them in your recovery job.</p><p>Common credential fields and email addresses are redacted before export and spooling. This filtering is conservative and does not detect all sensitive information. Record only the fields your team needs.</p></section>
        <section id="troubleshooting" className="docs-section" aria-labelledby="troubleshooting-title"><h2 id="troubleshooting-title">Troubleshooting</h2><div className="docs-troubleshooting">
          <details><summary>pip reports “externally-managed-environment”<ChevronDown size={16} /></summary><p>Your operating system manages its Python installation. Use the virtual environment commands in <a href="#quickstart">Quickstart</a>, then run pip inside that environment.</p></details>
          <details><summary>PowerShell cannot activate the environment<ChevronDown size={16} /></summary><p>You can use the environment’s Python directly without activation:</p><CodeBlock label="Install without PowerShell activation" code={'.\\.venv\\Scripts\\python.exe -m pip install tracelab-sdk==0.1.0\n.\\.venv\\Scripts\\python.exe first_trace.py'} /><p>Set the environment variables before running the trace.</p></details>
          <details><summary>The SDK import fails<ChevronDown size={16} /></summary><p>Install and run with the same Python interpreter. Activate your application’s environment, then check the installed package:</p><CodeBlock label="Check SDK installation" code={'python -m pip show tracelab-sdk\npython -c "from tracelab import TraceLabClient; print(\'SDK available\')"'} /></details>
          <details><summary>A trace does not appear in Runs<ChevronDown size={16} /></summary><p>Wait for the trace context to close, refresh Runs, and search by trace ID. Confirm that your key belongs to the project open in the workspace. Inspect <code>client.last_export_error</code> and any export warning. Verify the API endpoint from Credentials and check whether a file was saved to your spool directory.</p></details>
          <details><summary>Export reports HTTPStatusError or an authentication failure<ChevronDown size={16} /></summary><p>An <code>HTTPStatusError</code> means the API returned an unsuccessful HTTP status. The SDK warning reports the error class, not the status code. Confirm that your key is active and was issued by the deployment at your API endpoint. Copy the endpoint from Credentials and create a replacement key if needed. If those values are correct, ask your deployment operator to inspect the server response.</p></details>
          <details><summary>Tokens, cost, or evaluation results are missing<ChevronDown size={16} /></summary><p>Those fields are explicit. Attach usage with <code>span.set_usage(...)</code>, supply cost if needed, and record your own evaluator spans. Instrumentation alone does not score answers. The Evaluations page shows experiment reports; the Python SDK does not create those reports automatically.</p></details>
        </div></section>
        <footer className="docs-footer"><span>Python SDK 0.1.0</span><a href="https://pypi.org/project/tracelab-sdk/0.1.0/">Package on PyPI<ArrowUpRight size={14} /></a><a href="#docs-content">Back to top<ArrowUpRight size={14} /></a></footer>
      </main>
    </div>
  </div>;
}
