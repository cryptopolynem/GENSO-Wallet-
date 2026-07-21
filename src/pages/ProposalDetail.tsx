import { useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Address } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { GensoMultisigAbi } from "../contracts/GensoMultisig";
import { useMultisigInfo, useMultisigProposal, useVoterStatus } from "../hooks/useMultisig";
import { formatDateTime, formatTokenAmount, shortenAddress } from "../lib/format";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_TYPE_LABEL } from "../types";
import { BackHeader } from "../components/BackHeader";
import { useToast } from "../components/ToastContext";
import { getTokens } from "../lib/tokens";
import { useChainId } from "wagmi";

const STATUS_CLASS: Record<string, string> = {
  Pending: "badge-pending",
  Executed: "badge-executed",
  Rejected: "badge-rejected",
};

export function ProposalDetail() {
  const { address, id } = useParams<{ address: string; id: string }>();
  const walletAddress = address as Address;
  const proposalId = id !== undefined ? BigInt(id) : undefined;
  const chainId = useChainId();
  const { showToast } = useToast();
  const { address: account } = useAccount();

  const { threshold, owners, refetch: refetchInfo } = useMultisigInfo(walletAddress);
  const { proposal, isLoading, refetch } = useMultisigProposal(walletAddress, proposalId);
  const { isOwner, hasVoted, refetch: refetchVoter } = useVoterStatus(
    walletAddress,
    proposalId,
    account
  );

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      showToast("投票を送信しました");
      refetch();
      refetchVoter();
      refetchInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      showToast("投票に失敗しました: " + error.message.slice(0, 80));
    }
  }, [error, showToast]);

  if (isLoading || !proposal) {
    return (
      <>
        <BackHeader title="Proposal詳細" />
        <div className="card list-empty">読み込み中...</div>
      </>
    );
  }

  const vote = (approve: boolean) => {
    if (proposalId === undefined) return;
    writeContract({
      address: walletAddress,
      abi: GensoMultisigAbi,
      functionName: "vote",
      args: [proposalId, approve],
    });
  };

  const tokens = getTokens(chainId);
  const tokenMeta = tokens.find(
    (t) => t.address?.toLowerCase() === proposal.token.toLowerCase()
  );

  const amountLabel = () => {
    if (proposal.proposalType === "NativeTransfer") {
      return `${formatTokenAmount(proposal.amount, 18)} POL`;
    }
    if (proposal.proposalType === "ERC20Transfer" && tokenMeta) {
      return `${formatTokenAmount(proposal.amount, tokenMeta.decimals)} ${tokenMeta.symbol}`;
    }
    if (proposal.proposalType === "ChangeThreshold") {
      return `${proposal.amount.toString()}`;
    }
    return null;
  };

  const busy = isPending || isWaiting;
  const progress = threshold > 0 ? Math.min(100, (proposal.approvalCount / threshold) * 100) : 0;
  const canVote = proposal.status === "Pending" && isOwner && !hasVoted;

  return (
    <>
      <BackHeader title="Proposal詳細" />

      <div className="card">
        <div className="proposal-top">
          <span className="page-title" style={{ fontSize: 16 }}>
            {proposal.title || PROPOSAL_TYPE_LABEL[proposal.proposalType]}
          </span>
          <span className={`badge ${STATUS_CLASS[proposal.status]}`}>
            {PROPOSAL_STATUS_LABEL[proposal.status]}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4 }}>
          {PROPOSAL_TYPE_LABEL[proposal.proposalType]}
        </div>

        {proposal.description && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 12 }}>{proposal.description}</p>
        )}

        <hr className="divider" />

        <div className="stat-grid">
          <div className="stat-box">
            <div className="label">作成者</div>
            <div className="value" style={{ fontSize: 12.5 }}>
              {shortenAddress(proposal.proposer)}
            </div>
          </div>
          <div className="stat-box">
            <div className="label">作成日時</div>
            <div className="value" style={{ fontSize: 12.5 }}>
              {formatDateTime(proposal.createdAt)}
            </div>
          </div>
          {amountLabel() && (
            <div className="stat-box">
              <div className="label">
                {proposal.proposalType === "ChangeThreshold" ? "新Threshold" : "金額"}
              </div>
              <div className="value">{amountLabel()}</div>
            </div>
          )}
          {(proposal.proposalType === "AddOwner" || proposal.proposalType === "RemoveOwner") && (
            <div className="stat-box">
              <div className="label">対象アドレス</div>
              <div className="value" style={{ fontSize: 12.5 }}>
                {shortenAddress(proposal.target)}
              </div>
            </div>
          )}
        </div>

        <hr className="divider" />

        <div className="section-title" style={{ marginBottom: 8 }}>
          承認状況（{proposal.approvalCount} / {threshold}）
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="proposal-meta">
          <span>承認 {proposal.approvalCount}</span>
          <span>却下 {proposal.rejectionCount}</span>
          <span>承認者 {owners.length}人</span>
        </div>
      </div>

      {proposal.status === "Pending" && (
        <div className="card">
          {!isOwner && (
            <p style={{ fontSize: 12.5, color: "var(--color-text-faint)", margin: 0 }}>
              このマルチシグの承認者のみが投票できます
            </p>
          )}
          {isOwner && hasVoted && (
            <p style={{ fontSize: 12.5, color: "var(--color-text-faint)", margin: 0 }}>
              あなたは既にこのProposalに投票済みです
            </p>
          )}
          {canVote && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                disabled={busy}
                onClick={() => vote(true)}
              >
                承認する
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={() => vote(false)}>
                却下する
              </button>
            </div>
          )}
          <p style={{ fontSize: 11.5, color: "var(--color-text-faint)", marginTop: 10, marginBottom: 0 }}>
            必要人数（{threshold}人）の承認が揃うと自動的に実行されます
          </p>
        </div>
      )}
    </>
  );
}
