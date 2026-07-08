import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";

const publicLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
];

const authenticatedLinks = [
  { label: "Tenders", path: "/tenders" },
  { label: "AI Insights", path: "/insights" },
  { label: "Dashboard", path: "/dashboard" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout, username } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/");
  };

  const handleLogin = () => {
    closeMenu();
    navigate("/login");
  };

  const links = isAuthenticated
    ? [...publicLinks, ...authenticatedLinks, ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : [])]
    : publicLinks;

  return (
    <header className={`site-navbar ${isScrolled ? "is-solid" : ""}`}>
      <div className="site-navbar__inner">
        <NavLink className="brand" to="/" onClick={closeMenu}>
          <span className="brand__mark">N</span>
          <span>NexTender AI</span>
        </NavLink>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          <div className="site-nav__links">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={({ isActive }) => (isActive ? "site-nav__link is-active" : "site-nav__link")}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="site-nav__actions">
            {isAuthenticated ? (
              <span className="site-nav__user" title={username || "Authenticated user"}>
                {username || "User"}
              </span>
            ) : null}

            <button
              className="icon-button"
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <button className="button button--ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <button className="button button--primary" type="button" onClick={handleLogin}>
                Login
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
