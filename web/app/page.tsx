import { CheckInPanel } from "@/components/CheckInPanel";
import { GravityGame } from "@/components/gravity/GravityGame";
import { WalletBar } from "@/components/WalletBar";

export default function Home() {
  return (
    <main className="mx-auto box-border flex h-full min-h-0 w-full max-w-lg flex-1 flex-col gap-2 overflow-hidden p-3 sm:max-w-xl sm:gap-3">
      <div className="perspective-grid flex min-h-0 max-h-[min(100dvh-1.5rem,56rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--neon-violet)]/20 bg-black/30 p-1 shadow-[0_0_60px_rgba(168,85,255,0.12)] sm:max-h-[min(100dvh-2rem,52rem)]">
        <div className="shrink-0">
          <WalletBar />
        </div>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2">
          <GravityGame />
        </div>
        <div className="relative z-10 shrink-0 p-2 pt-0">
          <CheckInPanel />
        </div>
      </div>
      <p className="shrink-0 px-1 text-center font-mono text-[10px] text-white/35">
        Base mainnet · Standard web app
      </p>
    </main>
  );
}
