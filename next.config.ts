import type { NextConfig } from 'next';

const config: NextConfig = {
  turbopack: { root: process.cwd() },
  devIndicators: false,
  async rewrites() {
    const url = new URL(process.env.TRACELAB_BACKEND_URL ?? 'http://127.0.0.1:8000');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error('TRACELAB_BACKEND_URL must be an HTTP(S) origin without credentials, paths, queries or fragments.');
    }
    const backend = url.origin;
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/health', destination: `${backend}/health` },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;
