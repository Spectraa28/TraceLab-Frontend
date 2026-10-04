'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: 1, refetchOnWindowFocus: false } } });
export default function Workspace() {
  return <QueryClientProvider client={queryClient}><BrowserRouter basename="/app"><App /></BrowserRouter></QueryClientProvider>;
}
