import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Send } from "lucide-react";
import { createTender } from "../api/tenders";
import "./TenderPublishing.css";

export default function AddTenderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    organization: "",
    category: "",
    location: "",
    amountValue: "",
    deadline: "",
    contact: "",
    description: "",
    eligibilityText: "",
    documentsText: "",
    submissionMode: "EXTERNAL_LINK",
    officialUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { eligibilityText, documentsText, ...tenderFields } = form;
      await createTender({
        ...tenderFields,
        amountValue: form.amountValue ? Number(form.amountValue) : 0,
        publishedDate: new Date().toISOString().slice(0, 10),
        status: "Open",
        eligibility: eligibilityText.split("\n").map((item) => item.trim()).filter(Boolean),
        documents: documentsText.split("\n").map((item) => item.trim()).filter(Boolean),
      });
      navigate("/my-tenders", { state: { notice: "Your tender is now listed." } });
    } catch (submitError) {
      setError(submitError.message || "Unable to publish this tender. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="tender-publishing-page">
      <button className="publishing-back" type="button" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Back</button>
      <header className="publishing-heading">
        <span>ORGANIZER WORKSPACE</span>
        <h1>Publish a tender</h1>
        <p>Share the opportunity, eligibility criteria, and how suppliers should respond.</p>
      </header>

      <form className="publishing-form" onSubmit={handleSubmit}>
        <section className="publishing-section">
          <div className="publishing-section-heading"><span>01</span><div><h2>Tender details</h2><p>Give suppliers the information they need to decide whether to respond.</p></div></div>
          <div className="publishing-grid">
            <label className="publishing-field publishing-field--wide">Tender title<input required maxLength="180" name="title" value={form.title} onChange={update} placeholder="e.g. Regional equipment supply contract" /></label>
            <label className="publishing-field">Organization<input required maxLength="140" name="organization" value={form.organization} onChange={update} placeholder="Issuing organization" /></label>
            <label className="publishing-field">Category<input required name="category" value={form.category} onChange={update} placeholder="Construction, IT, healthcare..." /></label>
            <label className="publishing-field">Location<input required name="location" value={form.location} onChange={update} placeholder="City, state or nationwide" /></label>
            <label className="publishing-field">Estimated value (INR)<input min="0" type="number" name="amountValue" value={form.amountValue} onChange={update} placeholder="Optional" /></label>
            <label className="publishing-field">Submission deadline<input required type="date" min={new Date().toISOString().slice(0, 10)} name="deadline" value={form.deadline} onChange={update} /></label>
            <label className="publishing-field">Contact email or phone<input name="contact" value={form.contact} onChange={update} placeholder="Procurement contact" /></label>
            <label className="publishing-field publishing-field--wide">Description<textarea required maxLength="4000" rows="4" name="description" value={form.description} onChange={update} placeholder="Scope, delivery expectations, and key dates" /></label>
            <label className="publishing-field">Eligibility criteria<textarea rows="4" name="eligibilityText" value={form.eligibilityText} onChange={update} placeholder="One requirement per line" /></label>
            <label className="publishing-field">Required documents<textarea rows="4" name="documentsText" value={form.documentsText} onChange={update} placeholder="One document per line" /></label>
          </div>
        </section>

        <section className="publishing-section">
          <div className="publishing-section-heading"><span>02</span><div><h2>How should suppliers submit?</h2><p>Choose the response route for this tender.</p></div></div>
          <div className="submission-choice-grid">
            <label className={`submission-choice ${form.submissionMode === "EXTERNAL_LINK" ? "is-selected" : ""}`}>
              <input type="radio" name="submissionMode" value="EXTERNAL_LINK" checked={form.submissionMode === "EXTERNAL_LINK"} onChange={update} />
              <ExternalLink size={19} /><strong>Official portal</strong><span>Send suppliers to your procurement website.</span>
            </label>
            <label className={`submission-choice ${form.submissionMode === "PLATFORM" ? "is-selected" : ""}`}>
              <input type="radio" name="submissionMode" value="PLATFORM" checked={form.submissionMode === "PLATFORM"} onChange={update} />
              <Send size={19} /><strong>Submit on NexTender</strong><span>Receive proposals and PDF documents in your inbox.</span>
            </label>
          </div>
          {form.submissionMode === "EXTERNAL_LINK" ? (
            <label className="publishing-field publishing-field--wide official-link-field">Official tender or submission URL<input required type="url" name="officialUrl" value={form.officialUrl} onChange={update} placeholder="https://procurement.organization.gov/tender/123" /></label>
          ) : null}
        </section>

        {error ? <p className="publishing-error" role="alert">{error}</p> : null}
        <footer className="publishing-actions"><span>Published listings appear in tender search.</span><button type="submit" disabled={saving}>{saving ? "Publishing..." : "Publish tender"}<Send size={16} /></button></footer>
      </form>
    </main>
  );
}
