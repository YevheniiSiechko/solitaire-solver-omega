import { VALUES, STRATEGIES } from './constants.js';

export const parseCard = (code) => {
  if (!code || code.length < 2) return null;
  const r = code.slice(0, -1), s = code.slice(-1);
  const val = r === '10' ? 10 : (VALUES[r] || VALUES[r.toUpperCase()]);
  return { id: code, rank: r, value: val, suit: s, faceUp: false, color: (s==='H'||s==='D')?'red':'black' };
};

export const createGame = (deckStr, drawCount=1) => {
  const cards = deckStr.split(',').map(s => s.trim()).filter(s=>s).map(parseCard);
  const tableau = Array(7).fill().map(()=>[]);
  let stock = [], idx = 0;
  for(let i=0; i<7; i++) {
    for(let j=0; j<=i; j++) {
      const c = {...cards[idx++]};
      if(j===i) c.faceUp = true;
      tableau[i].push(c);
    }
  }
  stock = cards.slice(idx).map(c => ({...c, faceUp:false}));
  return { tableau, stock, waste: [], foundations: {H:[],D:[],C:[],S:[]}, drawCount, status: 'playing', moves: 0, history: new Set(), recycleCount: 0, movesSinceProgress: 0, foundationPulls: 0 };
};

export const getHash = (s) => {
  const t = s.tableau.map(c => {
    const h = c.filter(x => !x.faceUp).length;
    const faceUp = c.filter(x => x.faceUp).map(x => x.id).join('');
    return h + ':' + faceUp;
  }).join('|');
  const f = Object.values(s.foundations).map(x => x.length).join('|');
  const wTop = s.waste.length > 0 ? s.waste[s.waste.length-1].id : 'x';
  return `${t}#${f}#${s.stock.length}#${s.waste.length}${wTop}`;
};

export const isSafe = (card, foundations, tableau, strat) => {
  if(strat.safety === "None") return true;
  if(card.value <= 2) return true;
  const opp = card.color === 'red' ? ['C','S'] : ['H','D'];
  const minOpp = Math.min(...opp.map(s => foundations[s].length));
  const gap = strat.safety === "Strict" ? 2 : 4;
  if(minOpp < card.value - gap) return false;
  if(strat.safety === "Smart") {
    const targetRank = card.value - 1;
    const hasPartner = tableau.some(col => col.some(c => c.value === targetRank && c.color !== card.color));
    if(hasPartner && minOpp < card.value - 2) return false;
  }
  return true;
};

export const getMoves = (state) => {
  const moves = [];
  const { tableau, foundations, stock, waste } = state;
  if(waste.length > 0) {
    const c = waste[waste.length-1];
    const fRank = foundations[c.suit].length;
    if(c.value === fRank + 1) moves.push({ type: 'W2F', card: c });
    for(let i=0; i<7; i++) {
      if(tableau[i].length===0) {
        if(c.value===13) moves.push({ type: 'W2T', to: i, card: c, isKing: true });
      } else {
        const t = tableau[i][tableau[i].length-1];
        if(c.color !== t.color && c.value === t.value - 1) moves.push({ type: 'W2T', to: i, card: c });
      }
    }
  }
  tableau.forEach((col, i) => {
    if(col.length === 0) return;
    const top = col[col.length-1];
    const fRank = foundations[top.suit].length;
    if(top.value === fRank + 1) {
      const reveals = col.length > 1 && !col[col.length-2].faceUp;
      moves.push({ type: 'T2F', from: i, card: top, reveals });
    }
    let validIdx = -1;
    for(let k=0; k<col.length; k++) if(col[k].faceUp) { validIdx=k; break; }
    if(validIdx !== -1) {
      for(let j=validIdx; j<col.length; j++) {
        const c = col[j];
        if(c.value === 13 && validIdx === 0) continue;
        for(let d=0; d<7; d++) {
          if(i===d) continue;
          const dest = tableau[d];
          if(dest.length === 0) {
            if(c.value === 13) moves.push({ type: 'T2T', from: i, to: d, idx: j, card: c, isKing: true, reveals: (j>0 && !col[j-1].faceUp) });
          } else {
            const target = dest[dest.length-1];
            if(c.color !== target.color && c.value === target.value - 1) {
              moves.push({ type: 'T2T', from: i, to: d, idx: j, card: c, reveals: (j>0 && !col[j-1].faceUp) });
            }
          }
        }
      }
    }
  });
  if(stock.length > 0) moves.push({ type: 'DRAW' });
  else if(waste.length > 0) moves.push({ type: 'RECYCLE' });
  Object.keys(foundations).forEach(suit => {
    const pile = foundations[suit];
    if (pile.length > 0) {
      const c = pile[pile.length - 1];
      if (c.value > 2) {
        for (let dst = 0; dst < 7; dst++) {
          const destPile = tableau[dst];
          if (destPile.length > 0) {
            const target = destPile[destPile.length - 1];
            if (c.color !== target.color && c.value === target.value - 1) {
              moves.push({ type: 'F2T', suit, to: dst, card: c });
            }
          } else if (c.value === 13) {
            moves.push({ type: 'F2T', suit, to: dst, card: c });
          }
        }
      }
    }
  });
  return moves;
};

export const apply = (prev, move) => {
  const next = { ...prev };
  next.tableau = prev.tableau.map(c => [...c]);
  next.foundations = { H:[...prev.foundations.H], D:[...prev.foundations.D], C:[...prev.foundations.C], S:[...prev.foundations.S] };
  next.stock = [...prev.stock];
  next.waste = [...prev.waste];
  next.history = new Set(prev.history);
  let progress = false;
  switch(move.type) {
    case 'W2F': next.foundations[move.card.suit].push(next.waste.pop()); progress=true; break;
    case 'T2F': next.foundations[move.card.suit].push(next.tableau[move.from].pop()); if(next.tableau[move.from].length > 0 && !next.tableau[move.from][next.tableau[move.from].length-1].faceUp) { next.tableau[move.from][next.tableau[move.from].length-1].faceUp=true; } progress=true; break;
    case 'W2T': next.tableau[move.to].push(next.waste.pop()); progress=true; break;
    case 'T2T': { const chunk = next.tableau[move.from].splice(move.idx); next.tableau[move.to].push(...chunk); if(next.tableau[move.from].length > 0 && !next.tableau[move.from][next.tableau[move.from].length-1].faceUp) { next.tableau[move.from][next.tableau[move.from].length-1].faceUp=true; progress=true; } break; }
    case 'F2T': next.tableau[move.to].push(next.foundations[move.suit].pop()); next.foundationPulls++; break;
    case 'DRAW': { const n = Math.min(next.stock.length, next.drawCount); for(let i=0; i<n; i++) { const c = {...next.stock.shift(), faceUp: true}; next.waste.push(c); } break; }
    case 'RECYCLE': next.stock = next.waste.reverse().map(c => ({...c, faceUp: false})); next.waste = []; next.recycleCount++; break;
  }
  next.moves++;
  next.movesSinceProgress = progress ? 0 : next.movesSinceProgress + 1;
  next.history.add(getHash(next));
  if(Object.values(next.foundations).reduce((a,b)=>a+b.length,0) === 52) next.status = 'won';
  return next;
};

export const evaluate = (state, move, stratName) => {
  const strat = STRATEGIES[stratName];
  const w = strat.weights;
  let score = 0;
  let maxHidden = 0, deepCol = -1;
  state.tableau.forEach((c, i) => { const h = c.filter(x => !x.faceUp).length; if(h > maxHidden) { maxHidden = h; deepCol = i; } });
  const demandedRanks = [];
  state.tableau.forEach(col => { if(col.length > 0) { const top = col[col.length-1]; if (top.value > 1) demandedRanks.push({ val: top.value - 1, color: top.color === 'red' ? 'black' : 'red' }); }});
  const isDemanded = (card) => demandedRanks.some(d => d.val === card.value && d.color === card.color);

  switch(move.type) {
    case 'W2F': score += w.foundation; if(!isSafe(move.card, state.foundations, state.tableau, strat)) score -= 200; break;
    case 'T2F':
      score += w.foundation;
      if(move.reveals) { score += w.reveal; if(move.from === deepCol) score += w.deep; }
      if(!isSafe(move.card, state.foundations, state.tableau, strat)) score -= 200;
      if(state.tableau[move.from].length === 1) score += (w.emptyCol || 0);
      break;
    case 'T2T':
      score += w.tableau;
      if(move.reveals) { score += w.reveal; if(move.from === deepCol) score += w.deep; score += w.chain; }
      if(move.isKing) score += w.kingToEmpty;
      else if(move.idx > 0 && !move.reveals) score += (w.sequenceBreak || -150);
      if(isDemanded(move.card)) { score += w.demand; score += w.chain / 2; }
      if(move.idx === 0) score += (w.emptyCol || 0);
      break;
    case 'W2T': score += w.waste; if(move.isKing) score += w.kingToEmpty / 2; if(isDemanded(move.card)) score += w.demand; break;
    case 'F2T': score -= 20; if(isDemanded(move.card)) score += w.demand; break;
    case 'RECYCLE': score += w.recycle; break;
    case 'DRAW': score += w.stock; break;
  }

  if(w.lookahead) {
    const sim = apply(state, move);
    let fOps = 0;
    sim.tableau.forEach(col => {
      if(col.length === 0) return;
      const top = col[col.length-1];
      if(top.value === sim.foundations[top.suit].length + 1) fOps++;
    });
    if(sim.waste.length > 0) {
      const wc = sim.waste[sim.waste.length-1];
      if(wc.value === sim.foundations[wc.suit].length + 1) fOps++;
    }
    score += fOps * w.lookahead;
    if(move.reveals) score += w.lookahead / 2;
  }

  if(w.phase) {
    const fTotal = Object.values(state.foundations).reduce((a,b) => a + b.length, 0);
    if(fTotal > 20 && (move.type === 'W2F' || move.type === 'T2F')) score += w.phase;
    if(fTotal > 35 && (move.type === 'W2F' || move.type === 'T2F')) score += w.phase;
  }

  return score;
};
