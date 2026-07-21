import type { MultisigWalletMeta } from "../types";

const STORAGE_KEY = "genso-wallet:multisig-wallets";

function readAll(): MultisigWalletMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MultisigWalletMeta[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(list: MultisigWalletMeta[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** 指定したチェーンに紐づくマルチシグウォレット一覧を取得する */
export function getMultisigWallets(chainId: number): MultisigWalletMeta[] {
  return readAll().filter((w) => w.chainId === chainId);
}

/** 新しいマルチシグウォレットをローカル一覧に追加する */
export function addMultisigWallet(meta: MultisigWalletMeta): void {
  const list = readAll();
  const exists = list.some(
    (w) =>
      w.address.toLowerCase() === meta.address.toLowerCase() &&
      w.chainId === meta.chainId
  );
  if (exists) return;
  writeAll([...list, meta]);
}

/** アドレスを指定してローカル一覧からマルチシグウォレットを削除する */
export function removeMultisigWallet(chainId: number, address: string): void {
  const list = readAll();
  writeAll(
    list.filter(
      (w) => !(w.chainId === chainId && w.address.toLowerCase() === address.toLowerCase())
    )
  );
}
