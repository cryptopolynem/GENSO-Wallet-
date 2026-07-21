# GENSO Wallet

Polygon専用ウォレット（Polygon Mainnet / Polygon Amoy Testnet）。
MetaMask（WalletConnect経由も含む）に接続して、POL / USDT / JPYC の残高確認と、
マルチシグウォレットの作成・Proposal（送金／承認者管理／Threshold変更）の
承認・自動実行ができます。

## 技術構成

- React 19 + TypeScript + Vite
- wagmi v3 / viem v2
- WalletConnect（MetaMask含む各種ウォレット接続）
- vite-plugin-pwa（PWA対応）
- react-router-dom（画面遷移）
- Solidity（`contracts/GensoMultisig.sol`）によるマルチシグスマートコントラクト

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` を編集し、[WalletConnect Cloud (Reown)](https://cloud.reown.com/) で発行した
`VITE_WALLETCONNECT_PROJECT_ID` を設定してください（未設定でもMetaMaskのブラウザ拡張接続は動作します）。

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## ビルド

```bash
npm run build
npm run preview
```

`npm run build` で `dist/` にPWA対応の静的ファイル一式（Service Worker含む）が出力されます。

## 主な機能

- 画面右上のセレクタで **Polygon Mainnet / Polygon Amoy Testnet** を切替
  - 切替時、接続中のMetaMaskにも `wallet_switchEthereumChain` でネットワーク変更をリクエスト
- ホーム画面: 接続アドレス、POL / USDT / JPYC 残高表示
- マルチシグウォレット作成: ウォレット名・Threshold・承認者アドレスを指定して
  `GensoMultisig` コントラクトを実際にデプロイ
- Proposal（POL送金・USDT送金・JPYC送金・承認者追加・承認者削除・Threshold変更）の
  作成、一覧表示、承認／却下
- Threshold人数分の承認が揃うと、コントラクト側で **自動実行**（`vote`関数内で実行）

## マルチシグコントラクトについて

`contracts/GensoMultisig.sol` が本体のSolidityソースです。
`scripts/compile.cjs` で solc コンパイルし、ABI・バイトコードを
`src/contracts/GensoMultisig.ts` に自動生成しています。
コントラクトを修正した場合は以下で再生成してください。

```bash
node scripts/compile.cjs
```

## トークンアドレスについて

`src/lib/tokens.ts` にPolygon Mainnet / Amoyのトークンアドレスを定義しています。

- Polygon Mainnet: USDT・JPYCとも実在のコントラクトアドレスを設定済みです。
- Polygon Amoy Testnet: USDT・JPYCの公式デプロイが存在しないため、
  ダミーアドレスを仮設定しています。テストネットで動作確認する場合は、
  `src/lib/tokens.ts` 内の `TESTNET_USDT_ADDRESS` / `TESTNET_JPYC_ADDRESS` を
  実際にAmoyへデプロイしたテスト用ERC20トークンのアドレスに書き換えてください。

## マルチシグウォレットの管理データについて

デプロイ済みマルチシグウォレットのアドレス一覧は、簡易的にブラウザの
`localStorage`（チェーンIDごと）に保存しています（`src/lib/storage.ts`）。
Proposalそのものはすべてスマートコントラクト上のデータを直接読み取っています。
