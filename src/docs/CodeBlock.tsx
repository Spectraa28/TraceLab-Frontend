'use client';

import { useState, type KeyboardEvent } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState('');
  const [error, setError] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(code); setError(false); }
    catch { setError(true); }
  }
  return <figure className="docs-code"><figcaption><span>{label}</span><button type="button" aria-label={`Copy ${label}`} onClick={() => void copy()}>{copied === code ? <Check size={14} /> : <Copy size={14} />}{copied === code ? 'Copied' : 'Copy'}</button></figcaption><pre tabIndex={0} aria-label={label}><code>{code}</code></pre><span className="sr-only" role="status">{copied === code ? `${label} copied to clipboard.` : ''}</span>{error && <p role="alert">Clipboard access failed. Select the code and copy it manually.</p>}</figure>;
}

const platforms = ['macOS / Linux', 'Windows PowerShell'] as const;
const install = [
  'python -m venv .venv\nsource .venv/bin/activate\npython -m pip install tracelab-sdk==0.1.0',
  'python -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npython -m pip install tracelab-sdk==0.1.0',
];
const environment = [
  'export TRACELAB_URL="YOUR_API_ENDPOINT"\nexport TRACELAB_API_KEY="YOUR_PROJECT_KEY"',
  '$env:TRACELAB_URL = "YOUR_API_ENDPOINT"\n$env:TRACELAB_API_KEY = "YOUR_PROJECT_KEY"',
];

export function SetupCode({ kind }: { kind: 'install' | 'environment' }) {
  const [platform, setPlatform] = useState(0);
  function navigate(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - platform;
    setPlatform(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  }
  return <div className="docs-setup"><div role="tablist" aria-label={`${kind} platform`} className="docs-platforms">{platforms.map((name, index) => <button type="button" key={name} id={`${kind}-tab-${index}`} role="tab" aria-selected={platform === index} aria-controls={`${kind}-code`} tabIndex={platform === index ? 0 : -1} onKeyDown={navigate} onClick={() => setPlatform(index)}>{name}</button>)}</div><div id={`${kind}-code`} role="tabpanel" aria-labelledby={`${kind}-tab-${platform}`}><CodeBlock label={kind === 'install' ? 'Install SDK' : 'Environment variables'} code={(kind === 'install' ? install : environment)[platform]} /></div></div>;
}
