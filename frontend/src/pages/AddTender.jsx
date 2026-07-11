import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarAlt,
  FaFileAlt,
  FaLayerGroup,
  FaPlusCircle,
  FaRupeeSign,
  FaShieldAlt,
  FaTag,
} from "react-icons/fa";
import { createTender } from "../api/tenders";
import "./TenderPages.css";

export default function AddTender() {
  // Stores form fields, save status, and feedback messages for the create-tender page.
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    organization: "",
    category: "",
    deadline: "",
    amount: "",
    description: "",
  });

  // Keeps local form state in sync with each input and clears old feedback.
  const handleChange = (e) => {
    setError("");
    setSuccess(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Sends the new tender to the backend, then redirects to the created tender detail page.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      amountValue: Number(String(form.amount).replace(/[^\d.]/g, "")) || 0,
    };

    try {
      const newTender = await createTender(payload);
      setSuccess(true);
      navigate(`/tender/${newTender.id}`);
    } catch (err) {
      setError(err?.message || "Unable to create the tender right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="tender-page add-tender-page">
      {/* Hero section explains why this page exists and links back to key tender views. */}
      <section className="tender-hero add-tender-hero">
        <span className="tender-eyebrow">Add New Tender</span>
        <h1>Capture a fresh opportunity in one clean step.</h1>
        <p>
          Create a structured tender record that can flow straight into the
          dashboard, search, and AI review screens.
        </p>
        <div className="tender-hero-actions">
          <button type="button" onClick={() => navigate("/tenders")}>
            <FaLayerGroup /> Back to tenders
          </button>
          <button type="button" onClick={() => navigate("/dashboard")}>
            <FaArrowRight /> View dashboard
          </button>
        </div>
      </section>

      {/* Main add-tender layout contains the create form and guidance panel. */}
      <section className="add-tender-layout">
        {/* Tender form captures the core fields needed by search, analytics, and details pages. */}
        <article className="detail-panel add-tender-panel">
          <div className="add-tender-panel-head">
            <div>
              <span className="tender-eyebrow">Tender details</span>
              <h2>
                <FaPlusCircle /> New record
              </h2>
            </div>
            <div className="add-tender-badge">
              <FaShieldAlt />
              Ready to publish
            </div>
          </div>

          {error && <p className="add-tender-message error">{error}</p>}
          {success && (
            <p className="add-tender-message success">Tender saved successfully.</p>
          )}

          <form className="add-tender-form" onSubmit={handleSubmit}>
            <label>
              <FaFileAlt />
              <input
                name="title"
                placeholder="Tender title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <FaBuilding />
              <input
                name="organization"
                placeholder="Organization / buyer"
                value={form.organization}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <FaTag />
              <input
                name="category"
                placeholder="Category"
                value={form.category}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <FaCalendarAlt />
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <FaRupeeSign />
              <input
                name="amount"
                placeholder="Amount (e.g. 2500000)"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </label>
            <label className="add-tender-textarea">
              <FaLayerGroup />
              <textarea
                name="description"
                placeholder="Short description of the tender scope"
                value={form.description}
                onChange={handleChange}
                rows={6}
              />
            </label>

            <button className="add-tender-submit" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create tender"}
              <FaArrowRight />
            </button>
          </form>
        </article>

        {/* Side panel explains the save flow and how entered data is used after creation. */}
        <aside className="detail-panel add-tender-side">
          <h2>
            <FaShieldAlt /> What happens next
          </h2>
          <ul>
            <li>The new tender is sent to the backend create endpoint.</li>
            <li>You are redirected to the tender details screen after save.</li>
            <li>The record can then be viewed from lists, insights, and search.</li>
          </ul>

          <div className="add-tender-tip">
            <strong>Tip</strong>
            <p>
              Use the amount field as a plain number. We normalize it before
              submit so analytics can use it.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
