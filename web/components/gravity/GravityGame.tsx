"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LEVELS, type LevelDef } from "@/lib/game/levels";
import {
  applySwipeImpulse,
  bounceInRect,
  normToPixel,
  resolveAttractorPositions,
  stepGravity,
  type SimState,
} from "@/lib/game/physics";
import { loadProgress, recordLevelCleared } from "@/lib/game/progress";

const G = 38;
const DAMP = 0.997;
const BOUNCE = 0.82;
const PLAYER_R_FACTOR = 0.022;

type PointerTrail = { x: number; y: number }[];

export function GravityGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [maxUnlocked, setMaxUnlocked] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [levelId, setLevelId] = useState(1);
  const [status, setStatus] = useState<"idle" | "running" | "won" | "lost">("idle");
  const [hudTime, setHudTime] = useState(0);

  const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];

  const simRef = useRef<SimState>({ px: 0, py: 0, vx: 0, vy: 0 });
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  const swipeRef = useRef<{
    active: boolean;
    x0: number;
    y0: number;
    t0: number;
    trail: PointerTrail;
  }>({ active: false, x0: 0, y0: 0, t0: 0, trail: [] });

  useEffect(() => {
    setMaxUnlocked(loadProgress().maxUnlocked);
  }, []);

  const syncProgress = useCallback(() => {
    setMaxUnlocked(loadProgress().maxUnlocked);
  }, []);

  const resetLevel = useCallback(
    (def: LevelDef, w: number, h: number) => {
      const p = normToPixel(def.playerStart, w, h);
      simRef.current = { px: p.x, py: p.y, vx: 0, vy: 0 };
      timeRef.current = def.timeLimitSec;
      setHudTime(def.timeLimitSec);
    },
    [],
  );

  const startRun = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    resetLevel(level, w, h);
    setStatus("running");
    runningRef.current = true;
  }, [level, resetLevel]);

  useEffect(() => {
    if (status !== "running") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = performance.now();

    const loop = (now: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      const playerR = PLAYER_R_FACTOR * Math.min(cssW, cssH);

      const tGame = level.timeLimitSec - timeRef.current;
      const attractors = resolveAttractorPositions(level, tGame, cssW, cssH);

      let s = simRef.current;
      s = stepGravity(s, attractors, dt, G, DAMP);
      s = bounceInRect(s, cssW, cssH, playerR, BOUNCE);
      simRef.current = s;

      timeRef.current -= dt;
      if (timeRef.current <= 0) {
        timeRef.current = 0;
        setHudTime(0);
        runningRef.current = false;
        setStatus("lost");
        return;
      }
      setHudTime(timeRef.current);

      const portalPx = normToPixel(level.portal.c, cssW, cssH);
      const portalR = level.portal.r * Math.min(cssW, cssH);
      const dPortal = Math.hypot(s.px - portalPx.x, s.py - portalPx.y);
      if (dPortal < portalR + playerR * 0.85) {
        runningRef.current = false;
        recordLevelCleared(level.id);
        syncProgress();
        setStatus("won");
        return;
      }

      for (const hz of level.hazards) {
        const c = normToPixel(hz.c, cssW, cssH);
        const hr = hz.r * Math.min(cssW, cssH);
        if (Math.hypot(s.px - c.x, s.py - c.y) < hr + playerR * 0.75) {
          runningRef.current = false;
          setStatus("lost");
          return;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      ctx.strokeStyle = "rgba(0,255,255,0.06)";
      ctx.lineWidth = 1;
      const grid = 48;
      for (let x = 0; x < cssW; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssH);
        ctx.stroke();
      }
      for (let y = 0; y < cssH; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
      }

      for (const a of attractors) {
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 3);
        g.addColorStop(0, "rgba(255,0,255,0.35)");
        g.addColorStop(0.4, "rgba(120,80,255,0.12)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,52,245,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const hz of level.hazards) {
        const c = normToPixel(hz.c, cssW, cssH);
        const hr = hz.r * Math.min(cssW, cssH);
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, hr);
        g.addColorStop(0, "rgba(255,60,80,0.45)");
        g.addColorStop(1, "rgba(80,0,20,0.05)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,80,100,0.85)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const pulse = 0.85 + Math.sin(now / 200) * 0.08;
      ctx.strokeStyle = `rgba(0,255,247,${0.55 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(portalPx.x, portalPx.y, portalR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(168,85,255,${0.4 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(portalPx.x, portalPx.y, portalR * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      const tr = swipeRef.current.trail;
      if (tr.length > 1) {
        ctx.strokeStyle = "rgba(0,255,255,0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tr[0].x, tr[0].y);
        for (let i = 1; i < tr.length; i++) ctx.lineTo(tr[i].x, tr[i].y);
        ctx.stroke();
      }

      const cg = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, playerR * 2.2);
      cg.addColorStop(0, "#e0ffff");
      cg.addColorStop(0.35, "rgba(0,255,255,0.9)");
      cg.addColorStop(1, "rgba(0,120,255,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(s.px, s.py, playerR * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7fffff";
      ctx.beginPath();
      ctx.arc(s.px, s.py, playerR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [status, level, syncProgress]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(() => resizeCanvas());
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  const toLocal = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const b = canvas.getBoundingClientRect();
    return { x: clientX - b.left, y: clientY - b.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (status !== "running") return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = toLocal(e.clientX, e.clientY);
    swipeRef.current = {
      active: true,
      x0: p.x,
      y0: p.y,
      t0: performance.now(),
      trail: [p],
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!swipeRef.current.active || status !== "running") return;
    const p = toLocal(e.clientX, e.clientY);
    swipeRef.current.trail.push(p);
    if (swipeRef.current.trail.length > 32) swipeRef.current.trail.shift();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!swipeRef.current.active || status !== "running") return;
    swipeRef.current.active = false;
    const p = toLocal(e.clientX, e.clientY);
    const { x0, y0, t0 } = swipeRef.current;
    const dt = performance.now() - t0;
    const dx = p.x - x0;
    const dy = p.y - y0;
    const canvas = canvasRef.current;
    const scale = canvas ? Math.min(canvas.width, canvas.height) / 400 : 1;
    simRef.current = applySwipeImpulse(simRef.current, dx, dy, dt, scale);
    swipeRef.current.trail = [];
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 px-1">
        <div>
          <h2 className="flicker-soft font-[family-name:var(--font-display)] text-lg font-bold tracking-wide text-[var(--neon-cyan)]">
            {level.title}
          </h2>
          <p className="font-mono text-[10px] text-white/45">
            Swipe on the field to thrust the core
          </p>
        </div>
        <div className="text-right font-mono text-xs text-[var(--neon-magenta)]">
          <div>T-{hudTime.toFixed(1)}s</div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/70 hover:bg-white/10"
          >
            Sectors
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 basis-0 overflow-hidden rounded-2xl border border-[var(--neon-cyan)]/25 shadow-[0_0_30px_rgba(0,255,255,0.08)]"
      >
        <canvas
          ref={canvasRef}
          className="touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {status === "idle" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-4 text-center">
            <p className="font-mono text-sm text-white/80">Ready for deployment</p>
            <button
              type="button"
              onClick={startRun}
              className="pointer-events-auto cyber-btn-primary rounded-xl px-8 py-3 font-mono text-sm font-bold uppercase"
            >
              Initiate
            </button>
          </div>
        )}
        {status === "won" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-4">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--neon-cyan)]">
              Sector cleared
            </p>
            <p className="font-mono text-xs text-white/60">
              Next sector unlocked
            </p>
            <div className="flex gap-2">
              {level.id < LEVELS.length && (
                <button
                  type="button"
                  className="cyber-btn-accent rounded-lg px-4 py-2 font-mono text-xs uppercase"
                  onClick={() => {
                    setLevelId(level.id + 1);
                    setStatus("idle");
                  }}
                >
                  Next sector
                </button>
              )}
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 font-mono text-xs text-white/80"
                onClick={() => setStatus("idle")}
              >
                Close
              </button>
            </div>
          </div>
        )}
        {status === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-4">
            <p className="font-[family-name:var(--font-display)] text-2xl text-red-300">
              Signal lost
            </p>
            <button
              type="button"
              className="cyber-btn-primary rounded-lg px-6 py-2 font-mono text-xs uppercase"
              onClick={() => {
                setStatus("idle");
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => {
            setPickerOpen(false);
            syncProgress();
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--neon-violet)]/40 bg-[#070212]/95 p-4 shadow-[0_0_50px_rgba(168,85,255,0.2)]"
            onClick={(ev) => ev.stopPropagation()}
            role="dialog"
            aria-label="Level select"
          >
            <h3 className="mb-3 font-mono text-sm uppercase tracking-[0.2em] text-[var(--neon-cyan)]">
              Sectors
            </h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LEVELS.map((L) => {
                const locked = L.id > maxUnlocked;
                return (
                  <li key={L.id}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setLevelId(L.id);
                        setPickerOpen(false);
                        setStatus("idle");
                      }}
                      className="flex w-full flex-col items-start rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-[var(--neon-cyan)]/40 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <span className="font-mono text-[10px] text-white/40">
                        #{L.id}
                      </span>
                      <span className="font-mono text-xs text-white/90">
                        {locked ? "Locked" : L.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
