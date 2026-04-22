export const checkInAbi = [
  {
    type: "function",
    name: "checkIn",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "lastCheckInAt",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "streak",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "day", type: "uint256", indexed: true, internalType: "uint256" },
      {
        name: "streakCount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;

export function getCheckInAddress(): `0x${string}` | undefined {
  const raw = process.env.NEXT_PUBLIC_CHECK_IN_CONTRACT_ADDRESS;
  if (!raw || !raw.startsWith("0x") || raw.length !== 42) return undefined;
  return raw as `0x${string}`;
}
