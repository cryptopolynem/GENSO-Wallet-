import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

export function BackHeader({ title, action }: { title: string; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div
      className="top-nav-back"
      style={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          ←
        </button>
        <span className="page-title">{title}</span>
      </div>
      {action}
    </div>
  );
}
