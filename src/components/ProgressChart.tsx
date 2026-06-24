import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const dataSets = {
  7: [
    { name: 'Mon', progress: 10 },
    { name: 'Tue', progress: 30 },
    { name: 'Wed', progress: 20 },
    { name: 'Thu', progress: 50 },
    { name: 'Fri', progress: 40 },
    { name: 'Sat', progress: 70 },
    { name: 'Sun', progress: 90 },
  ],
  14: Array.from({ length: 14 }, (_, i) => ({ name: `Day ${i + 1}`, progress: Math.floor(Math.random() * 100) })),
  30: Array.from({ length: 30 }, (_, i) => ({ name: `Day ${i + 1}`, progress: Math.floor(Math.random() * 100) })),
};

export function ProgressChart({ isTagMode }: { isTagMode: boolean }) {
  const [range, setRange] = useState<7 | 14 | 30>(7);

  return (
    <div className={`h-72 w-full p-4 rounded-3xl border shadow-xs ${isTagMode ? 'bg-slate-950 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white border-slate-150/70'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xs font-extrabold tracking-tight uppercase ${isTagMode ? 'text-cyan-400' : 'text-slate-800'}`}>Learning Progress</h3>
        <div className={`flex gap-1 p-0.5 rounded-lg ${isTagMode ? 'bg-cyan-950' : 'bg-slate-100'}`}>
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 14 | 30)}
              className={`text-[10px] px-2 py-1 rounded-md font-semibold ${
                range === r 
                  ? (isTagMode ? 'bg-cyan-900 text-cyan-300' : 'bg-white text-indigo-600 shadow-sm') 
                  : (isTagMode ? 'text-cyan-700' : 'text-slate-500')
              }`}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={dataSets[range]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isTagMode ? "#22d3ee" : "#6366f1"} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={isTagMode ? "#22d3ee" : "#6366f1"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" fontSize={10} stroke={isTagMode ? "#22d3ee" : "#94a3b8"} />
          <YAxis fontSize={10} stroke={isTagMode ? "#22d3ee" : "#94a3b8"} />
          <Tooltip 
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isTagMode ? '#0f172a' : '#fff', color: isTagMode ? '#22d3ee' : '#000' }}
          />
          <Area type="monotone" dataKey="progress" stroke={isTagMode ? "#22d3ee" : "#6366f1"} fillOpacity={1} fill="url(#colorProgress)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
