import { Link, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaHome,
  FaPlusCircle,
  FaRegFileAlt,
  FaRegGem,
} from "react-icons/fa";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: FaChartLine },
  { name: "Tenders", path: "/tenders", icon: FaRegFileAlt },
  { name: "Add New", path: "/add-tender", icon: FaPlusCircle },
  { name: "Insights", path: "/insights", icon: FaRegGem },
  { name: "Home", path: "/", icon: FaHome },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="modern-sidebar">
      <div className="modern-sidebar-brand">
        <span className="modern-sidebar-mark">AI</span>
        <div>
          <strong>nexTender</strong>
          <small>Intelligence workspace</small>
        </div>
      </div>

      <nav className="modern-sidebar-nav" aria-label="Sidebar navigation">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`modern-sidebar-link ${active ? "active" : ""}`}
            >
              <Icon />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
