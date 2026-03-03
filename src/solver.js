import { ORDERED_STRATS, STRATEGIES, SUITS_ORDER, RANKS_ORDER, DIFFICULTY } from './constants.js';
import { createGame, getMoves, evaluate, apply, getHash, isSafe } from './engine.js';
import { Icons } from './icons.jsx';

export const solveSingle = (deck, drawCount, strategy) => {
  let state = createGame(deck, drawCount);
  state.activeStrategy = strategy;
  state.history.add(getHash(state));
  let loops = 0;
  while(state.status === 'playing' && loops < 2500) {
    const moves = getMoves(state);
    if(moves.length === 0) { state.status = 'stuck'; break; }
    const rated = moves.map(m => ({ m, score: evaluate(state, m, strategy) }));
    rated.sort((a,b) => b.score - a.score);

    let candidates = rated;
    if(state.movesSinceProgress > 50) {
      const top = rated.slice(0, Math.min(5, rated.length));
      for(let i = top.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [top[i], top[j]] = [top[j], top[i]];
      }
      candidates = [...top, ...rated.slice(5)];
    }

    let bestMove = null;
    for(let r of candidates) { const sim = apply(state, r.m); if(!state.history.has(getHash(sim))) { bestMove = r.m; break; } }
    if(!bestMove) { bestMove = moves[Math.floor(Math.random() * moves.length)]; if(state.history.has(getHash(apply(state,bestMove)))) { state.status='stuck'; break; } }
    state = apply(state, bestMove);
    loops++;
    if(state.moves > 2500) state.status = 'defeat';
  }
  return state;
};

export const solvePortfolio = (deck, drawCount) => {
  let bestWin = null;
  let winCount = 0;
  for(const strat of ORDERED_STRATS) {
    const result = solveSingle(deck, drawCount, strat);
    if(result.status === 'won') {
      winCount++;
      if (!bestWin || result.moves < bestWin.result.moves) {
        bestWin = { result, strat };
      }
    }
  }
  return bestWin
    ? { ...bestWin, winCount }
    : { result: { status: 'failed', moves: 0 }, strat: 'NONE', winCount: 0 };
};

export const solveAsHuman = (deck, drawCount) => {
  let state = createGame(deck, drawCount);
  state.history = new Set();
  state.history.add(getHash(state));
  let loops = 0;
  while(state.status === 'playing' && loops < 800) {
    let moves = getMoves(state).filter(m => m.type !== 'F2T');
    if(moves.length === 0) { state.status = 'stuck'; break; }
    const scored = moves.map(m => {
      let s = 0;
      if(m.type === 'W2F' || m.type === 'T2F') s += 100;
      if(m.type === 'T2F' && m.reveals) s += 50;
      if(m.type === 'T2T' && m.reveals) s += 80;
      if(m.type === 'T2T' && m.isKing) s += 30;
      if(m.type === 'T2T') s += 20;
      if(m.type === 'W2T') s += 40;
      if(m.type === 'DRAW') s += 5;
      if(m.type === 'RECYCLE') s -= 10;
      s += Math.random() * 40 - 20;
      return { m, score: s };
    });
    scored.sort((a,b) => b.score - a.score);
    let bestMove = null;
    for(let r of scored) { const sim = apply(state, r.m); if(!state.history.has(getHash(sim))) { bestMove = r.m; break; } }
    if(!bestMove) { bestMove = moves[Math.floor(Math.random() * moves.length)]; if(state.history.has(getHash(apply(state, bestMove)))) { state.status = 'stuck'; break; } }
    state = apply(state, bestMove);
    loops++;
    if(state.moves > 800) state.status = 'defeat';
  }
  return state;
};

export const calcDifficulty = (deckStr, winCount, bestResult) => {
  if (bestResult.status !== 'won') return { score: 999, humanWins: 0 };
  let humanWins = 0;
  for (let i = 0; i < 3; i++) {
    if (solveAsHuman(deckStr, 1).status === 'won') humanWins++;
  }
  const score = Math.round(
    bestResult.moves * 0.3 +
    bestResult.foundationPulls * 25 +
    Math.max(0, bestResult.recycleCount - 1) * 8 +
    (ORDERED_STRATS.length - winCount) * 3 +
    (3 - humanWins) * 30
  );
  return { score, humanWins };
};

export const getDifficultyLevel = (score) => {
  for (let i = 0; i < DIFFICULTY.length; i++) {
    if (score < DIFFICULTY[i].max) return { level: i + 1, ...DIFFICULTY[i] };
  }
  return { level: 10, ...DIFFICULTY[9] };
};

export const getVerdict = (r) => {
  if(r.status !== 'won') return { label: "FAIL", desc: "Unsolvable?", color: "text-red-500", icon: Icons.Info, type: "fail" };
  const { moves, recycleCount: recycles, foundationPulls: pulls } = r;
  if(moves < 115 && recycles <= 1 && pulls <= 1)
    return { label: "EASY", desc: "Straightforward", color: "text-emerald-400", icon: Icons.Smile, type: "easy" };
  if(pulls > 4)
    return { label: "BRAIN TEASER", desc: "Complex backtracking", color: "text-purple-400", icon: Icons.Brain, type: "tricky" };
  if(pulls > 0)
    return { label: "TRICKY", desc: "Non-linear moves", color: "text-blue-400", icon: Icons.Brain, type: "tricky" };
  if(recycles > 5)
    return { label: "GRIND", desc: "Heavy recycling", color: "text-amber-500", icon: Icons.Refresh, type: "hard" };
  if(moves > 150)
    return { label: "MARATHON", desc: "Long & steady", color: "text-orange-400", icon: Icons.Zap, type: "hard" };
  return { label: "STANDARD", desc: "Balanced", color: "text-slate-200", icon: Icons.Check, type: "std" };
};

// --- NEW: Solve with full move history for simulation ---
export const solveWithHistory = (deck, drawCount = 1) => {
  // First find the best strategy via portfolio
  const portfolio = solvePortfolio(deck, drawCount);
  if (portfolio.result.status !== 'won') {
    return { moves: [], states: [], strategy: 'NONE', status: 'failed', finalState: portfolio.result };
  }

  const strategy = portfolio.strat;

  // Re-solve with that strategy, recording every move and state
  let state = createGame(deck, drawCount);
  state.activeStrategy = strategy;
  state.history.add(getHash(state));

  const moveHistory = [];
  const stateHistory = [state]; // state[0] = initial deal
  let loops = 0;

  while (state.status === 'playing' && loops < 2500) {
    const moves = getMoves(state);
    if (moves.length === 0) { state.status = 'stuck'; break; }

    const rated = moves.map(m => ({ m, score: evaluate(state, m, strategy) }));
    rated.sort((a, b) => b.score - a.score);

    let candidates = rated;
    if (state.movesSinceProgress > 50) {
      const top = rated.slice(0, Math.min(5, rated.length));
      for (let i = top.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [top[i], top[j]] = [top[j], top[i]];
      }
      candidates = [...top, ...rated.slice(5)];
    }

    let bestMove = null;
    let bestScore = 0;
    for (let r of candidates) {
      const sim = apply(state, r.m);
      if (!state.history.has(getHash(sim))) {
        bestMove = r.m;
        bestScore = r.score;
        break;
      }
    }
    if (!bestMove) {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
      if (state.history.has(getHash(apply(state, bestMove)))) {
        state.status = 'stuck';
        break;
      }
    }

    moveHistory.push({ ...bestMove, score: bestScore });
    state = apply(state, bestMove);
    stateHistory.push(state);
    loops++;
    if (state.moves > 2500) state.status = 'defeat';
  }

  return {
    moves: moveHistory,
    states: stateHistory,
    strategy,
    strategyName: STRATEGIES[strategy]?.name || strategy,
    status: state.status,
    finalState: state
  };
};

// --- NEW: Human-readable move description ---
const RANK_DISPLAY = { A: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', X: '10', J: 'J', Q: 'Q', K: 'K' };
const SUIT_SYMBOL = { H: '♥', D: '♦', C: '♣', S: '♠' };

const cardName = (card) => {
  if (!card) return '?';
  const r = RANK_DISPLAY[card.rank] || card.rank;
  const s = SUIT_SYMBOL[card.suit] || card.suit;
  return `${r}${s}`;
};

export const getMoveDescription = (move) => {
  switch (move.type) {
    case 'W2F':
      return {
        action: `Play ${cardName(move.card)} to foundation`,
        reason: 'Building the foundation pile — getting closer to victory!'
      };
    case 'T2F':
      return {
        action: `Move ${cardName(move.card)} from column ${move.from + 1} to foundation`,
        reason: move.reveals
          ? 'Sends card to foundation and reveals a hidden card underneath!'
          : 'Building the foundation pile up.'
      };
    case 'T2T': {
      const count = move.idx !== undefined ? '' : '';
      return {
        action: `Move ${cardName(move.card)} from column ${move.from + 1} to column ${move.to + 1}`,
        reason: move.isKing
          ? 'Placing King in an empty column — opens up the board.'
          : move.reveals
            ? 'Reveals a hidden card — uncovering new possibilities!'
            : 'Building a descending sequence on the tableau.'
      };
    }
    case 'W2T':
      return {
        action: `Play ${cardName(move.card)} from waste to column ${move.to + 1}`,
        reason: move.isKing
          ? 'King from waste fills an empty column.'
          : 'Using waste card to extend a tableau sequence.'
      };
    case 'F2T':
      return {
        action: `Pull ${cardName(move.card)} back from foundation to column ${move.to + 1}`,
        reason: 'Strategic backtrack — this card is needed on the tableau to unlock other moves.'
      };
    case 'DRAW':
      return {
        action: 'Draw from stock',
        reason: 'Flipping the next card to find playable options.'
      };
    case 'RECYCLE':
      return {
        action: 'Recycle waste back to stock',
        reason: 'All stock cards drawn — cycling through again for missed opportunities.'
      };
    default:
      return { action: 'Unknown move', reason: '' };
  }
};
