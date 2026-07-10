import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import AboutPage from "./pages/AboutPage";
import AddTenderPage from "./pages/AddTenderPage";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import InsightsPage from "./pages/InsightsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TenderDetailsPage from "./pages/TenderDetailsPage";
import Tenders from "./pages/Tenders/Tenders";

function LegacyTenderRedirect() {
  const { id } = useParams();
  return <Navigate to={`/tenders/${id}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tenders" element={<Tenders />} />
                <Route path="/tenders/:id" element={<TenderDetailsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
              </Route>

              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/tenders/add" element={<AddTenderPage />} />
              </Route>

              <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
              <Route path="/tender/:id" element={<LegacyTenderRedirect />} />
              <Route path="/add-tender" element={<Navigate to="/tenders/add" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
