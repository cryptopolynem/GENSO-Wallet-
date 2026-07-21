import { useBalance, useChainId, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { getTokens } from "../lib/tokens";
import { erc20Abi } from "../lib/erc20Abi";

export interface TokenBalanceResult {
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  address: Address | null;
  value: bigint | undefined;
  isLoading: boolean;
}

/**
 * 接続アドレスの POL（ネイティブ）・USDT・JPYC 残高をまとめて取得する。
 */
export function useTokenBalances(address?: Address): TokenBalanceResult[] {
  const chainId = useChainId();
  const tokens = getTokens(chainId);

  const nativeToken = tokens.find((t) => t.address === null)!;
  const erc20Tokens = tokens.filter((t) => t.address !== null);

  const nativeBalance = useBalance({
    address,
    chainId,
    query: { enabled: !!address },
  });

  const erc20Results = useReadContracts({
    contracts: erc20Tokens.map((t) => ({
      address: t.address as Address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId,
    })),
    query: { enabled: !!address },
  });

  return [
    {
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      decimals: nativeToken.decimals,
      color: nativeToken.color,
      address: null,
      value: nativeBalance.data?.value,
      isLoading: nativeBalance.isLoading,
    },
    ...erc20Tokens.map((t, i) => ({
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      color: t.color,
      address: t.address,
      value: erc20Results.data?.[i]?.result as bigint | undefined,
      isLoading: erc20Results.isLoading,
    })),
  ];
}
