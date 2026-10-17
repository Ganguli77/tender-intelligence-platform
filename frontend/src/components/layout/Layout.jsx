import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Footer from "./Footer";
import NavbarSwitcher from "../navbar/NavbarSwitcher";

export default function Layout() {
  const location = useLocation();
  const isFullScreenDashboard = location.pathname === "/tenders" || location.pathname === "/dashboard";
  const isFullScreenLogin = location.pathname === "/login";

  if (isFullScreenDashboard || isFullScreenLogin) {
    return (
      <div className={isFullScreenDashboard ? `app-shell ${location.pathname === "/tenders" ? "app-shell--marketplace" : "app-shell--dashboard"}` : isFullScreenLogin ? "app-shell app-shell--auth" : undefined}>
        {!isFullScreenLogin ? <NavbarSwitcher /> : null}
        <Outlet />
      </div>
    );
  }

  return (
    <div className={`app-shell ${location.pathname === "/" ? "app-shell--home" : ""}`}>
      <NavbarSwitcher />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
