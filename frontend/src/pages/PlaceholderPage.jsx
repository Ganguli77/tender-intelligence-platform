export default function PlaceholderPage({
  eyebrow = "NexTender AI",
  title,
  description,
  actions,
}) {
  return (
    <section className="page-section">
      <div className="page-hero">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
    </section>
  );
}
