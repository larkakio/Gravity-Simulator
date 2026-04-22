import type { LevelDef, NormVec } from "./levels";

const EPS = 1e-4;

export type SimState = {
  px: number;
  py: number;
  vx: number;
  vy: number;
};

export function resolveAttractorPositions(
  level: LevelDef,
  tSec: number,
  w: number,
  h: number,
): { x: number; y: number; mass: number; r: number }[] {
  return level.attractors.map((a) => {
    let x = a.c.x * w;
    let y = a.c.y * h;
    if (a.oscillate) {
      const off =
        Math.sin(tSec * a.oscillate.hz * Math.PI * 2) *
        a.oscillate.amplitude *
        (a.oscillate.axis === "x" ? w : h);
      if (a.oscillate.axis === "x") x += off;
      else y += off;
    }
    const r = a.r * Math.min(w, h);
    return { x, y, mass: a.mass, r };
  });
}

export function stepGravity(
  state: SimState,
  attractors: { x: number; y: number; mass: number }[],
  dt: number,
  G: number,
  damping: number,
): SimState {
  let ax = 0;
  let ay = 0;
  for (const body of attractors) {
    const dx = body.x - state.px;
    const dy = body.y - state.py;
    const distSq = dx * dx + dy * dy + EPS;
    const dist = Math.sqrt(distSq);
    const f = (G * body.mass) / distSq;
    ax += (f * dx) / dist;
    ay += (f * dy) / dist;
  }
  const vx = (state.vx + ax * dt) * damping;
  const vy = (state.vy + ay * dt) * damping;
  const px = state.px + vx * dt;
  const py = state.py + vy * dt;
  return { px, py, vx, vy };
}

export function bounceInRect(
  state: SimState,
  w: number,
  h: number,
  playerR: number,
  elasticity: number,
): SimState {
  let { px, py, vx, vy } = state;
  const minX = playerR;
  const maxX = w - playerR;
  const minY = playerR;
  const maxY = h - playerR;
  if (px < minX) {
    px = minX;
    vx = Math.abs(vx) * elasticity;
  } else if (px > maxX) {
    px = maxX;
    vx = -Math.abs(vx) * elasticity;
  }
  if (py < minY) {
    py = minY;
    vy = Math.abs(vy) * elasticity;
  } else if (py > maxY) {
    py = maxY;
    vy = -Math.abs(vy) * elasticity;
  }
  return { px, py, vx, vy };
}

export function applySwipeImpulse(
  state: SimState,
  swipeDx: number,
  swipeDy: number,
  dtMs: number,
  scale: number,
): SimState {
  const len = Math.hypot(swipeDx, swipeDy);
  if (len < 4) return state;
  const nx = swipeDx / len;
  const ny = swipeDy / len;
  const speed = len / Math.max(8, dtMs);
  const mag = Math.min(55, len * 0.12 + speed * 0.25) * scale;
  return {
    ...state,
    vx: state.vx + nx * mag,
    vy: state.vy + ny * mag,
  };
}

export function normToPixel(c: NormVec, w: number, h: number) {
  return { x: c.x * w, y: c.y * h };
}
