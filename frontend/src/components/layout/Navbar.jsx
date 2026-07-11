import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { getSavedTenderCount } from "../../api/tenders";
import { getSavedTenderIds, SAVED_TENDERS_EVENT } from "../../utils/savedTenders";

const publicLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
];

const authenticatedLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Saved Tenders", path: "/saved-tenders" },
  { label: "Alerts", path: "/alerts" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedCount(0);
      return undefined;
    }

    let isMounted = true;

    async function loadSavedCount() {
      try {
        const count = await getSavedTenderCount();
        if (isMounted) {
          setSavedCount(count);
        }
      } catch {
        if (isMounted) {
          setSavedCount(getSavedTenderIds().length);
        }
      }
    }

    function syncLocalSavedCount() {
      setSavedCount(getSavedTenderIds().length);
      loadSavedCount();
    }

    loadSavedCount();
    window.addEventListener(SAVED_TENDERS_EVENT, syncLocalSavedCount);
    window.addEventListener("storage", syncLocalSavedCount);

    return () => {
      isMounted = false;
      window.removeEventListener(SAVED_TENDERS_EVENT, syncLocalSavedCount);
      window.removeEventListener("storage", syncLocalSavedCount);
    };
  }, [isAuthenticated]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogin = () => {
    closeMenu();
    navigate("/login");
  };

  const links = isAuthenticated
    ? [...publicLinks, { label: "Tenders", path: "/tenders" }, ...authenticatedLinks, { label: "AI Insights", path: "/insights" }, ...(isAdmin ? [{ label: "Admin", path: "/admin" }] : [])]
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
                {link.path === "/saved-tenders" && savedCount > 0 ? (
                  <span className="site-nav__count">{savedCount}</span>
                ) : null}
              </NavLink>
            ))}
          </div>

          <div className="site-nav__actions">
            <button
              className="icon-button"
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <ProfileDropdown onNavigate={closeMenu} />
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
