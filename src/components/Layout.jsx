import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--bg)",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div
        style={{
          marginLeft: "250px",
          width: "100%",
          padding: "25px",
          color: "var(--text)",
        }}
      >
        <Topbar />

        {children}
      </div>
    </div>
  );
}
