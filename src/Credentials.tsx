import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createCredential, getCredentials, revokeCredential, type Account, type IssuedCredential } from './auth';
import { Icon } from './components/Icon';
import { formatDate } from './format';

export function Credentials({ account }: { account: Account }) {
  const client = useQueryClient();
  const keys = useQuery({ queryKey: ['credentials', account.user.id], queryFn: getCredentials });
  const [name, setName] = useState('');
  const [days, setDays] = useState(90);
  const [pending, setPending] = useState(false);
  const [issued, setIssued] = useState<IssuedCredential | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'endpoint' | 'key' | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const reveal = useRef<HTMLElement>(null);
  useEffect(() => {
    if (issued) {
      reveal.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      reveal.current?.querySelector('h2')?.focus({ preventScroll: true });
    }
  }, [issued]);

  async function create(event: FormEvent) {
    event.preventDefault(); setPending(true); setError(''); setCopied(null);
    try {
      setIssued(await createCredential(name.trim(), days, account.csrf_token)); setName('');
      await client.invalidateQueries({ queryKey: ['credentials', account.user.id] });
    } catch (exc) { setError(exc instanceof Error ? exc.message : 'Could not create a key. Try again.'); }
    finally { setPending(false); }
  }
  async function revoke(id: string) {
    setRevoking(id); setError('');
    try {
      await revokeCredential(id, account.csrf_token);
      if (issued?.id === id) setIssued(null);
      setConfirm(null);
      await client.invalidateQueries({ queryKey: ['credentials', account.user.id] });
    } catch (exc) { setError(exc instanceof Error ? exc.message : 'Could not revoke this key. Try again.'); }
    finally { setRevoking(null); }
  }
  async function copy(value: string, target: 'endpoint' | 'key') {
    try { await navigator.clipboard.writeText(value); setCopied(target); }
    catch { setError('Clipboard access failed. Select the endpoint or key and copy it.'); }
  }

  return <main className="page credentials-page">
    <div className="page-title"><div><h1>Connect your agent.</h1><p>Your API endpoint and credentials, in one place.</p></div></div>
    <div className="credential-layout">
      <section className="credential-create" aria-labelledby="create-key-title">
        <div className="credential-section-heading"><Icon name="key" /><h2 id="create-key-title">Create a credential</h2></div>
        <p>Keys grant SDK access to this project’s traces. Keep them in your server environment.</p>
        <form onSubmit={create}>
          <label htmlFor="credential-name">Key name</label>
          <input id="credential-name" placeholder="production-agent" value={name} onChange={event => setName(event.target.value)} maxLength={100} required disabled={pending || !!issued} autoComplete="off" />
          <label htmlFor="credential-expiry">Expires after</label>
          <select id="credential-expiry" value={days} onChange={event => setDays(Number(event.target.value))} disabled={pending || !!issued}>
            <option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>1 year</option>
          </select>
          <button className="primary-button" disabled={pending || !name.trim() || !!issued}>{pending ? 'Creating…' : 'Create key'}<Icon name="arrow" size={16} /></button>
        </form>
      </section>
      <section className="credential-connection" aria-labelledby="connection-title"><h2 id="connection-title">Project connection</h2>
        <dl><div><dt>API endpoint</dt><dd><code>{account.ingest_url}</code></dd></div><div><dt>Project ID</dt><dd><code>{account.project.id}</code></dd></div></dl>
        <button className="secondary-button" onClick={() => void copy(account.ingest_url, 'endpoint')}>{copied === 'endpoint' ? 'Copied endpoint' : 'Copy endpoint'}<Icon name={copied === 'endpoint' ? 'check' : 'copy'} size={16} /></button>
        <p role="status">{copied === 'endpoint' ? 'API endpoint copied to clipboard.' : 'Keys are scoped to this project.'}</p><a href="/docs#quickstart" className="text-button">SDK setup guide<Icon name="arrow" size={14} /></a>
      </section>
    </div>
    {error && <p className="credential-error" role="alert">{error}</p>}
    {issued && <section ref={reveal} className="credential-reveal" aria-labelledby="save-key-title" role="region">
      <div><span className="credential-reveal-icon"><Icon name="check" /></span><h2 id="save-key-title" tabIndex={-1}>Save this key now.</h2></div>
      <p>This is the only time the full key is shown. Copy it into your application before dismissing.</p>
      <pre aria-label="New API key">{issued.key}</pre>
      <div className="credential-reveal-actions"><button className="primary-button" onClick={() => void copy(issued.key, 'key')}>{copied === 'key' ? 'Copied key' : 'Copy key'}<Icon name={copied === 'key' ? 'check' : 'copy'} size={16} /></button><button className="secondary-button" onClick={() => { setIssued(null); setCopied(null); }}>I’ve saved the key</button><span role="status">{copied === 'key' ? 'API key copied to clipboard.' : ''}</span></div>
    </section>}
    <section className="credential-list" aria-labelledby="project-keys-title">
      <div className="section-title"><h2 id="project-keys-title">Project keys <span>{keys.data?.items.length ?? 0}</span></h2><button className="icon-button" aria-label="Refresh keys" onClick={() => void keys.refetch()} disabled={keys.isFetching}><Icon name="refresh" /></button></div>
      {keys.isLoading ? <p role="status">Loading credentials…</p> : keys.error ? <div className="error-state" role="alert"><p>Could not load your keys.</p><button className="secondary-button" onClick={() => void keys.refetch()}>Try again</button></div> : !keys.data?.items.length ? <div className="credential-empty"><Icon name="key" size={24} /><div><h3>No project keys yet</h3><p>Create your first key above to connect an agent.</p></div></div> :
      <div className="credential-rows">{keys.data.items.map(key => {
        const expired = !!key.expires_at && new Date(key.expires_at).getTime() <= Date.now();
        const active = !key.revoked_at && !expired;
        return <article className="credential-row" key={key.id}>
          <div className="credential-identity"><strong>{key.name}</strong><code>{key.prefix}…</code></div>
          <div className="credential-dates"><span>Created {formatDate(key.created_at)}</span><span>{key.last_used_at ? `Last used ${formatDate(key.last_used_at)}` : 'Not used yet'}</span><span>{key.expires_at ? `Expires ${formatDate(key.expires_at)}` : 'No expiry'}</span></div>
          <span className={`credential-state ${active ? 'active' : ''}`}>{key.revoked_at ? 'Revoked' : expired ? 'Expired' : 'Active'}</span>
          {active && <div className="credential-revoke">{confirm === key.id ? <><p>Agents using this key will lose access.</p><button className="secondary-button" onClick={() => void revoke(key.id)} disabled={!!revoking}>{revoking === key.id ? 'Revoking…' : 'Revoke key'}</button><button className="text-button" onClick={() => setConfirm(null)} disabled={!!revoking}>Keep key</button></> : <button className="text-button" onClick={() => setConfirm(key.id)} disabled={!!revoking}>Revoke</button>}</div>}
        </article>;
      })}</div>}
    </section>
    <div className="credential-account"><span>Signed in as <strong>{account.user.email ?? account.user.name}</strong> via {account.user.provider === 'github' ? 'GitHub' : 'Google'}.</span><span>Project <code>{account.project.id}</code></span></div>
  </main>;
}
