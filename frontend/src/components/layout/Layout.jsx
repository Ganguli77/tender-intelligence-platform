import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import NavbarSwitcher from "../navbar/NavbarSwitcher";

export default function Layout() {
  const location = useLocation();
  const isFullScreenDashboard = location.pathname === "/tenders";

  if (isFullScreenDashboard) {
    return (
      <>
        <NavbarSwitcher />
        <Outlet />
      </>
    );
  }

  return (
    <div className="app-shell">
      <NavbarSwitcher />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
