'use client';
import '../../lib/amplifyClient';
import { useEffect, useState } from 'react';
import { get } from '@aws-amplify/api';
import { getCurrentUser, signOut } from '@aws-amplify/auth';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Record {
  tenantId: string;
  'timestamp#functionName': string;
  initDurationMs: number;
  memorySizeMb: number;
  cost: number;
}

export default function DashboardPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        await getCurrentUser();
        const { body } = await get({ apiName: 'metrics', path: '/' }).response;
        const data = (await body.json()) as unknown as Record[];
        setRecords(data);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      }
    }
    load();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Cold Start Metrics</h1>
      {error && <p className="text-red-600">{error}</p>}
      <LineChart width={600} height={300} data={records} className="mb-8">
        <XAxis dataKey={'timestamp#functionName'} tick={false} />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Line type="monotone" dataKey="initDurationMs" stroke="#8884d8" />
      </LineChart>
      <button
        className="bg-gray-800 text-white px-4 py-2 rounded"
        onClick={() => signOut().then(() => (window.location.href = '/'))}
      >
        Sign Out
      </button>
    </div>
  );
}
