import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import AboutPage from "./pages/AboutPage";
import AddTenderPage from "./pages/AddTenderPage";
import AdminPage from "./pages/AdminPage";
import AIInsights from "./pages/AIInsights";
import Alerts from "./pages/Alerts";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Notifications from "./pages/Notifications";
import RegisterPage from "./pages/RegisterPage";
import SavedTenders from "./pages/SavedTenders";
import TenderDetails from "./pages/TenderDetails";
import TenderList from "./pages/TenderList";
import UserProfile from "./pages/UserProfile";

function LegacyTenderRedirect() {
  const { id } = useParams();
  return <Navigate to={`/tenders/${id}`} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/about" element={<AboutPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/tenders" element={<TenderList />} />
                  <Route path="/tenders/:id" element={<TenderDetails />} />
                  <Route path="/saved-tenders" element={<SavedTenders />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/insights" element={<AIInsights />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/settings" element={<UserProfile />} />
                </Route>

                <Route element={<ProtectedRoute role="ADMIN" />}>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/tenders/add" element={<AddTenderPage />} />
                </Route>

                <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />
                <Route path="/tender/:id" element={<LegacyTenderRedirect />} />
                <Route path="/add-tender" element={<Navigate to="/tenders/add" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
