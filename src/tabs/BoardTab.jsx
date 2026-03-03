import React, { useState } from 'react';
import { Icon, Icons } from '../icons.jsx';
import { DEFAULT_DECK } from '../constants.js';
import { solvePortfolio, getVerdict } from '../solver.js';

export const BoardTab = () => {
  const [deckInput, setDeckInput] = useState(DEFAULT_DECK);
  const [singleResult, setSingleResult] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
      {singleResult ? (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md animate-pop shadow-2xl">
          <div className="mb-4 text-5xl">{singleResult.status === 'won' ? '\u{1F389}' : '\u{1F480}'}</div>
          <h3 className={`text-3xl font-black mb-2 ${singleResult.status === 'won' ? 'text-emerald-400' : 'text-red-500'}`}>{singleResult.status.toUpperCase()}</h3>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Game DNA</div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Icon path={singleResult.verdict.icon} className={`w-8 h-8 ${singleResult.verdict.color}`} />
              <span className={`text-2xl font-bold ${singleResult.verdict.color}`}>{singleResult.verdict.label}</span>
            </div>
            <div className="text-sm text-slate-400">{singleResult.verdict.desc}</div>
          </div>
          <button onClick={() => setSingleResult(null)} className="text-slate-400 hover:text-white text-sm underline">Try another deck</button>
        </div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md">
          <Icon path={Icons.Brain} size={48} className="mx-auto mb-4 text-purple-500" />
          <h3 className="text-xl font-bold text-white mb-2">Single Game Analysis</h3>
          <textarea value={deckInput} onChange={e => setDeckInput(e.target.value)} className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none resize-none mb-4" />
          <button onClick={() => {
            const { result, strat } = solvePortfolio(deckInput, 1);
            const v = getVerdict(result);
            setSingleResult({ ...result, strat, verdict: v });
          }} className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-500 transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
            <Icon path={Icons.Zap} /> Analyze & Solve
          </button>
        </div>
      )}
    </div>
  );
};
