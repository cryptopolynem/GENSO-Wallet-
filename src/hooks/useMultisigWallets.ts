import { useCallback, useEffect, useState } from "react";
import { useChainId } from "wagmi";
import type { MultisigWalletMeta } from "../types";
import { addMultisigWallet, getMultisigWallets, removeMultisigWallet } from "../lib/storage";

export function useMultisigWallets() {
  const chainId = useChainId();
  const [wallets, setWallets] = useState<MultisigWalletMeta[]>([]);

  const refresh = useCallback(() => {
    setWallets(getMultisigWallets(chainId));
  }, [chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (meta: MultisigWalletMeta) => {
      addMultisigWallet(meta);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (address: string) => {
      removeMultisigWallet(chainId, address);
      refresh();
    },
    [chainId, refresh]
  );

  return { wallets, add, remove, refresh, chainId };
}
