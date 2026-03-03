import React, { useState, useMemo } from 'react';
import { Icon, Icons } from '../icons.jsx';
import { ORDERED_STRATS, DIFFICULTY } from '../constants.js';
import { solvePortfolio, getDifficultyLevel, getVerdict } from '../solver.js';
import { StatCard, DifficultyChart, VerdictChart, StrategyChart, HardestDecks, Legend } from '../components.jsx';

export const BatchTab = () => {
  const [games, setGames] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [drawMode, setDrawMode] = useState('3');
  const [batchConfig, setBatchConfig] = useState({ start: 0, count: 200 });
  const [results, setResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gameTypes, setGameTypes] = useState([]);

  const analytics = useMemo(() => {
    if (!results || results.length === 0) return null;
    const total = results.length;
    const wins = results.filter(r => r.status === 'won');
    const winRate = ((wins.length / total) * 100).toFixed(1);
    const avgMoves = wins.length > 0 ? Math.round(wins.reduce((a, r) => a + r.moves, 0) / wins.length) : 0;
    const avgDiff = wins.length > 0 ? Math.round(wins.reduce((a, r) => a + r.quickDiffScore, 0) / wins.length) : 0;
    const avgDiffLevel = getDifficultyLevel(avgDiff);
    const avgRecycles = wins.length > 0 ? (wins.reduce((a, r) => a + r.recycles, 0) / wins.length).toFixed(1) : '0';
    const avgPulls = wins.length > 0 ? (wins.reduce((a, r) => a + r.pulls, 0) / wins.length).toFixed(1) : '0';
    const sortedByDiff = [...wins].sort((a, b) => b.quickDiffScore - a.quickDiffScore);
    const hardest = sortedByDiff.slice(0, 10);
    const diffDist = Array(10).fill(0);
    results.forEach(r => { if (r.diffLevel) diffDist[r.diffLevel.level - 1]++; });
    const maxDiffCount = Math.max(...diffDist, 1);
    const verdictDist = {};
    results.forEach(r => {
      const l = r.verdict.label;
      if (!verdictDist[l]) verdictDist[l] = { count: 0, label: l };
      verdictDist[l].count++;
    });
    const verdictEntries = Object.values(verdictDist).sort((a, b) => b.count - a.count);
    const maxVerdictCount = Math.max(...verdictEntries.map(e => e.count), 1);
    const stratCounts = {};
    wins.forEach(r => { stratCounts[r.strat] = (stratCounts[r.strat] || 0) + 1; });
    const stratEntries = Object.entries(stratCounts).sort((a, b) => b[1] - a[1]);
    const maxStratCount = Math.max(...stratEntries.map(e => e[1]), 1);
    return { total, wins: wins.length, losses: total - wins.length, winRate, avgMoves, avgDiff, avgDiffLevel, avgRecycles, avgPulls, hardest, diffDist, maxDiffCount, verdictEntries, maxVerdictCount, stratEntries, maxStratCount };
  }, [results]);

  const handleUpload = (e) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        setGames(json.games || []);
        const types = new Set();
        (json.games || []).forEach(g => { if (g.Type) g.Type.split(',').forEach(t => types.add(t.trim())); });
        setGameTypes(Array.from(types).sort());
      } catch (err) { alert("Invalid JSON"); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const runBatch = async () => {
    setAnalyzing(true);
    setResults(null);
    let targets = games;
    if (filterType !== 'All') targets = targets.filter(g => g.Type && g.Type.includes(filterType));
    const start = Math.min(targets.length, parseInt(batchConfig.start));
    const count = parseInt(batchConfig.count);
    const slice = targets.slice(start, start + count);
    const res = [];
    for (let i = 0; i < slice.length; i++) {
      const g = slice[i];
      const dm = drawMode === 'auto' ? (g.TypeDescription?.includes('3-Card') ? 3 : 1) : parseInt(drawMode);
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
      const { result, strat, winCount } = solvePortfolio(g.DecodedDeck, dm);
      const v = getVerdict(result);
      const qds = result.status === 'won'
        ? Math.round(result.moves * 0.3 + result.foundationPulls * 25 + Math.max(0, result.recycleCount - 1) * 8 + (ORDERED_STRATS.length - winCount) * 3)
        : 999;
      res.push({ id: g.GameId, status: result.status, moves: result.moves, strat, verdict: v, recycles: result.recycleCount, pulls: result.foundationPulls, winCount, quickDiffScore: qds, diffLevel: getDifficultyLevel(qds) });
      setProgress(Math.round(((i + 1) / slice.length) * 100));
    }
    setResults(res);
    setAnalyzing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg transition border border-slate-700 hover:border-emerald-500/50 px-4 flex items-center gap-2">
            <Icon path={Icons.Upload} /> {games.length ? `${games.length} Games` : 'Upload JSON'}
            <input type="file" accept=".json" className="hidden" onChange={handleUpload} />
          </label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-slate-300 focus:border-emerald-500 outline-none">
            <option value="All">All Types</option>
            {gameTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={drawMode} onChange={e => setDrawMode(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-slate-300 focus:border-emerald-500 outline-none">
            <option value="auto">Auto</option>
            <option value="1">Draw 1</option>
            <option value="3">Draw 3</option>
          </select>
          <input type="number" value={batchConfig.start} onChange={e => setBatchConfig({ ...batchConfig, start: e.target.value })} className="w-20 bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-2 text-center text-sm text-white focus:border-emerald-500 outline-none" placeholder="Start" />
          <input type="number" value={batchConfig.count} onChange={e => setBatchConfig({ ...batchConfig, count: e.target.value })} className="w-20 bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-2 text-center text-sm text-white focus:border-emerald-500 outline-none" placeholder="Count" />
          <button onClick={runBatch} disabled={analyzing || !games.length} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-lg flex items-center gap-2 ${analyzing ? 'bg-slate-800 text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
            {analyzing ? <Icon path={Icons.Refresh} className="animate-spin" /> : <Icon path={Icons.Zap} />} {analyzing ? `${progress}%` : 'Run'}
          </button>
        </div>
        {analyzing && <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div></div>}
      </div>

      {results && analytics && (
        <div className="space-y-5 animate-pop">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Games" value={analytics.total} icon={Icons.Chart} color="text-cyan-400" />
            <StatCard label="Win Rate" value={`${analytics.winRate}%`} icon={Icons.Check} color={parseFloat(analytics.winRate) > 70 ? 'text-emerald-400' : parseFloat(analytics.winRate) > 40 ? 'text-amber-400' : 'text-red-400'} />
            <StatCard label="Avg Moves" value={analytics.avgMoves} icon={Icons.Zap} color="text-blue-400" sub="wins only" />
            <StatCard label="Avg Difficulty" value={analytics.avgDiff} icon={Icons.Brain} color="text-white" sub={analytics.avgDiffLevel.label} subColor={analytics.avgDiffLevel.color} />
            <StatCard label="Avg Recycles" value={analytics.avgRecycles} icon={Icons.Refresh} color="text-amber-400" sub="wins only" />
            <StatCard label="Avg Pulls" value={analytics.avgPulls} icon={Icons.Info} color="text-purple-400" sub="wins only" />
          </div>
          <DifficultyChart diffDist={analytics.diffDist} maxCount={analytics.maxDiffCount} total={analytics.total} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VerdictChart entries={analytics.verdictEntries} maxCount={analytics.maxVerdictCount} total={analytics.total} />
            <StrategyChart entries={analytics.stratEntries} maxCount={analytics.maxStratCount} />
          </div>
          {analytics.hardest.length > 0 && <HardestDecks decks={analytics.hardest} />}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <Legend />
            </div>
            <div className="max-h-96 overflow-y-auto custom-scroll">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="bg-slate-800 text-slate-500 uppercase text-xs sticky top-0 font-bold">
                  <tr>
                    <th className="px-4 py-4">Game ID</th>
                    <th className="px-4 py-4">Result</th>
                    <th className="px-4 py-4">Moves</th>
                    <th className="px-4 py-4">Strategy</th>
                    <th className="px-4 py-4">Difficulty</th>
                    <th className="px-4 py-4">Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 font-mono text-emerald-500">{r.id}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${r.status === 'won' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{r.status}</span></td>
                      <td className="px-4 py-3 font-mono text-white">{r.moves}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{r.strat}</td>
                      <td className="px-4 py-3">
                        {r.diffLevel && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: r.diffLevel.color + '20', color: r.diffLevel.color }}>Lv.{r.diffLevel.level}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full bg-slate-800 ${r.verdict.color} border border-slate-700`}>
                            <Icon path={r.verdict.icon} size={14} />
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${r.verdict.color}`}>{r.verdict.label}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
