import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { useToast } from "./ToastContext";

const NETWORKS = [
  { id: polygon.id, label: "Polygon Mainnet" },
  { id: polygonAmoy.id, label: "Polygon Amoy" },
];

/**
 * 画面右上に表示するネットワーク切替セレクタ。
 * 選択すると wagmi の switchChain を通じて MetaMask 側にも
 * ネットワーク切替（chainId変更、必要であればネットワーク追加）を要求する。
 */
export function NetworkSwitcher() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = Number(e.target.value);
    if (nextId === chainId) return;

    if (!isConnected) {
      showToast("先にMetaMaskを接続してください");
      return;
    }

    switchChain(
      { chainId: nextId as typeof polygon.id | typeof polygonAmoy.id },
      {
        onError: () => {
          showToast("ネットワークの切り替えに失敗しました");
        },
      }
    );
  };

  return (
    <div className="pill-select">
      <select value={chainId} onChange={handleChange} disabled={isPending}>
        {NETWORKS.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>
    </div>
  );
}
