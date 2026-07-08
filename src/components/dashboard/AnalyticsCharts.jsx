import { memo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AnalyticsCharts = memo(function AnalyticsCharts({
  stateData = [],
  categoryData = [],
  trendData = [],
  statusData = [],
  budgetData = [],
}) {
  return (
    <div className="analytics-grid">
      <article className="analytics-card">
        <div className="analytics-card-head">
          <div>
            <p className="analytics-label">Tender by state</p>
            <h3>Geographic momentum</h3>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={stateData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="analytics-card">
        <div className="analytics-card-head">
          <div>
            <p className="analytics-label">Tender by category</p>
            <h3>Demand mix</h3>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={categoryData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="analytics-card">
        <div className="analytics-card-head">
          <div>
            <p className="analytics-label">Monthly trend</p>
            <h3>Pipeline health</h3>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#areaFill)" strokeWidth={2.4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="analytics-card">
        <div className="analytics-card-head">
          <div>
            <p className="analytics-label">Open vs closed</p>
            <h3>Operational velocity</h3>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={3}>
                {statusData.map((entry, index) => (
                  <Cell key={entry.name} fill={index === 0 ? "#22d3ee" : "#2563eb"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="analytics-card analytics-card-wide">
        <div className="analytics-card-head">
          <div>
            <p className="analytics-label">Budget distribution</p>
            <h3>Value concentration</h3>
          </div>
        </div>
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={budgetData}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#818cf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
});

export default AnalyticsCharts;
