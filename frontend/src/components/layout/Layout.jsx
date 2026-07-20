import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useAuth } from "../../context/useAuth";
import AppLayout from "./AppLayout";

const appRoutes = ["/dashboard", "/tenders", "/saved-tenders", "/alerts", "/insights", "/admin", "/profile", "/notifications", "/settings"];

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAppRoute = appRoutes.some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));

  if (isAuthenticated && isAppRoute) {
    return <AppLayout />;
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
