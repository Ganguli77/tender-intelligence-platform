const riskMeta = {
  low: { label: "Low", color: "#22c55e", background: "rgba(34, 197, 94, 0.14)" },
  medium: { label: "Medium", color: "#eab308", background: "rgba(234, 179, 8, 0.16)" },
  high: { label: "High", color: "#ef4444", background: "rgba(239, 68, 68, 0.16)" },
};

export default function RiskBadge({ level = "Low" }) {
  const meta = riskMeta[String(level).toLowerCase()] || riskMeta.low;

  return (
    <span
      className="risk-badge"
      style={{ "--risk-color": meta.color, "--risk-background": meta.background }}
    >
      {meta.label} Risk
    </span>
  );
}
