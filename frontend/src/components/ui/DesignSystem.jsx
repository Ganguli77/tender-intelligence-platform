import { Search } from "lucide-react";

export function SearchBar({ value, onChange, placeholder = "Search...", onSubmit, className = "" }) {
  return (
    <form className={`ds-search ${className}`} onSubmit={onSubmit}>
      <Search size={18} />
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </form>
  );
}

export function Select({ className = "", children, ...props }) {
  return <select className={`ds-select ${className}`} {...props}>{children}</select>;
}

export function Dropdown({ children, className = "" }) {
  return <div className={`ds-dropdown ${className}`}>{children}</div>;
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="ds-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ds-modal__panel">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, children, className = "" }) {
  return <aside className={`ds-drawer ${open ? "is-open" : ""} ${className}`}>{children}</aside>;
}

export function Table({ children, className = "" }) {
  return <div className={`ds-table ${className}`}>{children}</div>;
}

export function Pagination({ children, className = "" }) {
  return <nav className={`ds-pagination ${className}`}>{children}</nav>;
}

export function Tooltip({ label, children }) {
  return <span className="ds-tooltip" data-tooltip={label}>{children}</span>;
}

export function Toast({ children, tone = "info" }) {
  return <div className={`ds-toast ds-toast--${tone}`}>{children}</div>;
}

export function Tabs({ children, className = "" }) {
  return <div className={`ds-tabs ${className}`}>{children}</div>;
}

export function SkeletonLoader({ lines = 3 }) {
  return <div className="ds-skeleton">{Array.from({ length: lines }, (_, index) => <span key={index} />)}</div>;
}

export function StatCard({ label, value, icon: Icon, tone = "primary" }) {
  return (
    <article className={`ds-stat ds-stat--${tone}`}>
      {Icon ? <Icon size={22} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <section className="ds-empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

export function PageHeader({ kicker, title, description, actions }) {
  return (
    <section className="app-page-header">
      <div>
        {kicker ? <span className="app-kicker">{kicker}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ds-header-actions">{actions}</div> : null}
    </section>
  );
}

export function SectionHeader({ title, description, actions }) {
  return (
    <header className="ds-section-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function FilterBar({ children }) {
  return <section className="ds-filter-bar">{children}</section>;
}
