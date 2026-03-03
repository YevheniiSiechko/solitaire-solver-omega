export const SUITS = {
  H: { s: '♥', c: 'text-red-500' },
  D: { s: '♦', c: 'text-red-500' },
  C: { s: '♣', c: 'text-slate-900' },
  S: { s: '♠', c: 'text-slate-900' }
};

export const VALUES = { A:1, '2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, 'X':10, 'J':11, 'Q':12, 'K':13 };
export const RANKS_ORDER = ['A','2','3','4','5','6','7','8','9','X','J','Q','K'];
export const SUITS_ORDER = ['H','D','C','S'];
export const SUIT_NAMES = { H: 'Hearts', D: 'Diamonds', C: 'Clubs', S: 'Spades' };

export const DIFFICULTY = [
  { min: 0,   max: 80,       label: 'Beginner',  color: '#34d399' },
  { min: 80,  max: 100,      label: 'Easy',      color: '#4ade80' },
  { min: 100, max: 120,      label: 'Casual',    color: '#a3e635' },
  { min: 120, max: 145,      label: 'Standard',  color: '#facc15' },
  { min: 145, max: 175,      label: 'Moderate',  color: '#fbbf24' },
  { min: 175, max: 215,      label: 'Tricky',    color: '#fb923c' },
  { min: 215, max: 270,      label: 'Hard',      color: '#f97316' },
  { min: 270, max: 340,      label: 'Expert',    color: '#ef4444' },
  { min: 340, max: 430,      label: 'Master',    color: '#dc2626' },
  { min: 430, max: Infinity, label: 'Nightmare', color: '#a855f7' },
];

export const STRATEGIES = {
  UNBLOCKER: { name: "The Unblocker", description: "Focuses on mobility", weights: { foundation: 50, reveal: 400, tableau: 400, stock: 20, recycle: -200, waste: 50, kingToEmpty: 800, chain: 800, demand: 800, deep: 100 }, safety: "Normal" },
  APEX: { name: "Apex (Balanced)", weights: { foundation: 120, reveal: 700, tableau: 50, stock: 10, recycle: -600, waste: 20, kingToEmpty: 400, chain: 300, demand: 300, deep: 450 }, safety: "Smart" },
  ROYAL_GUARD: { name: "Royal Guard", weights: { foundation: 80, reveal: 800, tableau: 50, stock: 5, recycle: -300, waste: 20, kingToEmpty: 3000, chain: 200, demand: 500, deep: 1000 }, safety: "Strict" },
  RUSHER: { name: "Rusher (Aggro)", weights: { foundation: 800, reveal: 200, tableau: 10, stock: 5, recycle: -200, waste: 50, kingToEmpty: 50, chain: 50, demand: 50, deep: 100 }, safety: "None" },
  DIGGER: { name: "Excavator", weights: { foundation: 20, reveal: 1500, tableau: 20, stock: 10, recycle: -100, waste: 10, kingToEmpty: 100, chain: 50, demand: 50, deep: 3000 }, safety: "None" },
  ARCHITECT: { name: "Architect", weights: { foundation: 0, reveal: 400, tableau: 500, stock: 10, recycle: -100, waste: 50, kingToEmpty: 300, chain: 1000, demand: 400, deep: 200 }, safety: "Strict" },
  TACTICIAN: { name: "The Tactician", weights: { foundation: 50, reveal: 500, tableau: 50, stock: 10, recycle: -200, waste: 20, kingToEmpty: 200, chain: 2500, demand: 2500, deep: 200 }, safety: "Normal" },
  PERFECTIONIST: { name: "Perfectionist", weights: { foundation: 50, reveal: 600, tableau: 100, stock: 0, recycle: -500, waste: 0, kingToEmpty: 100, sequenceBreak: -2000, chain: 200, demand: 200, deep: 200 }, safety: "Strict" },
  SLAYER: { name: "King Slayer", weights: { foundation: 50, reveal: 500, tableau: 50, stock: 20, recycle: -300, waste: 30, kingToEmpty: 2000, chain: 200, demand: 200, deep: 300 }, safety: "Normal" },
  HOARDER: { name: "Hoarder", weights: { foundation: -100, reveal: 600, tableau: 300, stock: 5, recycle: -100, waste: 40, kingToEmpty: 300, chain: 500, demand: 300, deep: 200 }, safety: "Strict" },
  DESPERADO: { name: "Desperado", weights: { foundation: 200, reveal: 200, tableau: 200, stock: 500, recycle: 0, waste: 200, kingToEmpty: 200, chain: 0, demand: 0, deep: 0 }, safety: "None" },
  WIDE: { name: "Wide Receiver", weights: { foundation: 50, reveal: 300, tableau: 50, stock: 20, recycle: -200, waste: 30, kingToEmpty: 200, chain: 200, demand: 200, deep: 100 }, safety: "Normal" },
  CHAOS: { name: "Chaos Theory", weights: { foundation: 300, reveal: 300, tableau: 300, stock: 300, recycle: -100, waste: 300, kingToEmpty: 300, chain: 300, demand: 300, deep: 300 }, safety: "None" },
  REVERSE: { name: "Reverse Logic", weights: { foundation: 500, reveal: 100, tableau: 100, stock: 100, recycle: -50, waste: 100, kingToEmpty: 50, chain: 50, demand: 50, deep: 50 }, safety: "None" },
  ORACLE: { name: "Oracle (Lookahead)", weights: { foundation: 100, reveal: 500, tableau: 50, stock: 10, recycle: -400, waste: 30, kingToEmpty: 400, chain: 300, demand: 400, deep: 300, lookahead: 150 }, safety: "Smart" },
  LIBERATOR: { name: "Liberator", weights: { foundation: 80, reveal: 700, tableau: 30, stock: 15, recycle: -300, waste: 30, kingToEmpty: 600, chain: 400, demand: 400, deep: 500, emptyCol: 1500 }, safety: "Normal" },
  ENDGAME: { name: "Endgame Master", weights: { foundation: 150, reveal: 500, tableau: 80, stock: 10, recycle: -300, waste: 30, kingToEmpty: 300, chain: 300, demand: 300, deep: 300, phase: 500 }, safety: "Smart" },
  PROPHET: { name: "Prophet (Deep Sight)", weights: { foundation: 90, reveal: 900, tableau: 60, stock: 10, recycle: -500, waste: 25, kingToEmpty: 500, chain: 600, demand: 500, deep: 2000, lookahead: 250 }, safety: "Smart" },
  PHOENIX: { name: "Phoenix (Adaptive)", weights: { foundation: 100, reveal: 600, tableau: 120, stock: 15, recycle: -400, waste: 35, kingToEmpty: 500, chain: 500, demand: 400, deep: 400, emptyCol: 1200, phase: 800 }, safety: "Normal" },
  SENTINEL: { name: "Sentinel (Safe Chain)", weights: { foundation: 60, reveal: 800, tableau: 80, stock: 5, recycle: -600, waste: 20, kingToEmpty: 700, chain: 1500, demand: 1200, deep: 800, emptyCol: 600 }, safety: "Strict" }
};

export const ORDERED_STRATS = ['UNBLOCKER', ...Object.keys(STRATEGIES).filter(k => k !== 'UNBLOCKER')];

export const VERDICT_COLORS = {
  'EASY': '#34d399', 'STANDARD': '#e2e8f0', 'BRAIN TEASER': '#c084fc',
  'TRICKY': '#60a5fa', 'GRIND': '#f59e0b', 'MARATHON': '#fb923c', 'FAIL': '#ef4444'
};

export const DEFAULT_DECK = "QH,5D,3C,XH,QC,9D,6D,7S,8H,JD,7C,AC,6S,JH,4D,3S,9S,JS,KS,AD,6C,2D,AS,5S,9H,KC,5C,JC,QD,4S,8C,8D,AH,9C,6H,KD,2S,7D,8S,XC,2H,3D,5H,4C,2C,QS,3H,XD,4H,KH,XS,7H";
