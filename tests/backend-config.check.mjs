import assert from 'node:assert/strict';
import test from 'node:test';
import config from '../next.config.ts';

test('deployment proxy uses the configured backend and rejects unsafe origins', async () => {
  const previous = process.env.TRACELAB_BACKEND_URL;
  try {
    process.env.TRACELAB_BACKEND_URL = 'https://api.my-tracelab.example:8443/';
    assert.deepEqual(await config.rewrites(), [
      { source: '/api/:path*', destination: 'https://api.my-tracelab.example:8443/api/:path*' },
      { source: '/health', destination: 'https://api.my-tracelab.example:8443/health' },
    ]);
    for (const value of ['ftp://api.example.com', 'https://user:password@api.example.com',
      'https://api.example.com/path', 'https://api.example.com?target=other', 'https://api.example.com#fragment']) {
      process.env.TRACELAB_BACKEND_URL = value;
      await assert.rejects(config.rewrites(), /must be an HTTP\(S\) origin/);
    }
  } finally {
    if (previous === undefined) delete process.env.TRACELAB_BACKEND_URL;
    else process.env.TRACELAB_BACKEND_URL = previous;
  }
});
