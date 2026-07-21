import { polygon, polygonAmoy } from "wagmi/chains";
import type { TokenConfig, TokenConfigMap } from "../types";

/**
 * GENSO Wallet が対応するトークン一覧。
 * POLはネイティブトークンのため address は null。
 *
 * Polygon Mainnet:
 *  - USDT (Tether USD, PoS版): 0xc2132D05D31c914a87C6611C10748AEb04B58e8 (decimals: 6)
 *  - JPYC (JPY Coin): 0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB (decimals: 18)
 *
 * Polygon Amoy Testnet:
 *  - USDT / JPYC の公式デプロイは存在しないため、テスト用のダミーアドレスを
 *    設定しています。実際にテストする場合はテストネット用に発行した
 *    ERC20トークンのアドレスに書き換えてください（下記 TESTNET_* を編集）。
 */

// ここをAmoyでテストしたい実際のトークンアドレスに置き換えてください。
const TESTNET_USDT_ADDRESS = "0x0000000000000000000000000000000000000001" as const;
const TESTNET_JPYC_ADDRESS = "0x0000000000000000000000000000000000000002" as const;

export const TOKENS: TokenConfigMap = {
  [polygon.id]: [
    {
      symbol: "POL",
      name: "Polygon Ecosystem Token",
      decimals: 18,
      address: null,
      color: "#8247E5",
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8",
      color: "#26A17B",
    },
    {
      symbol: "JPYC",
      name: "JPY Coin",
      decimals: 18,
      address: "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB",
      color: "#E8393B",
    },
  ],
  [polygonAmoy.id]: [
    {
      symbol: "POL",
      name: "Polygon Ecosystem Token (Amoy)",
      decimals: 18,
      address: null,
      color: "#8247E5",
    },
    {
      symbol: "USDT",
      name: "Tether USD (Testnet)",
      decimals: 6,
      address: TESTNET_USDT_ADDRESS,
      color: "#26A17B",
    },
    {
      symbol: "JPYC",
      name: "JPY Coin (Testnet)",
      decimals: 18,
      address: TESTNET_JPYC_ADDRESS,
      color: "#E8393B",
    },
  ],
};

export function getTokens(chainId: number): TokenConfig[] {
  return TOKENS[chainId] ?? TOKENS[polygon.id];
}

export function getToken(
  chainId: number,
  symbol: TokenConfig["symbol"]
): TokenConfig | undefined {
  return getTokens(chainId).find((t) => t.symbol === symbol);
}
