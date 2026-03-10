export interface Rank {
  title: string;
  minLevel: number;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { title: 'Novice', minLevel: 1, color: 'text-slate-400', icon: '🌱' },
  { title: 'Code Apprentice', minLevel: 5, color: 'text-blue-400', icon: '⚔️' },
  { title: 'Script Sorcerer', minLevel: 10, color: 'text-purple-400', icon: '🪄' },
  { title: 'Syntax Samurai', minLevel: 15, color: 'text-emerald-400', icon: '🍣' },
  { title: 'Code Ninja', minLevel: 20, color: 'text-orange-400', icon: '🥷' },
  { title: 'Systems Architect', minLevel: 30, color: 'text-cyan-400', icon: '🏗️' },
  { title: 'Beast Mode', minLevel: 50, color: 'text-red-500', icon: '👹' },
];

export function getRank(level: number): Rank {
  return [...RANKS].reverse().find(r => level >= r.minLevel) || RANKS[0];
}

export function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function getXpProgress(xp: number): number {
  return xp % 100;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'streak_freeze', name: 'Streak Freeze', description: 'Protects your daily streak if you miss a day.', price: 50, icon: '🧊' },
  { id: 'lecture_hint', name: 'Lecture Hint', description: 'Unlock a hidden hint for a difficult assignment.', price: 25, icon: '💡' },
  { id: 'quiz_retake', name: 'Quiz Retake', description: 'Redo a quiz you failed without waiting.', price: 40, icon: '🔄' },
  { id: 'xp_booster', name: '2x XP Booster', description: 'Double XP for the next 24 hours.', price: 100, icon: '🚀' },
];

export function getSkillPoints(xp: number): number {
  // 1 skill point per 10 XP
  return Math.floor(xp / 10);
}
