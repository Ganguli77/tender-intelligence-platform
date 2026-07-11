export default function TenderSkeleton({ rows = 10 }) {
  return (
    <div className="premium-skeleton-list" aria-label="Loading tenders">
      {Array.from({ length: rows }, (_, index) => (
        <article className="premium-skeleton-row" key={index}>
          <span />
          <div>
            <strong />
            <p />
            <small />
          </div>
          <p />
          <p />
          <p />
          <i />
          <b />
        </article>
      ))}
    </div>
  );
}
