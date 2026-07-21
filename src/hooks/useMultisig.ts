import { useMemo } from "react";
import type { Address } from "viem";
import { useChainId, useReadContract, useReadContracts } from "wagmi";
import { GensoMultisigAbi } from "../contracts/GensoMultisig";
import type { ProposalStatus, ProposalType, ProposalView } from "../types";

const PROPOSAL_TYPE_MAP: ProposalType[] = [
  "NativeTransfer",
  "ERC20Transfer",
  "AddOwner",
  "RemoveOwner",
  "ChangeThreshold",
];

const PROPOSAL_STATUS_MAP: ProposalStatus[] = ["Pending", "Executed", "Rejected"];

/** マルチシグウォレットの基本情報（名前・オーナー一覧・Threshold）を取得する */
export function useMultisigInfo(address: Address | undefined) {
  const chainId = useChainId();

  const result = useReadContracts({
    contracts: [
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "walletName",
        chainId,
      },
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "getOwners",
        chainId,
      },
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "threshold",
        chainId,
      },
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "proposalCount",
        chainId,
      },
    ],
    query: { enabled: !!address },
  });

  const [nameRes, ownersRes, thresholdRes, countRes] = result.data ?? [];

  return {
    name: (nameRes?.result as string | undefined) ?? "",
    owners: (ownersRes?.result as Address[] | undefined) ?? [],
    threshold: thresholdRes?.result !== undefined ? Number(thresholdRes.result) : 0,
    proposalCount: countRes?.result !== undefined ? Number(countRes.result) : 0,
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}

interface RawProposal {
  id: bigint;
  proposalType: number;
  proposer: Address;
  target: Address;
  token: Address;
  amount: bigint;
  title: string;
  description: string;
  createdAt: bigint;
  status: number;
  approvalCount: bigint;
  rejectionCount: bigint;
}

function toProposalView(raw: RawProposal): ProposalView {
  return {
    id: raw.id,
    proposalType: PROPOSAL_TYPE_MAP[raw.proposalType],
    proposer: raw.proposer,
    target: raw.target,
    token: raw.token,
    amount: raw.amount,
    title: raw.title,
    description: raw.description,
    createdAt: Number(raw.createdAt),
    status: PROPOSAL_STATUS_MAP[raw.status],
    approvalCount: Number(raw.approvalCount),
    rejectionCount: Number(raw.rejectionCount),
  };
}

/** マルチシグウォレットに紐づく全Proposalを取得する（新しい順） */
export function useMultisigProposals(address: Address | undefined, proposalCount: number) {
  const chainId = useChainId();

  const ids = useMemo(
    () => Array.from({ length: proposalCount }, (_, i) => proposalCount - 1 - i),
    [proposalCount]
  );

  const result = useReadContracts({
    contracts: ids.map((id) => ({
      address,
      abi: GensoMultisigAbi,
      functionName: "getProposal" as const,
      args: [BigInt(id)] as const,
      chainId,
    })),
    query: { enabled: !!address && proposalCount > 0 },
  });

  const proposals: ProposalView[] = (result.data ?? [])
    .map((r) => (r.status === "success" ? toProposalView(r.result as unknown as RawProposal) : null))
    .filter((p): p is ProposalView => p !== null);

  return { proposals, isLoading: result.isLoading, refetch: result.refetch };
}

/** 単一Proposalを取得する */
export function useMultisigProposal(address: Address | undefined, id: bigint | undefined) {
  const chainId = useChainId();

  const result = useReadContract({
    address,
    abi: GensoMultisigAbi,
    functionName: "getProposal",
    args: id !== undefined ? [id] : undefined,
    chainId,
    query: { enabled: !!address && id !== undefined },
  });

  const proposal = result.data ? toProposalView(result.data as unknown as RawProposal) : undefined;

  return { proposal, isLoading: result.isLoading, refetch: result.refetch };
}

/** 現在アドレスがオーナーかどうか、既に投票済みかどうかを取得する */
export function useVoterStatus(
  address: Address | undefined,
  proposalId: bigint | undefined,
  voter: Address | undefined
) {
  const chainId = useChainId();

  const result = useReadContracts({
    contracts: [
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "isOwner",
        args: voter ? [voter] : undefined,
        chainId,
      },
      {
        address,
        abi: GensoMultisigAbi,
        functionName: "hasVoted",
        args: voter && proposalId !== undefined ? [proposalId, voter] : undefined,
        chainId,
      },
    ],
    query: { enabled: !!address && !!voter && proposalId !== undefined },
  });

  const [isOwnerRes, hasVotedRes] = result.data ?? [];

  return {
    isOwner: Boolean(isOwnerRes?.result),
    hasVoted: Boolean(hasVotedRes?.result),
    refetch: result.refetch,
  };
}
