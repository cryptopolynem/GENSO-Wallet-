import { Link, useParams } from "react-router-dom";
import type { Address } from "viem";
import { useMultisigInfo, useMultisigProposals } from "../hooks/useMultisig";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { formatTokenAmount, shortenAddress } from "../lib/format";
import { BackHeader } from "../components/BackHeader";
import { ProposalCard } from "../components/ProposalCard";

export function MultisigDetail() {
  const { address } = useParams<{ address: string }>();
  const walletAddress = address as Address | undefined;

  const { name, owners, threshold, proposalCount, isLoading } = useMultisigInfo(walletAddress);
  const { proposals } = useMultisigProposals(walletAddress, proposalCount);
  const balances = useTokenBalances(walletAddress);

  if (!walletAddress) return null;

  return (
    <>
      <BackHeader title={isLoading ? "読み込み中..." : name || "マルチシグウォレット"} />

      <div className="card card-tight">
        <div className="balance-address" style={{ marginBottom: 10 }}>
          {shortenAddress(walletAddress)}
        </div>
        <div className="stat-grid">
          <div className="stat-box">
            <div className="label">Threshold</div>
            <div className="value">
              {threshold} / {owners.length}
            </div>
          </div>
          <div className="stat-box">
            <div className="label">Proposal数</div>
            <div className="value">{proposalCount}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">資産</h2>
        <div className="token-list">
          {balances.map((b) => (
            <div className="token-row" key={b.symbol}>
              <div className="token-left">
                <div className="token-badge" style={{ background: b.color }}>
                  {b.symbol.slice(0, 3)}
                </div>
                <div>{b.symbol}</div>
              </div>
              <div className="token-amount">
                {b.isLoading ? "..." : formatTokenAmount(b.value, b.decimals)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">承認者（{owners.length}人）</h2>
        <div>
          {owners.map((o) => (
            <span className="owner-chip" key={o}>
              {shortenAddress(o)}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h2 className="section-title" style={{ margin: 0 }}>
            Proposal
          </h2>
          <Link to={`/multisig/${walletAddress}/propose`}>
            <span style={{ fontSize: 12, color: "var(--color-primary)" }}>+ 新規作成</span>
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="card list-empty">
            <div className="empty-state-icon">📝</div>
            まだProposalがありません
          </div>
        ) : (
          proposals.map((p) => (
            <ProposalCard key={p.id.toString()} proposal={p} walletAddress={walletAddress} threshold={threshold} />
          ))
        )}
      </div>

      <Link to={`/multisig/${walletAddress}/propose`}>
        <button className="btn btn-primary">+ Proposalを作成</button>
      </Link>
    </>
  );
}
