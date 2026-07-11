export default function DashboardSkeleton() {
  return (
    <main className="dashboard-v2-page">
      <section className="dashboard-v2-hero dashboard-skeleton-block" />
      <section className="dashboard-v2-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="dashboard-skeleton-block dashboard-skeleton-card" key={index} />
        ))}
      </section>
      <section className="dashboard-v2-middle">
        <div className="dashboard-skeleton-block dashboard-skeleton-panel" />
        <div className="dashboard-skeleton-block dashboard-skeleton-panel" />
      </section>
      <section className="dashboard-v2-bottom">
        <div className="dashboard-skeleton-block dashboard-skeleton-panel" />
        <div className="dashboard-skeleton-block dashboard-skeleton-panel" />
      </section>
    </main>
  );
}
