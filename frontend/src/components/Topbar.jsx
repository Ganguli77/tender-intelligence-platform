export default function Topbar() {
  return (
    <div
      style={{
        height: "70px",
        background: "var(--surface)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,.18)",
        border: "1px solid var(--border)",
        marginBottom: "30px",
      }}
    >
      {/* Left */}
      <div>
        <h2 style={{ margin: 0 }}>AI Tender Intelligence Platform</h2>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Government & Private Tenders
        </p>
      </div>

      {/* Right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Search tenders..."
          style={{
            padding: "10px 15px",
            width: "280px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            outline: "none",
            color: "var(--text)",
            background: "var(--surface-2)",
          }}
        />

        <span style={{ fontSize: "24px", cursor: "pointer" }}>🔔</span>

        <img
          src="https://ui-avatars.com/api/?name=Admin"
          alt="profile"
          style={{
            width: "45px",
            height: "45px",
            borderRadius: "50%",
          }}
        />
      </div>
    </div>
  );
}
