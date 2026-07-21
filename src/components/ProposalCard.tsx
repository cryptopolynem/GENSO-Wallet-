import { Link } from "react-router-dom";
import type { Address } from "viem";
import type { ProposalView } from "../types";
import { PROPOSAL_STATUS_LABEL, PROPOSAL_TYPE_LABEL } from "../types";
import { formatDateTime, shortenAddress } from "../lib/format";

const STATUS_CLASS: Record<ProposalView["status"], string> = {
  Pending: "badge-pending",
  Executed: "badge-executed",
  Rejected: "badge-rejected",
};

export function ProposalCard({
  proposal,
  walletAddress,
  threshold,
}: {
  proposal: ProposalView;
  walletAddress: Address;
  threshold: number;
}) {
  const progress = threshold > 0 ? Math.min(100, (proposal.approvalCount / threshold) * 100) : 0;

  return (
    <Link to={`/multisig/${walletAddress}/proposal/${proposal.id.toString()}`} className="proposal-card">
      <div className="proposal-top">
        <span className="proposal-title">{proposal.title || PROPOSAL_TYPE_LABEL[proposal.proposalType]}</span>
        <span className={`badge ${STATUS_CLASS[proposal.status]}`}>
          {PROPOSAL_STATUS_LABEL[proposal.status]}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
        {PROPOSAL_TYPE_LABEL[proposal.proposalType]}
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="proposal-meta">
        <span>承認 {proposal.approvalCount}/{threshold}</span>
        <span>作成者 {shortenAddress(proposal.proposer)}</span>
        <span>{formatDateTime(proposal.createdAt)}</span>
      </div>
    </Link>
  );
}
