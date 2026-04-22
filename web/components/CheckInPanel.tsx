"use client";

import { base } from "viem/chains";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { useState } from "react";
import { checkInAbi, getCheckInAddress } from "@/lib/contracts/checkIn";
import { getCheckInDataSuffix } from "@/lib/builder/getDataSuffix";

export function CheckInPanel() {
  const { address, isConnected, chainId } = useAccount();
  const contractAddress = getCheckInAddress();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [lastError, setLastError] = useState<string | null>(null);

  const { data: streakOnChain } = useReadContract({
    address: contractAddress,
    abi: checkInAbi,
    functionName: "streak",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(contractAddress && address && isConnected) },
  });

  const busy = isWriting || isSwitching;

  async function handleCheckIn() {
    setLastError(null);
    if (!contractAddress) {
      setLastError("Contract address not configured.");
      return;
    }
    if (!isConnected || !address) {
      setLastError("Connect your wallet first.");
      return;
    }
    try {
      const baseId = base.id;
      if (chainId !== baseId) {
        await switchChainAsync({ chainId: baseId });
      }
      const dataSuffix = getCheckInDataSuffix();
      await writeContractAsync({
        address: contractAddress,
        abi: checkInAbi,
        functionName: "checkIn",
        chainId: baseId,
        dataSuffix,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      setLastError(msg);
    }
  }

  if (!contractAddress) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center font-mono text-[11px] text-amber-200/90">
        Set <span className="text-white">NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS</span> after
        deployment.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--neon-violet)]/30 bg-black/40 p-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--neon-magenta)]">
          Daily check-in
        </span>
        {streakOnChain !== undefined && address && (
          <span className="font-mono text-xs text-[var(--neon-cyan)]">
            Streak: {String(streakOnChain)}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => void handleCheckIn()}
        disabled={!isConnected || busy}
        className="cyber-btn-accent w-full rounded-lg py-2.5 font-mono text-xs font-bold uppercase tracking-wider disabled:opacity-40"
      >
        {busy ? "Confirm in wallet…" : "Check in on Base"}
      </button>
      {lastError && (
        <p className="mt-2 font-mono text-[10px] text-red-300/90">{lastError}</p>
      )}
    </div>
  );
}
