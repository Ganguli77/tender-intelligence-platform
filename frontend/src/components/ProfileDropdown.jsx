import { Bell, Bookmark, LayoutDashboard, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function getInitial(user) {
  const value = user?.name || user?.email || "U";
  return value.trim().charAt(0).toUpperCase();
}

export default function ProfileDropdown({ onNavigate }) {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    onNavigate?.();
    logout();
    navigate("/");
  };

  const handleNavigate = (path) => {
    setOpen(false);
    onNavigate?.();
    navigate(path);
  };

  if (!user) return null;

  return (
    <div className="profile-dropdown" ref={menuRef}>
      <button
        className="profile-dropdown__trigger"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {user.picture ? (
          <img src={user.picture} alt="" />
        ) : (
          <span>{getInitial(user)}</span>
        )}
      </button>

      {open ? (
        <div className="profile-dropdown__menu" role="menu">
          <div className="profile-dropdown__header">
            <div className="profile-dropdown__avatar">
              {user.picture ? <img src={user.picture} alt="" /> : <UserRound size={22} />}
            </div>
            <div>
              <strong>{user.name || "NexTender user"}</strong>
              <small>{user.email || "No email available"}</small>
            </div>
          </div>

          <div className={`profile-dropdown__role ${isAdmin ? "is-admin" : ""}`}>
            <ShieldCheck size={15} />
            {isAdmin ? "ADMIN" : "USER"}
          </div>

          <div className="profile-dropdown__links">
            <button type="button" role="menuitem" onClick={() => handleNavigate("/dashboard")}>
              <LayoutDashboard size={16} />
              Dashboard
            </button>
            <button type="button" role="menuitem" onClick={() => handleNavigate("/profile")}>
              <UserRound size={16} />
              Profile
            </button>
            <button type="button" role="menuitem" onClick={() => handleNavigate("/saved-tenders")}>
              <Bookmark size={16} />
              Saved Tenders
            </button>
            <button type="button" role="menuitem" onClick={() => handleNavigate("/alerts")}>
              <Bell size={16} />
              Alerts
            </button>
            <button type="button" role="menuitem" onClick={() => handleNavigate("/notifications")}>
              <Bell size={16} />
              Notifications
            </button>
            <button type="button" role="menuitem" onClick={() => handleNavigate("/settings")}>
              <Settings size={16} />
              Settings
            </button>
            {isAdmin ? (
              <button type="button" role="menuitem" onClick={() => handleNavigate("/admin")}>
                <ShieldCheck size={16} />
                Admin Dashboard
              </button>
            ) : null}
          </div>

          <button className="profile-dropdown__logout" type="button" role="menuitem" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
