import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#18c9cc", "#2c9fe3", "#8057e8"];

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-tooltip">
      <strong>{label}</strong>
      <span>{payload[0].payload.count} analyses ({payload[0].value}%)</span>
    </div>
  );
}

export default function OpportunityBarChart({ data }) {
  const total = (data || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
  const chartData = (data || []).map((item) => ({
    label: item.label === "High" ? "High (80-100)" : item.label === "Medium" ? "Medium (60-79)" : "Low (<60)",
    count: Number(item.count || 0),
    percent: total ? Math.round((Number(item.count || 0) / total) * 100) : 0,
  }));

  return (
    <section className="dashboard-glass-card dashboard-chart-card">
      <div className="dashboard-card-head">
        <div>
          <h2>Opportunity Score Distribution</h2>
        </div>
        <button type="button" aria-label="Opportunity score options">...</button>
      </div>

      <div className="dashboard-opportunity-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#c7d2e2" tick={{ fontSize: 8 }} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} stroke="#c7d2e2" tick={{ fontSize: 8 }} />
            <Tooltip content={<TooltipContent />} />
            <Bar dataKey="percent" radius={[5, 5, 0, 0]} barSize={30} background={{ fill: "rgba(30,41,59,.62)", radius: 4 }}>
              {chartData.map((entry, index) => (
                <Cell key={entry.label} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
