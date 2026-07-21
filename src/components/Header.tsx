import { Link } from "react-router-dom";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { ConnectButton } from "./ConnectButton";

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <div className="brand-mark">幻</div>
        <div>
          <div className="brand-title">GENSO Wallet</div>
          <div className="brand-sub">POLYGON ONLY</div>
        </div>
      </Link>
      <div className="header-controls">
        <NetworkSwitcher />
        <ConnectButton />
      </div>
    </header>
  );
}
