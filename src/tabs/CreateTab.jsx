import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Icon, Icons } from '../icons.jsx';
import { SUITS, RANKS_ORDER, SUITS_ORDER, SUIT_NAMES, DIFFICULTY, ORDERED_STRATS } from '../constants.js';
import { solvePortfolio, calcDifficulty, getDifficultyLevel, getVerdict } from '../solver.js';

export const CreateTab = () => {
  const [builderCards, setBuilderCards] = useState([]);
  const [lastAdded, setLastAdded] = useState(null);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [difficulty, setDifficulty] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genAttempt, setGenAttempt] = useState(0);
  const deckScrollRef = useRef(null);
  const genCancelRef = useRef(false);
  const builderSet = useMemo(() => new Set(builderCards), [builderCards]);

  useEffect(() => {
    if (deckScrollRef.current && builderCards.length > 0) {
      deckScrollRef.current.scrollLeft = deckScrollRef.current.scrollWidth;
    }
  }, [builderCards.length]);

  const generateByDifficulty = useCallback(async () => {
    setGenerating(true);
    setTestResult(null);
    setGenAttempt(0);
    genCancelRef.current = false;
    const range = DIFFICULTY[difficulty - 1];
    const maxAttempts = 150;
    let closest = null;
    let closestDist = Infinity;

    for (let i = 1; i <= maxAttempts; i++) {
      if (genCancelRef.current) break;
      setGenAttempt(i);
      await new Promise(r => setTimeout(r, 0));

      const all = SUITS_ORDER.flatMap(s => RANKS_ORDER.map(r => r + s));
      for (let k = all.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [all[k], all[j]] = [all[j], all[k]];
      }

      const deckStr = all.join(',');
      const { result, strat, winCount } = solvePortfolio(deckStr, 1);

      if (result.status !== 'won' && difficulty === 10) {
        const diff = { score: 999, humanWins: 0 };
        const dl = getDifficultyLevel(diff.score);
        setBuilderCards(all);
        setLastAdded(null);
        setTestResult({ ...result, strat, verdict: getVerdict(result), diffScore: diff.score, diffLevel: dl, winCount, humanWins: 0 });
        setGenerating(false);
        return;
      }

      if (result.status === 'won') {
        const quickScore = result.moves * 0.3 + result.foundationPulls * 25 +
          Math.max(0, result.recycleCount - 1) * 8 + (ORDERED_STRATS.length - winCount) * 3;
        if (quickScore > range.max + 90 || quickScore + 90 < range.min) {
          const approxMid = (range.min + Math.min(range.max, 500)) / 2;
          const dist = Math.abs(quickScore + 45 - approxMid);
          if (dist < closestDist) {
            closestDist = dist;
            closest = { deck: [...all], result, strat, winCount, quickScore };
          }
          continue;
        }

        const diff = calcDifficulty(deckStr, winCount, result);
        const dl = getDifficultyLevel(diff.score);

        if (diff.score >= range.min && (range.max === Infinity || diff.score < range.max)) {
          setBuilderCards(all);
          setLastAdded(null);
          setTestResult({ ...result, strat, verdict: getVerdict(result), diffScore: diff.score, diffLevel: dl, winCount, humanWins: diff.humanWins });
          setGenerating(false);
          return;
        }

        const mid = (range.min + Math.min(range.max, 500)) / 2;
        const dist = Math.abs(diff.score - mid);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { deck: [...all], result, strat, winCount, diffScore: diff.score, diffLevel: dl, humanWins: diff.humanWins };
        }
      }
    }

    if (closest) {
      setBuilderCards(closest.deck);
      setLastAdded(null);
      const dl = closest.diffLevel || getDifficultyLevel(closest.diffScore || closest.quickScore + 45);
      const hw = closest.humanWins !== undefined ? closest.humanWins : '?';
      setTestResult({ ...closest.result, strat: closest.strat, verdict: getVerdict(closest.result), diffScore: closest.diffScore || Math.round(closest.quickScore + 45), diffLevel: dl, winCount: closest.winCount, humanWins: hw });
    }
    setGenerating(false);
  }, [difficulty]);

  return (
    <div className="space-y-6">
      {/* Deck Builder Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Icon path={Icons.Plus} className="text-emerald-400" /> Deck Builder
          </h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-mono font-bold ${builderCards.length === 52 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {builderCards.length}/52
            </span>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 rounded-full ${builderCards.length === 52 ? 'bg-emerald-400' : 'bg-emerald-600'}`} style={{ width: `${(builderCards.length / 52) * 100}%` }} />
            </div>
          </div>
        </div>

        <div ref={deckScrollRef} className="min-h-[96px] bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 mb-4 overflow-x-auto custom-scroll">
          {builderCards.length === 0 ? (
            <div className="flex items-center justify-center h-[72px] text-slate-500 text-sm">
              Click cards below to build your deck order
            </div>
          ) : (
            <div className="flex gap-1.5" style={{ minWidth: 'max-content' }}>
              {builderCards.map((cardId, idx) => {
                const r = cardId.slice(0, -1), s = cardId.slice(-1);
                const color = (s === 'H' || s === 'D') ? 'red' : 'black';
                const display = r === 'X' ? '10' : r;
                return (
                  <div key={cardId}
                    className={`deck-card group relative ${lastAdded === cardId ? 'card-enter' : ''}`}
                    onClick={() => { setBuilderCards(prev => prev.filter((_, i) => i !== idx)); setTestResult(null); }}>
                    <div className="w-10 h-14 rounded-md bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm group-hover:border-red-400 group-hover:shadow-lg group-hover:shadow-red-500/10 transition-all">
                      <span className={`card-font text-sm font-bold leading-none ${color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{display}</span>
                      <span className={`text-xs leading-none ${color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{SUITS[s].s}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">&#10005;</div>
                    <div className="text-[9px] text-slate-600 text-center mt-0.5">{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => {
            const all = SUITS_ORDER.flatMap(s => RANKS_ORDER.map(r => r + s));
            for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
            setBuilderCards(all); setLastAdded(null); setTestResult(null);
          }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-600">
            <Icon path={Icons.Dice} size={16} /> Shuffle 52
          </button>
          <button onClick={() => {
            const remaining = SUITS_ORDER.flatMap(s => RANKS_ORDER.map(r => r + s)).filter(id => !builderSet.has(id));
            for (let i = remaining.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]]; }
            setBuilderCards(prev => [...prev, ...remaining]); setLastAdded(null); setTestResult(null);
          }} disabled={builderCards.length >= 52} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-600">
            <Icon path={Icons.Wand} size={16} /> Fill Random
          </button>
          <button onClick={() => { setBuilderCards([]); setLastAdded(null); setTestResult(null); }} disabled={builderCards.length === 0} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-600">
            <Icon path={Icons.Trash} size={16} /> Clear
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(builderCards.join(','));
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }} disabled={builderCards.length === 0} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-slate-600">
            <Icon path={Icons.Copy} size={16} /> {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => {
            if (builderCards.length !== 52) return;
            const deckStr = builderCards.join(',');
            const { result, strat, winCount } = solvePortfolio(deckStr, 1);
            const v = getVerdict(result);
            const diff = calcDifficulty(deckStr, winCount, result);
            const dl = getDifficultyLevel(diff.score);
            setTestResult({ ...result, strat, verdict: v, diffScore: diff.score, diffLevel: dl, winCount, humanWins: diff.humanWins });
          }} disabled={builderCards.length !== 52} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ml-auto ${builderCards.length === 52 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
            <Icon path={Icons.Zap} size={16} /> Test Deck
          </button>
        </div>

        {testResult && (
          <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-700 animate-pop">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{testResult.status === 'won' ? '\u{1F389}' : '\u{1F480}'}</div>
              <div className="flex-1">
                <span className={`text-lg font-black ${testResult.status === 'won' ? 'text-emerald-400' : 'text-red-500'}`}>{testResult.status === 'won' ? 'SOLVED' : 'UNSOLVABLE'}</span>
                {testResult.status === 'won' && (
                  <span className="text-slate-400 text-sm ml-3">{testResult.moves} moves &middot; {testResult.strat} &middot; <span className={`font-bold ${testResult.verdict.color}`}>{testResult.verdict.label}</span></span>
                )}
                <div className="text-xs text-slate-500 mt-0.5">{testResult.status === 'won' ? testResult.verdict.desc : 'No strategy could solve this deck'}</div>
              </div>
              <div className={`p-2 rounded-full bg-slate-700 ${testResult.verdict.color} border border-slate-600`}>
                <Icon path={testResult.verdict.icon} size={20} />
              </div>
            </div>
            {testResult.diffLevel && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: testResult.diffLevel.color + '20', color: testResult.diffLevel.color }}>
                      Lv.{testResult.diffLevel.level}
                    </span>
                    <span className="text-sm font-bold" style={{ color: testResult.diffLevel.color }}>{testResult.diffLevel.label}</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, testResult.diffScore / 4)}%`, backgroundColor: testResult.diffLevel.color }} />
                  </div>
                  <span className="text-xs font-mono text-slate-500">{testResult.diffScore}</span>
                </div>
                <div className="flex gap-4 mt-2 text-[11px] text-slate-500">
                  <span>AI: <span className="text-slate-300 font-medium">{testResult.winCount}/{ORDERED_STRATS.length}</span> win</span>
                  <span>Human: <span className="text-slate-300 font-medium">{testResult.humanWins}/3</span> win</span>
                  {testResult.foundationPulls > 0 && <span>Pulls: <span className="text-amber-400 font-medium">{testResult.foundationPulls}</span></span>}
                  {testResult.recycleCount > 1 && <span>Recycles: <span className="text-slate-300 font-medium">{testResult.recycleCount}</span></span>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto Generate by Difficulty */}
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl ${generating ? 'gen-shimmer' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Icon path={Icons.Wand} size={16} className="text-purple-400" /> Generate by Difficulty
          </h3>
          <span className="text-xs text-slate-500">
            Score: <span className="font-mono font-bold" style={{ color: DIFFICULTY[difficulty - 1].color }}>
              {DIFFICULTY[difficulty - 1].min}–{DIFFICULTY[difficulty - 1].max === Infinity ? '370+' : DIFFICULTY[difficulty - 1].max}
            </span>
          </span>
        </div>

        <div className="flex gap-1.5 mb-4">
          {DIFFICULTY.map((d, i) => {
            const lvl = i + 1;
            const active = difficulty === lvl;
            return (
              <button key={lvl}
                onClick={() => !generating && setDifficulty(lvl)}
                disabled={generating}
                className={`diff-btn flex-1 py-2.5 rounded-lg text-center border ${!active ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600' : ''
                  } ${generating ? 'opacity-60 cursor-not-allowed' : ''}`}
                style={active ? {
                  backgroundColor: d.color + '18',
                  borderColor: d.color + '80',
                  color: d.color,
                  boxShadow: `0 4px 15px ${d.color}20`
                } : {}}>
                <div className="text-lg font-black leading-none">{lvl}</div>
                <div className="text-[8px] uppercase tracking-wider mt-1 leading-none opacity-80">{d.label}</div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={generateByDifficulty}
            disabled={generating}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${generating
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}>
            {generating ? (
              <>
                <Icon path={Icons.Refresh} size={16} className="animate-spin" />
                Searching... ({genAttempt}/150)
              </>
            ) : (
              <>
                <Icon path={Icons.Wand} size={16} /> Generate Level {difficulty} Deck
              </>
            )}
          </button>
          {generating && (
            <button onClick={() => { genCancelRef.current = true; }}
              className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition border border-slate-600">
              Cancel
            </button>
          )}
        </div>

        {generating && (
          <div className="mt-3">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-200 rounded-full"
                style={{
                  width: `${(genAttempt / 150) * 100}%`,
                  backgroundColor: DIFFICULTY[difficulty - 1].color
                }} />
            </div>
            <div className="text-xs text-slate-500 mt-1.5 text-center">
              Testing random decks to find a level {difficulty} match...
            </div>
          </div>
        )}
      </div>

      {/* Card Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pick Cards</h3>
        <div className="space-y-4">
          {SUITS_ORDER.map(suit => (
            <div key={suit}>
              <div className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${suit === 'H' || suit === 'D' ? 'text-red-400' : 'text-slate-300'}`}>
                <span className="text-base">{SUITS[suit].s}</span> {SUIT_NAMES[suit]}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {RANKS_ORDER.map(rank => {
                  const id = rank + suit;
                  const used = builderSet.has(id);
                  const display = rank === 'X' ? '10' : rank;
                  const color = (suit === 'H' || suit === 'D') ? 'red' : 'black';
                  return (
                    <div key={id}
                      onClick={() => {
                        if (used || builderCards.length >= 52) return;
                        setLastAdded(id);
                        setBuilderCards(prev => [...prev, id]);
                        setTestResult(null);
                        setTimeout(() => setLastAdded(null), 400);
                      }}
                      className={`card-pick w-12 h-16 sm:w-14 sm:h-[76px] rounded-lg flex flex-col items-center justify-center border select-none
                        ${used ? 'card-used bg-slate-700 border-slate-600' : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-emerald-500/10'}`}>
                      <span className={`card-font text-lg sm:text-xl font-bold leading-none ${color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{display}</span>
                      <span className={`text-sm leading-none mt-0.5 ${color === 'red' ? 'text-red-400' : 'text-slate-500'}`}>{SUITS[suit].s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau Preview */}
      {builderCards.length >= 28 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-pop">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Board Preview</h3>
          <div className="felt-bg rounded-xl p-6 overflow-x-auto custom-scroll">
            <div className="flex gap-3 justify-center" style={{ minWidth: 400 }}>
              {(() => {
                const tableau = Array(7).fill().map(() => []);
                let idx = 0;
                for (let i = 0; i < 7; i++) {
                  for (let j = 0; j <= i; j++) {
                    const cardId = builderCards[idx];
                    const r = cardId.slice(0, -1), s = cardId.slice(-1);
                    tableau[i].push({ id: cardId, rank: r, suit: s, faceUp: j === i, display: r === 'X' ? '10' : r, color: (s === 'H' || s === 'D') ? 'red' : 'black' });
                    idx++;
                  }
                }
                const stockCount = builderCards.length - 28;
                return (
                  <>
                    {tableau.map((col, i) => (
                      <div key={i} className="flex flex-col items-center" style={{ minWidth: 48 }}>
                        <div className="text-[10px] text-emerald-400/60 font-bold mb-1">{i + 1}</div>
                        <div className="relative" style={{ height: (col.length - 1) * 18 + 56 }}>
                          {col.map((card, j) => (
                            <div key={j}
                              className={`absolute w-11 h-14 rounded-md border flex flex-col items-center justify-center text-xs font-bold
                                ${card.faceUp
                                  ? 'bg-white border-slate-200 shadow'
                                  : 'bg-gradient-to-br from-emerald-700 to-emerald-900 border-emerald-600 shadow-inner'}`}
                              style={{ top: j * 18, zIndex: j }}>
                              {card.faceUp ? (
                                <>
                                  <span className={`card-font text-sm font-bold leading-none ${card.color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{card.display}</span>
                                  <span className={`text-[10px] leading-none ${card.color === 'red' ? 'text-red-400' : 'text-slate-500'}`}>{SUITS[card.suit].s}</span>
                                </>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-emerald-500/30 bg-emerald-800/40" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-col items-center ml-4" style={{ minWidth: 48 }}>
                      <div className="text-[10px] text-emerald-400/60 font-bold mb-1">Stock</div>
                      <div className="w-11 h-14 rounded-md bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600 flex items-center justify-center shadow-inner">
                        <span className="text-emerald-300 text-xs font-bold">{stockCount}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
