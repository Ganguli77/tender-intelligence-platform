export default function Card({
  children,
  className = "",
}) {
  return (
    <div
      className={`
      bg-slate-900/70
      backdrop-blur-xl
      border
      border-slate-700
      rounded-3xl
      p-6
      shadow-2xl
      hover:border-cyan-500
      transition-all
      duration-300
      ${className}
      `}
    >
      {children}
    </div>
  );
}