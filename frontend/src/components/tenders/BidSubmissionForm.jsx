import { useState } from "react";
import { FileUp, Send } from "lucide-react";
import { submitTenderBid } from "../../api/tenders";

export default function BidSubmissionForm({ tender }) {
  const [form, setForm] = useState({ supplierOrganization: "", contactName: "", contactEmail: "", amountValue: "", proposal: "" });
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      await submitTenderBid(tender.id, { ...form, amountValue: form.amountValue ? Number(form.amountValue) : null }, files);
      setStatus("Bid submitted. The tender organizer has been notified.");
      setFiles([]);
      setForm({ supplierOrganization: "", contactName: "", contactEmail: "", amountValue: "", proposal: "" });
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error.message || "Unable to submit your bid. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="bid-submit-form" onSubmit={handleSubmit}>
      <p>Your proposal is visible only to the tender organizer and your account.</p>
      <div className="bid-submit-grid">
        <label>Supplier organization<input required maxLength="180" name="supplierOrganization" value={form.supplierOrganization} onChange={update} /></label>
        <label>Contact person<input required maxLength="140" name="contactName" value={form.contactName} onChange={update} /></label>
        <label>Contact email<input required type="email" maxLength="180" name="contactEmail" value={form.contactEmail} onChange={update} /></label>
        <label>Proposed amount (INR)<input min="0" type="number" name="amountValue" value={form.amountValue} onChange={update} /></label>
        <label className="bid-submit-wide">Proposal summary<textarea required maxLength="4000" rows="5" name="proposal" value={form.proposal} onChange={update} placeholder="Describe your approach, experience, and delivery plan." /></label>
        <label className="bid-file-field bid-submit-wide"><FileUp size={18} /><span>Attach PDFs <small>Up to 5 files, 10 MB each</small></span><input type="file" accept="application/pdf,.pdf" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></label>
      </div>
      {files.length ? <p className="bid-file-list">{files.map((file) => file.name).join(" · ")}</p> : null}
      {status ? <p className="bid-submit-status" role="status">{status}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit bid"}<Send size={16} /></button>
    </form>
  );
}