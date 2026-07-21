import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAddress } from "viem";
import { useAccount, useChainId, useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import { GensoMultisigAbi, GensoMultisigBytecode } from "../contracts/GensoMultisig";
import { useMultisigWallets } from "../hooks/useMultisigWallets";
import { useToast } from "../components/ToastContext";
import { BackHeader } from "../components/BackHeader";

export function MultisigCreate() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { add } = useMultisigWallets();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(1);
  const [owners, setOwners] = useState<string[]>([""]);

  const {
    deployContract,
    data: txHash,
    isPending: isDeploying,
    error: deployError,
  } = useDeployContract();

  const {
    data: receipt,
    isLoading: isWaiting,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // 接続アドレスを最初の承認者として自動セット
  useEffect(() => {
    if (address && owners.length === 1 && owners[0] === "") {
      setOwners([address]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (receipt?.contractAddress) {
      add({
        address: receipt.contractAddress,
        name: name || "マルチシグウォレット",
        chainId,
        createdAt: Math.floor(Date.now() / 1000),
        deployTxHash: receipt.transactionHash,
      });
      showToast("マルチシグウォレットを作成しました");
      navigate(`/multisig/${receipt.contractAddress}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  useEffect(() => {
    if (deployError) {
      showToast("デプロイに失敗しました: " + deployError.message.slice(0, 80));
    }
  }, [deployError, showToast]);

  const updateOwner = (idx: number, value: string) => {
    const next = [...owners];
    next[idx] = value;
    setOwners(next);
  };

  const addOwnerField = () => setOwners([...owners, ""]);
  const removeOwnerField = (idx: number) => {
    if (owners.length <= 1) return;
    setOwners(owners.filter((_, i) => i !== idx));
  };

  const validOwners = owners.map((o) => o.trim()).filter((o) => o.length > 0);
  const allValidAddresses = validOwners.every((o) => isAddress(o));
  const uniqueOwners = new Set(validOwners.map((o) => o.toLowerCase())).size === validOwners.length;

  const canSubmit =
    isConnected &&
    name.trim().length > 0 &&
    validOwners.length > 0 &&
    allValidAddresses &&
    uniqueOwners &&
    threshold >= 1 &&
    threshold <= validOwners.length;

  const handleSubmit = () => {
    if (!canSubmit) return;
    deployContract({
      abi: GensoMultisigAbi,
      bytecode: GensoMultisigBytecode,
      args: [name.trim(), validOwners as `0x${string}`[], BigInt(threshold)],
    });
  };

  const busy = isDeploying || isWaiting;

  return (
    <>
      <BackHeader title="マルチシグウォレットを作成" />

      {!isConnected && (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13 }}>
            作成にはウォレットの接続が必要です。右上から接続してください。
          </p>
        </div>
      )}

      <div className="card">
        <div className="field">
          <label>ウォレット名</label>
          <input
            type="text"
            placeholder="例: GENSO Treasury"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>承認人数（Threshold）</label>
          <input
            type="number"
            min={1}
            max={Math.max(validOwners.length, 1)}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
          <span className="field-hint">
            {validOwners.length} 人中 {threshold} 人の承認で実行されます
          </span>
        </div>

        <div className="field">
          <label>承認者</label>
          {owners.map((owner, idx) => (
            <div className="owner-row" key={idx}>
              <input
                type="text"
                placeholder="0xで始まるウォレットアドレス"
                value={owner}
                onChange={(e) => updateOwner(idx, e.target.value)}
              />
              <button
                className="icon-btn"
                onClick={() => removeOwnerField(idx)}
                disabled={owners.length <= 1}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
          {!allValidAddresses && validOwners.length > 0 && (
            <span className="field-hint" style={{ color: "var(--color-danger)" }}>
              無効なアドレスが含まれています
            </span>
          )}
          {!uniqueOwners && (
            <span className="field-hint" style={{ color: "var(--color-danger)" }}>
              重複したアドレスがあります
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={addOwnerField} type="button" style={{ marginTop: 4 }}>
            + 承認者を追加
          </button>
        </div>
      </div>

      <button className="btn btn-primary" disabled={!canSubmit || busy} onClick={handleSubmit}>
        {busy ? "デプロイ中..." : "マルチシグコントラクトをデプロイ"}
      </button>
    </>
  );
}
