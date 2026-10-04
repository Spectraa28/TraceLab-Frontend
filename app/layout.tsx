import type { Metadata } from 'next';
import localFont from 'next/font/local';

const GeistSans = localFont({ src: '../public/fonts/geist-sans-latin.woff', variable: '--font-geist-sans', weight: '100 900', display: 'swap' });
const GeistMono = localFont({ src: '../public/fonts/geist-mono-latin.woff', variable: '--font-geist-mono', weight: '100 900', display: 'swap', adjustFontFallback: false, preload: false });

export const metadata: Metadata = {
  title: 'TraceLab — See the trace. Ship with confidence.',
  description: 'Trace your LLM calls, evaluate outputs, and catch regressions. An observability and evaluation workspace for AI engineers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}><body style={{ margin: 0 }}>{children}</body></html>;
}
