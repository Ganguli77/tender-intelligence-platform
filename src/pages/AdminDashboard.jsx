import { useEffect, useState } from "react";
import { getTenders } from "../api/tenders";

export default function AdminDashboard() {
  const [tenders, setTenders] = useState([]);

  useEffect(() => {
    getTenders()
      .then((data) => setTenders(data))
      .catch(() => setTenders([]));
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        background: "#020617",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#38bdf8" }}>
        Admin Dashboard
      </h2>

      {/* STATS */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Tenders</h3>
          <p style={{ fontSize: "22px" }}>{tenders.length}</p>
        </div>

        <div style={cardStyle}>
          <h3>Active</h3>
          <p style={{ fontSize: "22px" }}>
            {tenders.filter((t) => new Date(t.deadline) > new Date()).length}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Expired</h3>
          <p style={{ fontSize: "22px" }}>
            {tenders.filter((t) => new Date(t.deadline) < new Date()).length}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#0f172a",
          padding: "15px",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Manage Tenders</h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "white",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid gray" }}>
              <th>ID</th>
              <th>Title</th>
              <th>Org</th>
              <th>Deadline</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {tenders.map((t) => (
              <tr key={t.id} style={{ textAlign: "center" }}>
                <td>{t.id}</td>
                <td>{t.title}</td>
                <td>{t.organization}</td>
                <td>{t.deadline}</td>
                <td>{t.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#0f172a",
  padding: "15px",
  borderRadius: "10px",
  minWidth: "150px",
  flex: 1,
  textAlign: "center",
};
