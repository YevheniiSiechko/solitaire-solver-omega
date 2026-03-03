import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon, Icons } from '../icons.jsx';
import { SUITS, DEFAULT_DECK, STRATEGIES } from '../constants.js';
import { solveWithHistory, getMoveDescription } from '../solver.js';

const RANK_DISPLAY = { A: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', X: '10', J: 'J', Q: 'Q', K: 'K' };
const SPEEDS = [1, 2, 4, 8];

// Render a single card (face-up or face-down)
const SimCard = ({ card, isActive, small }) => {
  if (!card) return null;
  const display = RANK_DISPLAY[card.rank] || card.rank;
  const suitInfo = SUITS[card.suit];

  if (!card.faceUp) {
    return (
      <div className={`${small ? 'w-10 h-14' : 'w-12 h-[66px]'} rounded-md bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600 shadow-inner flex items-center justify-center ${isActive ? 'sim-card-active' : ''}`}>
        <div className="w-4 h-4 rounded-full border border-emerald-500/30 bg-emerald-800/40" />
      </div>
    );
  }

  return (
    <div className={`${small ? 'w-10 h-14' : 'w-12 h-[66px]'} rounded-md bg-white border border-slate-200 shadow flex flex-col items-center justify-center ${isActive ? 'sim-card-active' : ''}`}>
      <span className={`card-font ${small ? 'text-sm' : 'text-base'} font-bold leading-none ${card.color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{display}</span>
      <span className={`${small ? 'text-[10px]' : 'text-xs'} leading-none ${card.color === 'red' ? 'text-red-400' : 'text-slate-500'}`}>{suitInfo?.s}</span>
    </div>
  );
};

// Foundation pile
const FoundationPile = ({ suit, cards, isActive }) => {
  const top = cards.length > 0 ? cards[cards.length - 1] : null;
  const suitInfo = SUITS[suit];
  return (
    <div className={`w-12 h-[66px] rounded-md border flex flex-col items-center justify-center relative
      ${top ? 'bg-white border-slate-200 shadow' : 'bg-emerald-900/40 border-emerald-700/50 border-dashed'}
      ${isActive ? 'sim-foundation-pop' : ''}`}>
      {top ? (
        <>
          <span className={`card-font text-base font-bold leading-none ${top.color === 'red' ? 'text-red-500' : 'text-slate-800'}`}>{RANK_DISPLAY[top.rank]}</span>
          <span className={`text-xs leading-none ${top.color === 'red' ? 'text-red-400' : 'text-slate-500'}`}>{suitInfo.s}</span>
        </>
      ) : (
        <span className={`text-lg opacity-30 ${suit === 'H' || suit === 'D' ? 'text-red-400' : 'text-slate-400'}`}>{suitInfo.s}</span>
      )}
      {cards.length > 0 && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center shadow">
          {cards.length}
        </div>
      )}
    </div>
  );
};

// Tableau column
const TableauColumn = ({ col, colIdx, activeCardId, lastMove }) => {
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
      <div className="text-[10px] text-emerald-400/60 font-bold mb-1">{colIdx + 1}</div>
      {col.length === 0 ? (
        <div className="w-12 h-[66px] rounded-md border border-dashed border-emerald-700/30 bg-emerald-900/20" />
      ) : (
        <div className="relative" style={{ height: (col.length - 1) * 22 + 66 }}>
          {col.map((card, j) => {
            const isActive = activeCardId && card.id === activeCardId;
            const isNewlyRevealed = lastMove && lastMove.reveals && j === col.length - 1 &&
              (lastMove.from === colIdx) && card.faceUp;
            return (
              <div key={`${card.id}-${j}`}
                className={`absolute transition-all duration-300 ${isActive ? 'sim-card-slide' : ''} ${isNewlyRevealed ? 'card-enter' : ''}`}
                style={{ top: j * 22, zIndex: j }}>
                <SimCard card={card} isActive={isActive} small={false} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Strategy performance scoreboard
const StrategyPanel = ({ results, bestKey }) => {
  const [expanded, setExpanded] = useState(false);
  if (!results || results.length === 0) return null;

  const sorted = [...results].sort((a, b) => {
    if (a.status === 'won' && b.status !== 'won') return -1;
    if (a.status !== 'won' && b.status === 'won') return 1;
    if (a.status === 'won' && b.status === 'won') return a.moves - b.moves;
    return b.foundationTotal - a.foundationTotal;
  });

  const wins = results.filter(r => r.status === 'won').length;
  const shown = expanded ? sorted : sorted.slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <Icon path={Icons.Brain} size={14} className="text-purple-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Strategy Performance</h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
            {wins}/{results.length} won
          </span>
        </div>
        <span className="text-slate-500 text-xs group-hover:text-white transition">
          {expanded ? 'Show less' : 'Show all'}
        </span>
      </button>

      <div className="space-y-1">
        {shown.map((r, i) => {
          const isBest = r.key === bestKey;
          const won = r.status === 'won';
          const barWidth = won ? 100 : Math.round((r.foundationTotal / 52) * 100);
          return (
            <div key={r.key} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition
              ${isBest ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-slate-800/50'}`}>
              <span className={`w-5 text-right font-mono font-bold ${won ? 'text-emerald-400' : 'text-slate-600'}`}>
                {i + 1}
              </span>
              <span className={`w-40 truncate font-medium ${isBest ? 'text-cyan-300' : won ? 'text-white' : 'text-slate-500'}`}>
                {r.name}
                {isBest && <span className="ml-1 text-[9px] text-cyan-400 font-bold">BEST</span>}
              </span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${won
                    ? isBest ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : 'bg-emerald-500/70'
                    : 'bg-slate-600/50'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className={`w-16 text-right font-mono ${won ? 'text-emerald-400' : 'text-slate-600'}`}>
                {won ? `${r.moves} moves` : `${r.foundationTotal}/52`}
              </span>
              <span className={`w-5 text-center ${won ? 'text-emerald-400' : 'text-red-400/60'}`}>
                {won ? '\u2713' : '\u2717'}
              </span>
            </div>
          );
        })}
      </div>

      {!expanded && sorted.length > 5 && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition text-center"
        >
          + {sorted.length - 5} more strategies
        </button>
      )}
    </div>
  );
};

export const SimulateTab = () => {
  const [deckInput, setDeckInput] = useState(DEFAULT_DECK);
  const [solution, setSolution] = useState(null); // { moves, states, strategy, ... }
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const logRef = useRef(null);

  // Current game state
  const currentState = solution ? solution.states[step] : null;
  const currentMove = solution && step > 0 ? solution.moves[step - 1] : null;
  const totalSteps = solution ? solution.moves.length : 0;
  const isFinished = step >= totalSteps;
  const foundationTotal = currentState
    ? Object.values(currentState.foundations).reduce((a, b) => a + b.length, 0)
    : 0;

  // Auto-scroll move log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [step]);

  // Playback interval
  useEffect(() => {
    if (playing && !isFinished) {
      intervalRef.current = setInterval(() => {
        setStep(prev => {
          if (prev >= totalSteps) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, totalSteps, isFinished]);

  // Auto-pause at end
  useEffect(() => {
    if (isFinished && playing) {
      setPlaying(false);
    }
  }, [isFinished, playing]);

  const handleSolve = useCallback(async () => {
    setSolving(true);
    setError(null);
    setSolution(null);
    setStep(0);
    setPlaying(false);

    // Defer to allow UI update
    await new Promise(r => setTimeout(r, 50));

    try {
      const result = solveWithHistory(deckInput, 1);
      if (result.status === 'failed' || result.status === 'stuck') {
        setError('This deck is unsolvable. No strategy could find a winning solution.');
        if (result.strategyResults) setSolution(result);
        setSolving(false);
        return;
      }
      setSolution(result);
    } catch (e) {
      setError('Invalid deck format. Please check your input.');
    }
    setSolving(false);
  }, [deckInput]);

  const handlePlay = () => {
    if (isFinished) {
      setStep(0);
      setTimeout(() => setPlaying(true), 50);
    } else {
      setPlaying(true);
    }
  };

  const handlePause = () => setPlaying(false);

  const handleSpeedUp = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const handleReset = () => {
    setPlaying(false);
    setStep(0);
  };

  const handleStepForward = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleStepBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Figure out which card is "active" (just moved)
  let activeCardId = null;
  let activeFoundation = null;
  if (currentMove) {
    if (currentMove.card) activeCardId = currentMove.card.id;
    if (currentMove.type === 'W2F' || currentMove.type === 'T2F') activeFoundation = currentMove.card?.suit;
    if (currentMove.type === 'F2T') activeFoundation = currentMove.suit;
  }

  return (
    <div className="space-y-5">
      {/* Input Section */}
      {!solution && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-pop">
          <div className="flex items-center gap-3 mb-4">
            <Icon path={Icons.Play} size={24} className="text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Game Simulation</h2>
              <p className="text-xs text-slate-500">Paste a deck, watch the AI solve it step by step</p>
            </div>
          </div>
          <textarea
            value={deckInput}
            onChange={e => setDeckInput(e.target.value)}
            placeholder="Paste your deck here (comma-separated cards, e.g. QH,5D,3C,...)"
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:border-cyan-500 outline-none resize-none mb-4"
          />
          <button
            onClick={handleSolve}
            disabled={solving || !deckInput.trim()}
            className={`w-full py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${solving
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'}`}
          >
            {solving ? (
              <><Icon path={Icons.Refresh} size={16} className="animate-spin" /> Solving...</>
            ) : (
              <><Icon path={Icons.Zap} size={16} /> Solve & Simulate</>
            )}
          </button>
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <Icon path={Icons.Info} size={16} /> {error}
            </div>
          )}
          {error && solution?.strategyResults && (
            <div className="mt-4">
              <StrategyPanel results={solution.strategyResults} bestKey={null} />
              <button
                onClick={() => { setSolution(null); setError(null); }}
                className="mt-3 text-xs text-slate-500 hover:text-white transition underline"
              >
                Try another deck
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game Board */}
      {solution && currentState && (
        <>
          {/* Strategy Badge + Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <span className="text-xs font-bold text-cyan-400">Strategy: {solution.strategyName}</span>
              </div>
              <span className="text-xs text-slate-500">{totalSteps} total moves</span>
            </div>
            <button
              onClick={() => { setSolution(null); setStep(0); setPlaying(false); setError(null); }}
              className="text-xs text-slate-500 hover:text-white transition flex items-center gap-1"
            >
              <Icon path={Icons.SkipBack} size={14} /> New Deck
            </button>
          </div>

          {/* Strategy Performance */}
          <StrategyPanel results={solution.strategyResults} bestKey={solution.strategy} />

          {/* Board */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="felt-bg p-5">
              {/* Top row: Foundations + Stock/Waste */}
              <div className="flex items-start justify-between mb-6">
                {/* Foundations */}
                <div className="flex gap-2">
                  {['H', 'D', 'C', 'S'].map(suit => (
                    <FoundationPile
                      key={suit}
                      suit={suit}
                      cards={currentState.foundations[suit]}
                      isActive={activeFoundation === suit}
                    />
                  ))}
                </div>

                {/* Stock + Waste */}
                <div className="flex gap-2 items-start">
                  {/* Stock */}
                  <div className="flex flex-col items-center">
                    <div className="text-[9px] text-emerald-400/50 font-bold mb-1">STOCK</div>
                    {currentState.stock.length > 0 ? (
                      <div className={`w-12 h-[66px] rounded-md bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600 shadow-inner flex items-center justify-center relative ${currentMove?.type === 'DRAW' ? 'sim-card-active' : ''}`}>
                        <span className="text-emerald-300 text-sm font-bold">{currentState.stock.length}</span>
                      </div>
                    ) : (
                      <div className={`w-12 h-[66px] rounded-md border border-dashed border-emerald-700/30 bg-emerald-900/20 flex items-center justify-center ${currentMove?.type === 'RECYCLE' ? 'sim-card-active' : ''}`}>
                        <Icon path={Icons.Refresh} size={16} className="text-emerald-700/40" />
                      </div>
                    )}
                  </div>

                  {/* Waste */}
                  <div className="flex flex-col items-center">
                    <div className="text-[9px] text-emerald-400/50 font-bold mb-1">WASTE</div>
                    {currentState.waste.length > 0 ? (
                      <div className="relative">
                        <SimCard
                          card={currentState.waste[currentState.waste.length - 1]}
                          isActive={currentMove?.type === 'DRAW' || (currentMove?.type === 'W2F' || currentMove?.type === 'W2T') && activeCardId === currentState.waste[currentState.waste.length - 1]?.id}
                        />
                        {currentState.waste.length > 1 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-600 text-white text-[8px] font-bold flex items-center justify-center shadow">
                            {currentState.waste.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-12 h-[66px] rounded-md border border-dashed border-emerald-700/30 bg-emerald-900/20" />
                    )}
                  </div>
                </div>
              </div>

              {/* Tableau */}
              <div className="flex gap-2 justify-center overflow-x-auto custom-scroll pb-2">
                {currentState.tableau.map((col, i) => (
                  <TableauColumn
                    key={i}
                    col={col}
                    colIdx={i}
                    activeCardId={activeCardId}
                    lastMove={currentMove}
                  />
                ))}
              </div>
            </div>

            {/* Foundation progress bar */}
            <div className="h-1.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${(foundationTotal / 52) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Step Back */}
                <button
                  onClick={handleStepBack}
                  disabled={step === 0 || playing}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition border border-slate-700"
                >
                  <Icon path={Icons.SkipBack} size={16} />
                </button>

                {/* Play / Pause */}
                {playing ? (
                  <button
                    onClick={handlePause}
                    className="w-12 h-12 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition shadow-lg shadow-amber-500/20"
                  >
                    <Icon path={Icons.Pause} size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handlePlay}
                    disabled={solving}
                    className="w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white flex items-center justify-center transition shadow-lg shadow-cyan-500/20"
                  >
                    <Icon path={Icons.Play} size={20} />
                  </button>
                )}

                {/* Step Forward */}
                <button
                  onClick={handleStepForward}
                  disabled={isFinished || playing}
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 flex items-center justify-center transition border border-slate-700"
                >
                  <Icon path={Icons.StepForward} size={16} />
                </button>

                {/* Separator */}
                <div className="w-px h-8 bg-slate-700 mx-1" />

                {/* Speed */}
                <button
                  onClick={handleSpeedUp}
                  className="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Icon path={Icons.FastForward} size={14} />
                  <span className="text-xs font-bold font-mono">{speed}x</span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleReset}
                  className="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition border border-slate-700"
                >
                  <Icon path={Icons.Refresh} size={14} />
                  <span className="text-xs font-medium">Reset</span>
                </button>
              </div>

              {/* Step counter */}
              <div className="flex items-center gap-3">
                {isFinished && solution.status === 'won' && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                    SOLVED!
                  </span>
                )}
                <div className="text-right">
                  <div className="text-lg font-black text-white font-mono">
                    {step} <span className="text-slate-600">/</span> <span className="text-slate-400">{totalSteps}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {foundationTotal}/52 in foundations
                  </div>
                </div>
              </div>
            </div>

            {/* Seek bar */}
            <div className="mt-3">
              <input
                type="range"
                min={0}
                max={totalSteps}
                value={step}
                onChange={e => { setPlaying(false); setStep(parseInt(e.target.value)); }}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-400/30
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-125"
              />
            </div>
          </div>

          {/* Move Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Icon path={Icons.Info} size={14} className="text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Move Log</h3>
            </div>
            <div ref={logRef} className="max-h-48 overflow-y-auto custom-scroll space-y-1">
              {step === 0 ? (
                <div className="text-sm text-slate-500 italic py-2">
                  Press Play to begin the simulation...
                </div>
              ) : (
                solution.moves.slice(0, step).map((move, i) => {
                  const desc = getMoveDescription(move);
                  const isCurrent = i === step - 1;
                  return (
                    <div
                      key={i}
                      className={`flex gap-3 py-1.5 px-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-800/50
                        ${isCurrent ? 'bg-cyan-500/10 border border-cyan-500/20' : ''}`}
                      onClick={() => { setPlaying(false); setStep(i + 1); }}
                    >
                      <span className={`text-[10px] font-mono font-bold shrink-0 w-8 text-right ${isCurrent ? 'text-cyan-400' : 'text-slate-600'}`}>
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                          {desc.action}
                        </div>
                        <div className={`text-[11px] ${isCurrent ? 'text-cyan-400/80' : 'text-slate-500'}`}>
                          {desc.reason}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
