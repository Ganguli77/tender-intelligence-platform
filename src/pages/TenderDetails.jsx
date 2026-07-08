import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTender } from "../api/tenders";

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tender, setTender] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getTender(id)
      .then((data) => {
        if (mounted) {
          setError("");
          setTender(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Unable to load tender details.");
          setTender(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!tender) {
    return (
      <div style={{ padding: 30, color: "white", background: "#020617", minHeight: "100vh" }}>
        <p>{error || "Loading tender details..."}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        {"<-"} Back
      </button>

      <div style={styles.card}>
        <h1 style={{ color: "#38bdf8" }}>{tender.title}</h1>

        <p><b>Organization:</b> {tender.organization}</p>

        <p><b>Amount:</b> {tender.amount}</p>

        <p>
          <b>Deadline:</b>{" "}
          <span
            style={{
              color:
                new Date(tender.deadline) > new Date()
                  ? "#22c55e"
                  : "#ef4444",
            }}
          >
            {tender.deadline}
          </span>
        </p>

        <hr style={{ margin: "15px 0", opacity: 0.2 }} />

        <p>
          <b>Description:</b>
        </p>

        <p style={{ color: "gray" }}>
          {tender.description || "No description available"}
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    minHeight: "100vh",
    background: "#020617",
    color: "white",
  },

  backBtn: {
    marginBottom: "20px",
    padding: "8px 12px",
    cursor: "pointer",
  },

  card: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "10px",
  },
};
