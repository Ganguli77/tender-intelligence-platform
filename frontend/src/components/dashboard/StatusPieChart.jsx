import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#6d4cff", "#f59e0b", "#fb4d5d"];

function TooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dashboard-tooltip">
      <strong>{payload[0].name}</strong>
      <span>{payload[0].value} tenders</span>
    </div>
  );
}

export default function StatusPieChart({ status }) {
  const total = Number(status?.active || 0) + Number(status?.closingSoon || 0) + Number(status?.expired || 0);
  const data = [
    { name: "Active", value: Number(status?.active || 0) },
    { name: "Closing Soon", value: Number(status?.closingSoon || 0) },
    { name: "Expired", value: Number(status?.expired || 0) },
  ];

  return (
    <section className="dashboard-glass-card dashboard-chart-card">
      <div className="dashboard-card-head">
        <div>
          <h2>Tender Status Distribution</h2>
        </div>
        <button type="button" aria-label="Tender status options">...</button>
      </div>

      <div className="dashboard-status-chart">
        <div className="dashboard-donut-wrap">
          <div className="dashboard-donut-center">
            <strong>{status?.activePercentage || 0}%</strong>
            <span>Active</span>
          </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-legend">
          {data.map((item, index) => (
            <div key={item.name}>
              <i style={{ background: colors[index] }} />
              <span>{item.name}</span>
              <strong>{item.value.toLocaleString("en-IN")} ({total ? Math.round((item.value / total) * 100) : 0}%)</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
