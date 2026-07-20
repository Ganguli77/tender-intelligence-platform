export default function Badge({
  children,
  color = "primary",
  className = "",
}) {
  return (
    <span className={`ds-badge ds-badge--${color} ${className}`}>
      {children}
    </span>
  );
}
