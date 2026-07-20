import { Link } from "react-router-dom";

export default function Button({
  children,
  to,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const classes = `ds-button ds-button--${variant} ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
