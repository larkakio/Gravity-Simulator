import { type Hex } from "viem";
import { Attribution } from "ox/erc8021";

/**
 * ERC-8021 builder code suffix for Base attribution.
 * Prefer `NEXT_PUBLIC_BUILDER_CODE` (bc_…); optional raw hex override.
 */
export function getCheckInDataSuffix(): Hex | undefined {
  const override = process.env.NEXT_PUBLIC_BUILDER_CODE_SUFFIX;
  if (override?.startsWith("0x") && override.length > 2) {
    return override as Hex;
  }

  const code = process.env.NEXT_PUBLIC_BUILDER_CODE;
  if (!code?.trim()) return undefined;

  return Attribution.toDataSuffix({
    codes: [code.trim()],
  });
}
