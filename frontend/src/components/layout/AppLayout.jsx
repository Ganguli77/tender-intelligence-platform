import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="app-layout app-layout--unified-nav">
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
