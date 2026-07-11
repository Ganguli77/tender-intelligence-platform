import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function Layout() {
  const location = useLocation();
  const isFullScreenDashboard = location.pathname === "/tenders";

  if (isFullScreenDashboard) {
    return <Outlet />;
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
