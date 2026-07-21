import type { Address } from "viem";

/** GENSO Wallet が対応するトークンの識別子 */
export type TokenSymbol = "POL" | "USDT" | "JPYC";

/** トークン定義（ネイティブトークンは address = null） */
export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  /** ネイティブトークン(POL)の場合は null */
  address: Address | null;
  color: string;
}

/** チェーンごとのトークンアドレス設定 */
export type TokenConfigMap = Record<number, TokenConfig[]>;

/** Proposal の種別 */
export type ProposalType =
  | "NativeTransfer"
  | "ERC20Transfer"
  | "AddOwner"
  | "RemoveOwner"
  | "ChangeThreshold";

/** Proposal の状態 */
export type ProposalStatus = "Pending" | "Executed" | "Rejected";

/** UI表示用の Proposal 型（コントラクトの構造体を整形したもの） */
export interface ProposalView {
  id: bigint;
  proposalType: ProposalType;
  proposer: Address;
  target: Address;
  token: Address;
  amount: bigint;
  title: string;
  description: string;
  createdAt: number;
  status: ProposalStatus;
  approvalCount: number;
  rejectionCount: number;
}

/** ローカルに保存するマルチシグウォレットのメタ情報 */
export interface MultisigWalletMeta {
  address: Address;
  name: string;
  chainId: number;
  createdAt: number;
  deployTxHash: string;
}

export const PROPOSAL_TYPE_LABEL: Record<ProposalType, string> = {
  NativeTransfer: "POL送金",
  ERC20Transfer: "トークン送金",
  AddOwner: "承認者追加",
  RemoveOwner: "承認者削除",
  ChangeThreshold: "Threshold変更",
};

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  Pending: "承認待ち",
  Executed: "実行済み",
  Rejected: "却下",
};
