import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from '../types';
import { translate } from '../services/translations';

export function ProgressChart({ progress = [], isTagMode, language }: { progress?: Progress[]; isTagMode: boolean; language: any }) {
  const [range, setRange] = useState<7 | 14 | 30>(7);

  // Parse and group real progress data dynamically
  const getChartData = () => {
    const data = [];
    const now = new Date();
    
    // Create an array of the last N days
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Find progress entries on this day
      const entriesOnDay = progress.filter(p => {
        const pDate = p.date ? p.date.split('T')[0] : '';
        return pDate === dateStr;
      });
      
      let progressVal = 0;
      if (entriesOnDay.length > 0) {
        const sumPct = entriesOnDay.reduce((acc, curr) => acc + (curr.score / curr.total) * 100, 0);
        progressVal = Math.round(sumPct / entriesOnDay.length);
      }
      
      // Label formatting
      let name = '';
      if (range === 7) {
        const daysOfWeek = [
          translate('sun', language, 'Sun'),
          translate('mon', language, 'Mon'),
          translate('tue', language, 'Tue'),
          translate('wed', language, 'Wed'),
          translate('thu', language, 'Thu'),
          translate('fri', language, 'Fri'),
          translate('sat', language, 'Sat')
        ];
        name = daysOfWeek[d.getDay()];
      } else {
        name = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      }
      
      data.push({ name, progress: progressVal });
    }
    
    return data;
  };

  const chartData = getChartData();
  const hasData = progress && progress.length > 0;

  return (
    <div className={`h-72 w-full p-4 rounded-3xl border shadow-xs flex flex-col justify-between ${isTagMode ? 'bg-slate-950 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white border-slate-150/70'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xs font-extrabold tracking-tight uppercase ${isTagMode ? 'text-cyan-400' : 'text-slate-800'}`}>
          {translate('learning_progress', language, 'Learning Progress')}
        </h3>
        {hasData && (
          <div className={`flex gap-1 p-0.5 rounded-lg ${isTagMode ? 'bg-cyan-950' : 'bg-slate-100'}`}>
            {[7, 14, 30].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r as 7 | 14 | 30)}
                className={`text-[10px] px-2 py-1 rounded-md font-semibold ${
                  range === r 
                    ? (isTagMode ? 'bg-cyan-900 text-cyan-300' : 'bg-white text-indigo-600 shadow-sm') 
                    : (isTagMode ? 'text-cyan-700' : 'text-slate-500')
                }`}
              >
                {r}{translate('day_char', language, 'D')}
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
          <span className="text-3xl">📈</span>
          <p className={`text-xs font-bold ${isTagMode ? 'text-cyan-400' : 'text-slate-700'}`}>
            {translate('no_history', language, 'No quiz history recorded yet')}
          </p>
          <p className="text-[10px] text-slate-400 max-w-[240px]">
            {translate('complete_quiz_tip', language, 'Complete any Practice Quiz to log your daily learning curves and see real metrics here!')}
          </p>
        </div>
      ) : (
        <div className="flex-1 w-full h-[80%] min-h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isTagMode ? "#22d3ee" : "#6366f1"} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={isTagMode ? "#22d3ee" : "#6366f1"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" fontSize={10} stroke={isTagMode ? "#22d3ee" : "#94a3b8"} />
              <YAxis fontSize={10} stroke={isTagMode ? "#22d3ee" : "#94a3b8"} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
              <Tooltip 
                formatter={(value) => [`${value}%`, translate('average_progress', language, 'Average Progress')]}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isTagMode ? '#0f172a' : '#fff', color: isTagMode ? '#22d3ee' : '#000' }}
              />
              <Area type="monotone" dataKey="progress" stroke={isTagMode ? "#22d3ee" : "#6366f1"} fillOpacity={1} fill="url(#colorProgress)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
