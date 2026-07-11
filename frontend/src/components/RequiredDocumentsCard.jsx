import { useMemo, useState } from "react";
import { FileCheck2 } from "lucide-react";

export default function RequiredDocumentsCard({ documents = [] }) {
  const normalizedDocuments = useMemo(
    () => (documents.length ? documents : ["No document checklist extracted yet."]),
    [documents],
  );
  const [checked, setChecked] = useState({});

  const completed = normalizedDocuments.filter((item) => checked[item]).length;

  return (
    <section className="ai-glass-card ai-check-card">
      <div className="ai-card-head">
        <span><FileCheck2 size={18} /> Required Documents</span>
        <strong>{completed}/{normalizedDocuments.length}</strong>
      </div>
      <div className="ai-check-list">
        {normalizedDocuments.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={Boolean(checked[item])}
              onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
