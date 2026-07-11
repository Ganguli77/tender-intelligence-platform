export default function Hero() {
  return (
    <div
      style={{
        background: "#2563eb",
        color: "white",
        padding: "50px",
        borderRadius: "12px",
        textAlign: "center",
        marginBottom: "30px",
      }}
    >
      <h1>AI Tender Intelligence Platform</h1>

      <p>
        Discover Government & Private Tenders with AI-powered insights.
      </p>

      <input
        type="text"
        placeholder="Search tenders..."
        style={{
          marginTop: "20px",
          width: "60%",
          padding: "12px",
          borderRadius: "8px",
          border: "none",
          fontSize: "16px",
        }}
      />
    </div>
  );
}