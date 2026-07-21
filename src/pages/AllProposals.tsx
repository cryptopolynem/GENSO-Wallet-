import type { Address } from "viem";
import { useMultisigWallets } from "../hooks/useMultisigWallets";
import { useMultisigInfo, useMultisigProposals } from "../hooks/useMultisig";
import { BackHeader } from "../components/BackHeader";
import { ProposalCard } from "../components/ProposalCard";

function WalletProposalSection({ address, name }: { address: Address; name: string }) {
  const { threshold, proposalCount } = useMultisigInfo(address);
  const { proposals } = useMultisigProposals(address, proposalCount);

  if (proposalCount === 0) return null;

  return (
    <div style={{ marginBottom: 18 }}>
      <h2 className="section-title">{name}</h2>
      {proposals.map((p) => (
        <ProposalCard key={p.id.toString()} proposal={p} walletAddress={address} threshold={threshold} />
      ))}
    </div>
  );
}

export function AllProposals() {
  const { wallets } = useMultisigWallets();

  return (
    <>
      <BackHeader title="Proposal一覧" />

      {wallets.length === 0 ? (
        <div className="card list-empty">
          <div className="empty-state-icon">📝</div>
          マルチシグウォレットを作成するとProposalが表示されます
        </div>
      ) : (
        wallets.map((w) => (
          <WalletProposalSection key={w.address} address={w.address} name={w.name} />
        ))
      )}
    </>
  );
}
