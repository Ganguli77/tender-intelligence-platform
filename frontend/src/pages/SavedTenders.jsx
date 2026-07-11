import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkCheck, Trash2 } from "lucide-react";
import { getSavedTenders, removeSavedTender } from "../api/tenders";
import { removeSavedTender as removeLocalSavedTender } from "../utils/savedTenders";
import "./TenderPages.css";

export default function SavedTenders() {
  const [savedTenders, setSavedTenders] = useState([]);
  const [status, setStatus] = useState("Loading saved tenders...");

  const loadSavedTenders = async () => {
    try {
      const data = await getSavedTenders();
      setSavedTenders(data);
      setStatus(data.length ? "" : "No saved tenders yet.");
    } catch {
      setStatus("Unable to load saved tenders.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSavedTenders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRemove = async (tenderId) => {
    const previousSavedTenders = savedTenders;
    setSavedTenders((current) => current.filter((item) => String(item.tender.id) !== String(tenderId)));
    setStatus("");

    try {
      await removeSavedTender(tenderId);
      removeLocalSavedTender(tenderId);
      loadSavedTenders();
    } catch {
      setSavedTenders(previousSavedTenders);
      setStatus("Unable to remove saved tender.");
    }
  };

  return (
    <main className="tender-page">
      <section className="tender-hero">
        <span className="tender-eyebrow">Saved workspace</span>
        <h1>Saved Tenders</h1>
        <p>Your bookmarked opportunities are kept here for fast bid review, compliance checks, and follow-up planning.</p>
      </section>

      {status && <p className="phase6-status">{status}</p>}

      <section className="phase6-card-grid">
        {savedTenders.map((item) => (
          <article className="phase6-tender-card" key={item.id}>
            <BookmarkCheck size={22} />
            <span>{item.tender.category}</span>
            <h2>{item.tender.title}</h2>
            <p>{item.tender.organization}</p>
            <small>Saved {item.savedAt ? new Date(item.savedAt).toLocaleDateString("en-IN") : "recently"}</small>
            <div>
              <Link to={`/tenders/${item.tender.id}`}>View Tender</Link>
              <button type="button" aria-label="Remove saved tender" onClick={() => handleRemove(item.tender.id)}>
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
