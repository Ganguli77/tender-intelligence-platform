import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaBars,
  FaChartLine,
  FaChevronRight,
  FaHome,
  FaLightbulb,
  FaMoon,
  FaSun,
  FaTimes,
  FaUniversity,
} from "react-icons/fa";
import ProfileMenu from "./ProfileMenu";
import "./Navbar.css";

const links = [
  { path: "/", label: "Home", icon: FaHome },
  { path: "/tenders", label: "Tenders", icon: FaUniversity },
  { path: "/insights", label: "AI Insights", icon: FaLightbulb },
  { path: "/dashboard", label: "Dashboard", icon: FaChartLine },
  { path: "/about", label: "About", icon: FaChevronRight },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeMode, setThemeMode] = useState("dark");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.ntTheme = themeMode;
  }, [themeMode]);

  const isActiveLink = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/tenders") return location.pathname === "/tenders" || location.pathname.startsWith("/tender/");
    return location.pathname === path;
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav className={`site-navbar ${scrolled ? "scrolled" : ""} ${open ? "menu-open" : ""}`}>
      <Link to="/" className="brand-link" aria-label="NexTender AI home">
        <span className="brand-mark">N</span>
        <span className="brand-copy">
          NexTender AI
          <small>Tender Intelligence</small>
        </span>
      </Link>

      <div className="nav-links" aria-label="Main navigation">
        {links.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className={isActiveLink(path) ? "active" : ""} onClick={closeMenu}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="nav-actions">
        <button
          className="theme-toggle"
          type="button"
          aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setThemeMode((current) => (current === "dark" ? "dim" : "dark"))}
        >
          {themeMode === "dark" ? <FaMoon /> : <FaSun />}
        </button>
        <ProfileMenu onNavigate={closeMenu} />
        <Link to="/register" className="nav-primary-cta" onClick={closeMenu}>
          Start Free
          <FaChevronRight />
        </Link>
        <button
          className="nav-menu-button"
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
}
