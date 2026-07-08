import "./Loader.css";

export default function Loader({ label = "Loading", size = "md" }) {
  return (
    <span className={`loader loader--${size}`} role="status" aria-label={label}>
      <span />
    </span>
  );
}
