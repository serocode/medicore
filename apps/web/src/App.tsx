import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminRoute, ProtectedRoute } from "./components/RouteGuards";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { BookAppointmentPage } from "./pages/BookAppointmentPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { RegisterPatientPage } from "./pages/RegisterPatientPage";
import { SignInPage } from "./pages/SignInPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Layout>
                <RegisterPatientPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/book"
          element={
            <ProtectedRoute>
              <Layout>
                <BookAppointmentPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <PatientDashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Layout>
                <AdminDashboardPage />
              </Layout>
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
