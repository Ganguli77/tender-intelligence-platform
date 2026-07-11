import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#45c95a", "#f59e0b", "#ef4444"];

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-tooltip">
      <strong>{label}</strong>
      <span>{payload[0].value} analyses</span>
    </div>
  );
}

export default function OpportunityBarChart({ data }) {
  const total = (data || []).reduce((sum, item) => sum + Number(item.count || 0), 0);
  const chartData = (data || []).map((item) => ({
    label: `${item.label} (${item.range})`,
    count: Number(item.count || 0),
    percent: total ? Math.round((Number(item.count || 0) / total) * 100) : 0,
  }));

  return (
    <section className="dashboard-glass-card dashboard-chart-card">
      <div className="dashboard-card-head">
        <div>
          <h2>AI Opportunity Score Distribution</h2>
        </div>
        <button type="button" aria-label="Opportunity score options">...</button>
      </div>

      <ResponsiveContainer width="100%" height={304}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 48, bottom: 12, left: 86 }}>
          <XAxis type="number" stroke="#9fb0ca" tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="label" stroke="#dbe3f2" tickLine={false} axisLine={false} width={108} />
          <Tooltip content={<TooltipContent />} />
          <Bar dataKey="count" radius={[4, 4, 4, 4]} barSize={18} background={{ fill: "rgba(30,41,59,.62)", radius: 4 }}>
            {chartData.map((entry, index) => (
              <Cell key={entry.label} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="dashboard-opportunity-values">
        {chartData.map((item) => (
          <span key={item.label}>{item.count.toLocaleString("en-IN")} ({item.percent}%)</span>
        ))}
      </div>
    </section>
  );
}
