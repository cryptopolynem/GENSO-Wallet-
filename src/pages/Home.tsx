import { Link } from "react-router-dom";
import { useAccount, useChainId } from "wagmi";
import { polygon } from "wagmi/chains";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useMultisigWallets } from "../hooks/useMultisigWallets";
import { formatTokenAmount, shortenAddress } from "../lib/format";
import { useToast } from "../components/ToastContext";

export function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const balances = useTokenBalances(address);
  const { wallets } = useMultisigWallets();
  const { showToast } = useToast();

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    showToast("アドレスをコピーしました");
  };

  return (
    <>
      <div className="balance-hero">
        <span className="field-hint" style={{ marginBottom: 4 }}>
          {chainId === polygon.id ? "Polygon Mainnet" : "Polygon Amoy Testnet"}
        </span>
        {isConnected && address ? (
          <>
            <div className="balance-address" onClick={copyAddress}>
              {shortenAddress(address)}
              <span style={{ fontSize: 10 }}>コピー</span>
            </div>
          </>
        ) : (
          <div className="balance-address" style={{ cursor: "default" }}>
            未接続
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="card" style={{ textAlign: "center" }}>
          <div className="empty-state-icon">🔒</div>
          <p style={{ margin: "0 0 4px", fontWeight: 700 }}>ウォレット未接続</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            右上の「ウォレット接続」からMetaMaskを接続してください
          </p>
        </div>
      )}

      <div>
        <h2 className="section-title">資産</h2>
        <div className="token-list">
          {balances.map((b) => (
            <div className="token-row" key={b.symbol}>
              <div className="token-left">
                <div className="token-badge" style={{ background: b.color }}>
                  {b.symbol.slice(0, 3)}
                </div>
                <div>
                  <div>{b.symbol}</div>
                  <div className="token-name">{b.name}</div>
                </div>
              </div>
              <div className="token-amount">
                {isConnected
                  ? b.isLoading
                    ? "..."
                    : formatTokenAmount(b.value, b.decimals)
                  : "--"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h2 className="section-title" style={{ margin: 0 }}>
            マルチシグウォレット
          </h2>
          <Link to="/multisig/proposals">
            <span style={{ fontSize: 12, color: "var(--color-primary)" }}>Proposal一覧 →</span>
          </Link>
        </div>

        {wallets.length === 0 ? (
          <div className="card list-empty">
            <div className="empty-state-icon">🪄</div>
            まだマルチシグウォレットがありません
          </div>
        ) : (
          wallets.map((w) => (
            <Link to={`/multisig/${w.address}`} key={w.address} className="wallet-card">
              <div className="wallet-card-top">
                <span className="wallet-card-name">{w.name}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-faint)" }}>詳細 →</span>
              </div>
              <div className="wallet-card-addr">{w.address}</div>
            </Link>
          ))
        )}

        <Link to="/multisig/create">
          <button className="btn btn-primary" style={{ marginTop: 10 }}>
            + マルチシグウォレットを作成
          </button>
        </Link>
      </div>
    </>
  );
}
