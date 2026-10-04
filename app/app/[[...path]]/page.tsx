'use client';

import dynamic from 'next/dynamic';
import '../../../src/styles.css';

const Workspace = dynamic(() => import('../../../src/Workspace'), { ssr: false });
export default function Page() { return <Workspace />; }
