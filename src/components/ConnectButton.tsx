import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "../lib/format";
import { useToast } from "./ToastContext";

export function ConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isConnected && address) {
    return (
      <div style={{ position: "relative" }}>
        <button className="connect-btn" onClick={() => setMenuOpen((v) => !v)}>
          <span className="dot" />
          {shortenAddress(address)}
        </button>
        {menuOpen && (
          <div
            className="card card-tight"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              zIndex: 20,
              width: 160,
            }}
          >
            <button
              className="btn btn-danger btn-sm"
              style={{ width: "100%" }}
              onClick={() => {
                disconnect();
                setMenuOpen(false);
              }}
            >
              切断する
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        className="connect-btn"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={isConnecting || isPending}
      >
        {isConnecting || isPending ? "接続中..." : "ウォレット接続"}
      </button>
      {menuOpen && (
        <div
          className="card card-tight"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            zIndex: 20,
            width: 220,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {connectors.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
              利用可能な接続方法がありません
            </p>
          )}
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              className="btn btn-secondary btn-sm"
              style={{ width: "100%", justifyContent: "flex-start" }}
              onClick={() => {
                connect(
                  { connector },
                  {
                    onError: (err) => {
                      showToast(
                        err.message.includes("not found") || err.message.includes("No provider")
                          ? "MetaMaskが見つかりません。拡張機能をインストールしてください"
                          : "接続に失敗しました"
                      );
                    },
                  }
                );
                setMenuOpen(false);
              }}
            >
              {connector.name === "Injected" ? "MetaMask（ブラウザ拡張）" : connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
