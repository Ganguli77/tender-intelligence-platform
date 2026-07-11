import { Link } from "react-router-dom";

export default function Button({
  children,
  to,
  onClick,
  variant = "primary",
  className = "",
}) {
  const base =
    "px-6 py-3 rounded-xl font-semibold transition-all duration-300";

  const styles = {
    primary:
      "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg hover:shadow-cyan-500/40",

    secondary:
      "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",

    outline:
      "border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white",
  };

  if (to) {
    return (
      <Link
        to={to}
        className={`${base} ${styles[variant]} ${className}`}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}