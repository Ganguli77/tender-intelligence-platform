import { BellPlus } from "lucide-react";
import { useState } from "react";

const initialForm = {
  name: "",
  keywords: "",
  category: "",
  location: "",
  minOpportunityScore: 70,
  riskLevel: "Any",
};

export default function AlertForm({ onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        minOpportunityScore: Number(form.minOpportunityScore) || 0,
        riskLevel: form.riskLevel === "Any" ? "" : form.riskLevel,
      });
      setForm(initialForm);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="alert-form" onSubmit={handleSubmit}>
      <label>
        <span>Alert name</span>
        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Metro infra watch" />
      </label>
      <label>
        <span>Keywords</span>
        <input value={form.keywords} onChange={(event) => updateField("keywords", event.target.value)} placeholder="solar, road, SaaS" />
      </label>
      <label>
        <span>Category</span>
        <input value={form.category} onChange={(event) => updateField("category", event.target.value)} placeholder="Infrastructure" />
      </label>
      <label>
        <span>Location</span>
        <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Maharashtra" />
      </label>
      <label>
        <span>Minimum score</span>
        <input type="number" min="0" max="100" value={form.minOpportunityScore} onChange={(event) => updateField("minOpportunityScore", event.target.value)} />
      </label>
      <label>
        <span>Risk level</span>
        <select value={form.riskLevel} onChange={(event) => updateField("riskLevel", event.target.value)}>
          <option>Any</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>
      <button type="submit" disabled={submitting}>
        <BellPlus size={18} /> {submitting ? "Creating..." : "Create Alert"}
      </button>
    </form>
  );
}
