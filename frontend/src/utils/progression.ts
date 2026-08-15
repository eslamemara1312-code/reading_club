export const XP_PER_LEVEL = 200;
export const MAX_LEVEL = 10;

export const LEVEL_TITLES: Record<number, string> = {
  1: 'مبتدئ القراءة 📖',
  2: 'قارئ شغوف 🚀',
  3: 'مثابر على الورد 💪',
  4: 'ملتزم يوماً بيوم ✨',
  5: 'بطل القراءة الجماعية 🏆',
  6: 'أسطورة الكتب 👑',
  7: 'خارق الالتزام ⚡',
  8: 'عبقري المعرفة 🧠',
  9: 'أيقونة النادي 💎',
  10: 'فيلسوف القراءة 🌟',
};

export interface LevelProgression {
  currentLevel: number;
  levelTitle: string;
  currentLevelStartXP: number;
  nextLevelXP: number;
  remainingXP: number;
  progressPercentage: number;
  isMaxLevel: boolean;
  totalXP: number;
}

/**
 * Calculates level progression details derived authoritatively from total XP.
 * Progression model: Cumulative steps of 200 XP per level up to max level 10.
 * Level 1: 0 - 199 XP
 * Level 2: 200 - 399 XP
 * ...
 * Level 10 (Max): 1800+ XP
 */
export function calculateLevelProgression(rawXp?: number | null): LevelProgression {
  const totalXP = Math.max(0, Math.floor(Number(rawXp) || 0));
  const rawLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const currentLevel = Math.min(MAX_LEVEL, Math.max(1, rawLevel));
  const isMaxLevel = currentLevel >= MAX_LEVEL;
  const levelTitle = LEVEL_TITLES[currentLevel] || LEVEL_TITLES[MAX_LEVEL];

  const currentLevelStartXP = (currentLevel - 1) * XP_PER_LEVEL;

  if (isMaxLevel) {
    return {
      currentLevel,
      levelTitle,
      currentLevelStartXP,
      nextLevelXP: currentLevelStartXP,
      remainingXP: 0,
      progressPercentage: 100,
      isMaxLevel: true,
      totalXP,
    };
  }

  const nextLevelXP = currentLevel * XP_PER_LEVEL;
  const remainingXP = Math.max(0, nextLevelXP - totalXP);
  const xpInCurrentLevel = totalXP - currentLevelStartXP;
  const xpNeededForLevel = nextLevelXP - currentLevelStartXP;
  const progressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));

  return {
    currentLevel,
    levelTitle,
    currentLevelStartXP,
    nextLevelXP,
    remainingXP,
    progressPercentage,
    isMaxLevel: false,
    totalXP,
  };
}
