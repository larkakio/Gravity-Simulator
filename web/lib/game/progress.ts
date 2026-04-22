const STORAGE_KEY = "gravity-sim-base-progress";

export type GameProgress = {
  maxUnlocked: number;
};

export function loadProgress(): GameProgress {
  if (typeof window === "undefined") return { maxUnlocked: 1 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { maxUnlocked: 1 };
    const p = JSON.parse(raw) as Partial<GameProgress>;
    return { maxUnlocked: Math.max(1, Math.min(99, Number(p.maxUnlocked) || 1)) };
  } catch {
    return { maxUnlocked: 1 };
  }
}

/** After completing level `levelId` (1-based), unlock `levelId + 1`. */
export function recordLevelCleared(levelId: number) {
  const cur = loadProgress();
  const nextUnlock = levelId + 1;
  if (nextUnlock > cur.maxUnlocked) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ maxUnlocked: nextUnlock }),
    );
  }
}
