import React from 'react';
import { Icon, Icons } from './icons.jsx';
import { DIFFICULTY, VERDICT_COLORS, STRATEGIES } from './constants.js';

export const StatCard = ({ label, value, icon, color, sub, subColor }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col items-center text-center">
    <Icon path={icon} size={16} className={`${color} mb-1`} />
    <div className={`text-xl font-black ${color}`}>{value}</div>
    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{label}</div>
    {sub && <div className="text-[10px] mt-0.5" style={subColor ? {color: subColor} : {color:'#64748b'}}>{sub}</div>}
  </div>
);

export const DifficultyChart = ({ diffDist, maxCount, total }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
      <Icon path={Icons.Chart} size={16} className="text-emerald-400" /> Difficulty Distribution
    </h3>
    <div className="text-[10px] text-slate-600 mb-4">Quick estimate (no human sim)</div>
    <div className="flex items-end gap-1.5 justify-between" style={{ height: 200 }}>
      {DIFFICULTY.map((d, i) => {
        const count = diffDist[i];
        const pct = maxCount > 0 ? count / maxCount : 0;
        const h = Math.max(4, pct * 160);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[10px] font-bold text-slate-400">{count}</div>
            <div className="w-full flex justify-center">
              <div className="chart-bar w-full max-w-[36px] rounded-t-md relative group cursor-default"
                style={{ height: h, backgroundColor: d.color }}>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap border border-slate-700 z-10">
                  {d.label}: {count} ({total > 0 ? ((count/total)*100).toFixed(1) : 0}%)
                </div>
              </div>
            </div>
            <div className="text-[10px] font-bold" style={{ color: d.color }}>{i + 1}</div>
            <div className="text-[7px] text-slate-500 leading-tight text-center">{d.label}</div>
          </div>
        );
      })}
    </div>
  </div>
);

export const VerdictChart = ({ entries, maxCount, total }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Icon path={Icons.Info} size={16} className="text-blue-400" /> Verdict Breakdown
    </h3>
    <div className="space-y-3">
      {entries.map(v => {
        const pct = ((v.count / total) * 100).toFixed(1);
        const barPct = (v.count / maxCount) * 100;
        const clr = VERDICT_COLORS[v.label] || '#64748b';
        return (
          <div key={v.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold" style={{color: clr}}>{v.label}</span>
              <span className="text-xs text-slate-400 font-mono">{v.count} ({pct}%)</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, backgroundColor: clr }} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const StrategyChart = ({ entries, maxCount }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Icon path={Icons.Zap} size={16} className="text-amber-400" /> Best Strategy (Wins)
    </h3>
    <div className="space-y-2">
      {entries.slice(0, 10).map(([strat, count]) => {
        const barPct = (count / maxCount) * 100;
        const info = STRATEGIES[strat];
        return (
          <div key={strat}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-slate-300 truncate">{info ? info.name : strat}</span>
              <span className="text-xs text-slate-400 font-mono ml-2">{count}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${barPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export const HardestDecks = ({ decks }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
      <Icon path={Icons.Brain} size={16} className="text-red-400" /> Hardest Decks (Top 10)
    </h3>
    <div className="overflow-x-auto custom-scroll">
      <table className="w-full text-sm text-left text-slate-400">
        <thead className="bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Game ID</th>
            <th className="px-3 py-2">Difficulty</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Moves</th>
            <th className="px-3 py-2">Strategy</th>
            <th className="px-3 py-2">Pulls</th>
            <th className="px-3 py-2">AI Wins</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {decks.map((r, i) => (
            <tr key={i} className="hover:bg-slate-800/50 transition">
              <td className="px-3 py-2 text-slate-500 font-mono">{i + 1}</td>
              <td className="px-3 py-2 font-mono text-emerald-500">{r.id}</td>
              <td className="px-3 py-2">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: r.diffLevel.color + '20', color: r.diffLevel.color }}>
                  Lv.{r.diffLevel.level} {r.diffLevel.label}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-white">{r.quickDiffScore}</td>
              <td className="px-3 py-2 font-mono text-white">{r.moves}</td>
              <td className="px-3 py-2 text-xs text-slate-300">{r.strat}</td>
              <td className="px-3 py-2 font-mono text-amber-400">{r.pulls}</td>
              <td className="px-3 py-2 font-mono text-slate-300">{r.winCount}/{18}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const Legend = () => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-xs text-slate-400">
    <div className="flex items-center gap-2"><Icon path={Icons.Smile} className="text-emerald-400"/> Easy (&lt; 115 moves)</div>
    <div className="flex items-center gap-2"><Icon path={Icons.Check} className="text-slate-300"/> Standard</div>
    <div className="flex items-center gap-2"><Icon path={Icons.Brain} className="text-purple-400"/> Brain Teaser (&gt; 4 pulls)</div>
    <div className="flex items-center gap-2"><Icon path={Icons.Refresh} className="text-amber-500"/> Grind (&gt; 5 recycles)</div>
    <div className="flex items-center gap-2"><Icon path={Icons.Zap} className="text-orange-400"/> Marathon (&gt; 150 moves)</div>
  </div>
);
