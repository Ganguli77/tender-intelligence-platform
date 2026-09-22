import { useEffect, useState } from "react";
import { ArrowRight, Menu, Moon, Search, Sun, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import ProfileDropdown from "../ProfileDropdown";
import { useAuth } from "../../context/useAuth";
import { useTheme } from "../../context/ThemeContext";

const publicLinks = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/#features" },
  { label: "Marketplace", path: "/tenders" },
  { label: "AI Insights", path: "/insights" },
  { label: "Pricing", path: "/#pricing" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/#contact" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
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

  useEffect(() => {
    if (!location.hash) return;

    const target = document.querySelector(location.hash);
    if (target) {
      window.requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [location]);

  const getLinkClass = (link, isActive) => {
    const [pathname, hash] = link.path.split("#");
    const isHashActive = hash ? location.pathname === pathname && location.hash === `#${hash}` : false;
    const isPlainActive = !hash && isActive && !location.hash;

    return isHashActive || isPlainActive ? "site-nav__link is-active" : "site-nav__link";
  };

  const handleLinkClick = (event, link) => {
    closeMenu();

    if (!link.path.includes("#")) return;

    const [, hash] = link.path.split("#");
    const targetId = hash ? `#${hash}` : "";

    if (location.pathname === "/" && targetId) {
      event.preventDefault();
      navigate(link.path);
      window.requestAnimationFrame(() => {
        document.querySelector(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const handleLogin = () => {
    closeMenu();
    navigate("/login");
  };

  const links = publicLinks;

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
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          <div className="site-nav__links">
            {links.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={(event) => handleLinkClick(event, link)}
                className={({ isActive }) => getLinkClass(link, isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="site-nav__actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Search tenders"
              onClick={() => {
                closeMenu();
                navigate("/tenders");
              }}
            >
              <Search size={18} />
            </button>

            <button
              className="icon-button"
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={() => {
                closeMenu();
                toggleTheme();
              }}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isAuthenticated ? (
              <ProfileDropdown onNavigate={closeMenu} />
            ) : (
              <>
                <button className="button button--ghost" type="button" onClick={handleLogin}>
                  Login
                </button>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => {
                    closeMenu();
                    navigate("/register");
                  }}
                >
                  Get Started <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
