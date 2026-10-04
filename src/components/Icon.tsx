import type { CSSProperties } from 'react';

const paths: Record<string, string> = {
  runs: 'M4 5h16M4 12h16M4 19h16M8 3v4M15 10v4M11 17v4',
  compare: 'M4 7h13m-4-4 4 4-4 4M20 17H7m4-4-4 4 4 4',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  refresh: 'M20 6v5h-5M4 18v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3',
  tool: 'm14 5 5 5M3 21l8-8M13 3a6 6 0 0 0-7 7l-3 3 8 8 3-3a6 6 0 0 0 7-7l-4 4-4-4 4-4',
  model: 'M8 3H4v4M16 3h4v4M4 17v4h4M20 17v4h-4M8 8h8v8H8z',
  branch: 'M6 3v18M6 8h7a5 5 0 0 1 5 5v8M3 3h6M15 21h6M3 21h6',
  eval: 'M8 3h8v4H8zM8 5H5v16h14V5h-3M8 12l2 2 5-5M8 18h7',
  link: 'm10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 17a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1',
  chevron: 'm9 5 7 7-7 7',
  clock: 'M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  info: 'M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  key: 'M14 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 11l9 9M17 16l3-3M20 19l3-3',
  copy: 'M9 9h11v11H9zM5 15H3V3h12v2',
  logout: 'M9 3H4v18h5M11 12h10m-4-4 4 4-4 4',
  google: 'M20 7a9 9 0 1 0 1 10v-5h-9M6 5l3 3M4 16l4-2',
  github: 'M9 19c-4 1-4-2-6-2m12 5v-4a3 3 0 0 0-1-2c4 0 7-2 7-6a5 5 0 0 0-2-4 5 5 0 0 0 0-4s-2 0-4 2a14 14 0 0 0-6 0C7 2 5 2 5 2a5 5 0 0 0 0 4 5 5 0 0 0-2 4c0 4 3 6 7 6a3 3 0 0 0-1 2v4',
};
export function Icon({ name, size = 18, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name] ?? paths.branch} /></svg>;
}
export function Mark() {
  return <svg className="brand-mark" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M4 5h7v7h7v7h6M4 12h7M11 19h7M18 5v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /><circle cx="24" cy="19" r="2" fill="currentColor" /></svg>;
}
