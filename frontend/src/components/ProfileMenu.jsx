import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaBriefcase,
  FaChartLine,
  FaCog,
  FaFileAlt,
  FaPlusCircle,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../context/useAuth";
import "./ProfileMenu.css";

const mockUsers = {
  ADMIN: {
    name: "Admin User",
    role: "ADMIN",
    email: "admin@nextrender.ai",
  },
  USER: {
    name: "User",
    role: "USER",
    email: "user@nextrender.ai",
  },
};

function getInitial(name, role) {
  const value = name || role || "User";
  return value.trim().charAt(0).toUpperCase();
}

export default function ProfileMenu({ onNavigate }) {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, username, role, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const profile = useMemo(() => {
    const normalizedRole = isAdmin ? "ADMIN" : String(role || "USER").toUpperCase();
    const fallback = mockUsers[normalizedRole] || mockUsers.USER;

    return {
      name: username || fallback.name,
      role: normalizedRole,
      email: fallback.email,
      initial: getInitial(username || fallback.name, normalizedRole),
      isAdmin: normalizedRole === "ADMIN",
    };
  }, [isAdmin, role, username]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    onNavigate?.();
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) {
    return (
      <Link to="/login" className="profile-login-link" onClick={onNavigate} aria-label="Login">
        <span className="profile-login-avatar">
          <FaUserCircle />
        </span>
        <span>Login</span>
      </Link>
    );
  }

  const menuItems = profile.isAdmin
    ? [
        { label: "Dashboard", path: "/dashboard", icon: FaChartLine },
        { label: "Manage Tenders", path: "/tenders", icon: FaBriefcase },
        { label: "Add Tender", path: "/add-tender", icon: FaPlusCircle },
        { label: "Settings", path: "/admin", icon: FaCog },
      ]
    : [
        { label: "My Applications", path: "/profile", icon: FaFileAlt },
        { label: "Saved Tenders", path: "/profile", icon: FaBookmark },
        { label: "Settings", path: "/profile", icon: FaCog },
      ];

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        type="button"
        className={`profile-avatar-button ${profile.isAdmin ? "admin" : "user"}`}
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        {profile.initial}
      </button>

      {open ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-head">
            <span className={`profile-dropdown-avatar ${profile.isAdmin ? "admin" : "user"}`}>
              {profile.initial}
            </span>
            <div>
              <strong>{profile.name}</strong>
              <span className={`role-badge ${profile.isAdmin ? "admin" : "user"}`}>
                Role: {profile.isAdmin ? "Admin" : "User"}
              </span>
              <small>{profile.email}</small>
            </div>
          </div>

          <div className="profile-menu-divider" />

          <div className="profile-menu-items">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.label} to={item.path} role="menuitem" onClick={closeMenu}>
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <button type="button" className="profile-logout-button" onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
