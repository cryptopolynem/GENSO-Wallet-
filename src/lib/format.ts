import { formatUnits, parseUnits } from "viem";

/** BigIntの残高を人間が読みやすい文字列にフォーマットする */
export function formatTokenAmount(
  value: bigint | undefined,
  decimals: number,
  maxFractionDigits = 4
): string {
  if (value === undefined) return "--";
  const formatted = formatUnits(value, decimals);
  const [intPart, fracPart] = formatted.split(".");
  const intWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!fracPart) return intWithComma;
  const trimmedFrac = fracPart.slice(0, maxFractionDigits).replace(/0+$/, "");
  return trimmedFrac ? `${intWithComma}.${trimmedFrac}` : intWithComma;
}

/** 入力文字列（例: "12.34"）をトークンの最小単位のBigIntに変換する */
export function parseTokenAmount(value: string, decimals: number): bigint {
  if (!value || Number.isNaN(Number(value))) return 0n;
  try {
    return parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

/** アドレスを先頭6桁・末尾4桁に短縮表示する */
export function shortenAddress(address?: string | null): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** UnixタイムスタンプをJST表記の日時文字列に変換する */
export function formatDateTime(timestampSeconds: number): string {
  if (!timestampSeconds) return "--";
  const date = new Date(timestampSeconds * 1000);
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
