import { http, createConfig } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// WalletConnect Cloud (https://cloud.reown.com/) で取得したProject IDを
// .env ファイルに VITE_WALLETCONNECT_PROJECT_ID として設定してください。
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

const polygonRpcUrl =
  import.meta.env.VITE_POLYGON_RPC_URL ?? "https://polygon-rpc.com";
const amoyRpcUrl =
  import.meta.env.VITE_POLYGON_AMOY_RPC_URL ?? "https://rpc-amoy.polygon.technology";

export const chains = [polygon, polygonAmoy] as const;

type AnyConnectorFn = ReturnType<typeof injected>;

const connectors: AnyConnectorFn[] = [
  // ブラウザ拡張のMetaMaskなど、window.ethereumへの直接接続
  injected({
    shimDisconnect: true,
  }),
];

if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "GENSO Wallet",
        description: "Polygon専用ウォレット GENSO Wallet",
        url: typeof window !== "undefined" ? window.location.origin : "https://genso.wallet",
        icons: ["/icons/icon.svg"],
      },
      showQrModal: true,
    }) as AnyConnectorFn
  );
}

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [polygon.id]: http(polygonRpcUrl),
    [polygonAmoy.id]: http(amoyRpcUrl),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
