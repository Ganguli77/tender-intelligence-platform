import { Link } from "react-router-dom";

const footerLinks = [
  { label: "About", path: "/about" },
  { label: "Features", path: "/" },
  { label: "Contact", path: "/about" },
  { label: "Privacy", path: "/about" },
  { label: "Terms", path: "/about" },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link className="brand" to="/">
            <span className="brand__mark">N</span>
            <span>NexTender AI</span>
          </Link>
          <p>
            AI-powered tender intelligence for discovery, analysis, dashboards,
            and procurement decision support.
          </p>
        </div>

        <div className="site-footer__links">
          {footerLinks.map((link) => (
            <Link key={link.label} to={link.path}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>Copyright 2026 NexTender AI. All rights reserved.</span>
      </div>
    </footer>
  );
}
