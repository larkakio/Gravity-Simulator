export type NormVec = { x: number; y: number };

export type Oscillator = {
  amplitude: number;
  axis: "x" | "y";
  /** Cycles per second */
  hz: number;
};

export type AttractorDef = {
  c: NormVec;
  mass: number;
  /** Visual radius factor (multiplied by min(canvas w,h)) */
  r: number;
  oscillate?: Oscillator;
};

export type ZoneCircle = { c: NormVec; r: number };

export type LevelDef = {
  id: number;
  title: string;
  timeLimitSec: number;
  playerStart: NormVec;
  portal: ZoneCircle;
  attractors: AttractorDef[];
  hazards: ZoneCircle[];
};

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: "Neon Drift",
    timeLimitSec: 45,
    playerStart: { x: 0.12, y: 0.5 },
    portal: { c: { x: 0.88, y: 0.5 }, r: 0.055 },
    attractors: [
      { c: { x: 0.5, y: 0.5 }, mass: 900, r: 0.07 },
    ],
    hazards: [],
  },
  {
    id: 2,
    title: "Shard Corridor",
    timeLimitSec: 40,
    playerStart: { x: 0.1, y: 0.25 },
    portal: { c: { x: 0.85, y: 0.72 }, r: 0.048 },
    attractors: [
      { c: { x: 0.35, y: 0.45 }, mass: 700, r: 0.06 },
      { c: { x: 0.62, y: 0.55 }, mass: 500, r: 0.05 },
    ],
    hazards: [
      { c: { x: 0.5, y: 0.2 }, r: 0.045 },
      { c: { x: 0.48, y: 0.82 }, r: 0.04 },
    ],
  },
  {
    id: 3,
    title: "Pulse Binary",
    timeLimitSec: 38,
    playerStart: { x: 0.5, y: 0.88 },
    portal: { c: { x: 0.5, y: 0.12 }, r: 0.045 },
    attractors: [
      {
        c: { x: 0.28, y: 0.5 },
        mass: 600,
        r: 0.055,
        oscillate: { amplitude: 0.12, axis: "y", hz: 0.35 },
      },
      {
        c: { x: 0.72, y: 0.5 },
        mass: 600,
        r: 0.055,
        oscillate: { amplitude: 0.12, axis: "y", hz: 0.35 },
      },
    ],
    hazards: [
      { c: { x: 0.5, y: 0.5 }, r: 0.06 },
    ],
  },
  {
    id: 4,
    title: "Helix Run",
    timeLimitSec: 32,
    playerStart: { x: 0.08, y: 0.5 },
    portal: { c: { x: 0.92, y: 0.5 }, r: 0.042 },
    attractors: [
      { c: { x: 0.5, y: 0.35 }, mass: 750, r: 0.05 },
      { c: { x: 0.5, y: 0.65 }, mass: 750, r: 0.05 },
      {
        c: { x: 0.5, y: 0.5 },
        mass: 350,
        r: 0.04,
        oscillate: { amplitude: 0.18, axis: "x", hz: 0.5 },
      },
    ],
    hazards: [
      { c: { x: 0.28, y: 0.5 }, r: 0.035 },
      { c: { x: 0.72, y: 0.5 }, r: 0.035 },
    ],
  },
];
