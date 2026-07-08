export default function Badge({
  children,
  color = "cyan",
}) {
  return (
    <span
      className={`
      px-4
      py-2
      rounded-full
      text-sm
      font-semibold
      bg-${color}-500/20
      text-${color}-400
      `}
    >
      {children}
    </span>
  );
}