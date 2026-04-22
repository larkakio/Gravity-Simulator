"use client";

import { base } from "viem/chains";
import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useConnectors,
  useSwitchChain,
} from "wagmi";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const { address, isConnected, chainId, status } = useAccount();
  const connectors = useConnectors();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [sheetOpen, setSheetOpen] = useState(false);

  const wrongNetwork = isConnected && chainId !== undefined && chainId !== base.id;

  useEffect(() => {
    if (isConnected) setSheetOpen(false);
  }, [isConnected]);

  return (
    <header className="relative z-40 flex shrink-0 flex-col gap-2 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--neon-cyan)] opacity-90">
            Gravity Simulator
          </p>
          {isConnected && address ? (
            <p className="truncate font-mono text-xs text-white/80">
              {shortenAddress(address)}
            </p>
          ) : (
            <p className="text-xs text-white/50">Wallet disconnected</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              onClick={() => disconnect()}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70 transition hover:bg-white/10"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              disabled={status === "connecting" || isConnecting}
              className="cyber-btn-primary rounded-lg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide"
            >
              Connect wallet
            </button>
          )}
        </div>
      </div>

      {wrongNetwork && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-950/80 px-3 py-2 text-xs text-amber-100">
          <span>Wrong network</span>
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: base.id })}
            className="rounded-md bg-amber-500/20 px-2 py-1 font-mono text-amber-200 hover:bg-amber-500/30"
          >
            {isSwitching ? "…" : "Switch to Base"}
          </button>
        </div>
      )}

      {sheetOpen && !isConnected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          role="presentation"
          onClick={() => setSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Choose wallet"
            className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-[var(--neon-magenta)]/30 bg-[#0a0514]/95 p-4 shadow-[0_-8px_40px_rgba(255,0,255,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-sm uppercase tracking-widest text-[var(--neon-cyan)]">
                Wallets
              </h2>
              <button
                type="button"
                className="text-white/50 hover:text-white"
                onClick={() => setSheetOpen(false)}
              >
                Close
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {connectors.map((c) => (
                <li key={c.uid}>
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() =>
                      connect({ connector: c, chainId: base.id })
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left font-mono text-sm text-white transition hover:border-[var(--neon-cyan)]/50 hover:bg-white/10 disabled:opacity-40"
                  >
                    <span>{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
