import React, { useState } from 'react';
import { getStudyAnswer } from '../services/geminiService';
import { AppLanguage } from '../services/translations';
import { User as UserType } from '../types';

interface Props {
  user?: UserType;
  language: AppLanguage;
  isTagMode: boolean;
}

export function HomeworkSolver({ user, language, isTagMode }: Props) {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const studentContext = user ? { name: user.name, school: user.school, className: user.className } : undefined;
      const result = await getStudyAnswer(prompt, undefined, studentContext, language);
      setAnswer(result);
    } catch (error) {
      setAnswer("Sorry, I couldn't solve that right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isTagMode ? 'bg-slate-950 border-cyan-500/50' : 'bg-white border-slate-150/70'}`}>
      <h3 className={`text-xl font-bold ${isTagMode ? 'text-cyan-400' : 'text-slate-800'}`}>Homework Solver</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your homework question here..."
        className={`w-full p-3 rounded-xl border focus:ring-2 ${isTagMode ? 'bg-slate-900 border-cyan-800 text-cyan-100 focus:ring-cyan-600' : 'border-slate-200 focus:ring-emerald-400'}`}
        rows={4}
      />
      <button
        onClick={handleSolve}
        disabled={loading}
        className={`w-full py-2 rounded-xl font-semibold disabled:opacity-50 ${isTagMode ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
      >
        {loading ? 'Solving...' : 'Solve'}
      </button>
      {answer && (
        <div className={`mt-4 p-4 rounded-xl ${isTagMode ? 'bg-cyan-950 text-cyan-200' : 'bg-slate-50 text-slate-700'}`}>
          <h4 className="font-semibold mb-2">Answer:</h4>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      )}
    </div>
  );
}
