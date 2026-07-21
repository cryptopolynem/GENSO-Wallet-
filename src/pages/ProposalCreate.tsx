import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAddress, type Address } from "viem";
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { GensoMultisigAbi } from "../contracts/GensoMultisig";
import { useMultisigInfo } from "../hooks/useMultisig";
import { getTokens } from "../lib/tokens";
import { parseTokenAmount } from "../lib/format";
import { BackHeader } from "../components/BackHeader";
import { useToast } from "../components/ToastContext";
import type { ProposalType } from "../types";
import { PROPOSAL_TYPE_LABEL } from "../types";

const TRANSFER_TYPES: ProposalType[] = ["NativeTransfer", "ERC20Transfer"];
const GOVERNANCE_TYPES: ProposalType[] = ["AddOwner", "RemoveOwner", "ChangeThreshold"];

export function ProposalCreate() {
  const { address } = useParams<{ address: string }>();
  const walletAddress = address as Address;
  const navigate = useNavigate();
  const chainId = useChainId();
  const { showToast } = useToast();
  const { owners, threshold: currentThreshold } = useMultisigInfo(walletAddress);

  const [type, setType] = useState<ProposalType>("NativeTransfer");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState<"USDT" | "JPYC">("USDT");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [targetOwner, setTargetOwner] = useState("");
  const [newThreshold, setNewThreshold] = useState(1);

  const tokens = getTokens(chainId);
  const erc20Token = tokens.find((t) => t.symbol === tokenSymbol);

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      showToast("Proposalを作成しました");
      navigate(`/multisig/${walletAddress}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      showToast("Proposal作成に失敗しました: " + error.message.slice(0, 80));
    }
  }, [error, showToast]);

  const defaultTitle = () => {
    switch (type) {
      case "NativeTransfer":
        return `POL送金: ${amount || "0"} POL`;
      case "ERC20Transfer":
        return `${tokenSymbol}送金: ${amount || "0"} ${tokenSymbol}`;
      case "AddOwner":
        return "承認者の追加";
      case "RemoveOwner":
        return "承認者の削除";
      case "ChangeThreshold":
        return `Thresholdを${newThreshold}に変更`;
    }
  };

  const validate = (): boolean => {
    if (type === "NativeTransfer" || type === "ERC20Transfer") {
      if (!isAddress(to)) return false;
      if (!amount || Number(amount) <= 0) return false;
    }
    if (type === "AddOwner") {
      if (!isAddress(targetOwner)) return false;
      if (owners.some((o) => o.toLowerCase() === targetOwner.toLowerCase())) return false;
    }
    if (type === "RemoveOwner") {
      if (!targetOwner) return false;
      if (owners.length <= 1) return false;
    }
    if (type === "ChangeThreshold") {
      if (newThreshold < 1 || newThreshold > owners.length) return false;
    }
    return true;
  };

  const canSubmit = validate();

  const handleSubmit = () => {
    if (!canSubmit) return;
    const finalTitle = title.trim() || defaultTitle() || "Proposal";

    if (type === "NativeTransfer") {
      writeContract({
        address: walletAddress,
        abi: GensoMultisigAbi,
        functionName: "proposeNativeTransfer",
        args: [finalTitle, description, to as Address, parseTokenAmount(amount, 18)],
      });
    } else if (type === "ERC20Transfer" && erc20Token?.address) {
      writeContract({
        address: walletAddress,
        abi: GensoMultisigAbi,
        functionName: "proposeERC20Transfer",
        args: [
          finalTitle,
          description,
          erc20Token.address,
          to as Address,
          parseTokenAmount(amount, erc20Token.decimals),
        ],
      });
    } else if (type === "AddOwner") {
      writeContract({
        address: walletAddress,
        abi: GensoMultisigAbi,
        functionName: "proposeAddOwner",
        args: [finalTitle, description, targetOwner as Address],
      });
    } else if (type === "RemoveOwner") {
      writeContract({
        address: walletAddress,
        abi: GensoMultisigAbi,
        functionName: "proposeRemoveOwner",
        args: [finalTitle, description, targetOwner as Address],
      });
    } else if (type === "ChangeThreshold") {
      writeContract({
        address: walletAddress,
        abi: GensoMultisigAbi,
        functionName: "proposeChangeThreshold",
        args: [finalTitle, description, BigInt(newThreshold)],
      });
    }
  };

  const busy = isPending || isWaiting;

  return (
    <>
      <BackHeader title="Proposalを作成" />

      <div className="card">
        <div className="field">
          <label>種別</label>
          <div className="radio-group">
            {[...TRANSFER_TYPES, ...GOVERNANCE_TYPES].map((t) => (
              <div
                key={t}
                className={`radio-option ${type === t ? "active" : ""}`}
                onClick={() => setType(t)}
              >
                {PROPOSAL_TYPE_LABEL[t]}
              </div>
            ))}
          </div>
        </div>

        {type === "ERC20Transfer" && (
          <div className="field">
            <label>トークン</label>
            <div className="radio-group">
              {(["USDT", "JPYC"] as const).map((s) => (
                <div
                  key={s}
                  className={`radio-option ${tokenSymbol === s ? "active" : ""}`}
                  onClick={() => setTokenSymbol(s)}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {(type === "NativeTransfer" || type === "ERC20Transfer") && (
          <>
            <div className="field">
              <label>送金先アドレス</label>
              <input
                type="text"
                placeholder="0x..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="field">
              <label>送金額（{type === "NativeTransfer" ? "POL" : tokenSymbol}）</label>
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </>
        )}

        {(type === "AddOwner" || type === "RemoveOwner") && (
          <div className="field">
            <label>{type === "AddOwner" ? "追加する承認者アドレス" : "削除する承認者"}</label>
            {type === "RemoveOwner" ? (
              <select value={targetOwner} onChange={(e) => setTargetOwner(e.target.value)}>
                <option value="">選択してください</option>
                {owners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="0x..."
                value={targetOwner}
                onChange={(e) => setTargetOwner(e.target.value)}
              />
            )}
          </div>
        )}

        {type === "ChangeThreshold" && (
          <div className="field">
            <label>新しいThreshold（現在: {currentThreshold} / {owners.length}）</label>
            <input
              type="number"
              min={1}
              max={owners.length}
              value={newThreshold}
              onChange={(e) => setNewThreshold(Number(e.target.value))}
            />
          </div>
        )}

        <div className="field">
          <label>タイトル（任意）</label>
          <input
            type="text"
            placeholder={defaultTitle()}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>内容（任意）</label>
          <textarea
            rows={3}
            placeholder="Proposalの詳細を記入してください"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <button className="btn btn-primary" disabled={!canSubmit || busy} onClick={handleSubmit}>
        {busy ? "送信中..." : "Proposalを作成"}
      </button>
    </>
  );
}
