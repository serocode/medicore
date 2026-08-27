import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import {
  AdminRoute,
  ProtectedRoute,
  RedirectIfRegistered,
  RequirePatientProfile,
  RequireStaff,
} from "./components/RouteGuards";
import { AccountPage } from "./pages/AccountPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { BookAppointmentPage } from "./pages/BookAppointmentPage";
import { BookingSuccessPage } from "./pages/BookingSuccessPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PatientClinicalRecordPage } from "./pages/PatientClinicalRecordPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { RecordEncounterPage } from "./pages/RecordEncounterPage";
import { RegisterPatientPage } from "./pages/RegisterPatientPage";
import { SignInPage } from "./pages/SignInPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { StaffProfilePage } from "./pages/StaffProfilePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route
          path="/register"
          element={
            <RedirectIfRegistered>
              <Layout>
                <RegisterPatientPage />
              </Layout>
            </RedirectIfRegistered>
          }
        />
        <Route
          path="/book"
          element={
            <RequirePatientProfile>
              <Layout>
                <BookAppointmentPage />
              </Layout>
            </RequirePatientProfile>
          }
        />
        <Route
          path="/book/success"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingSuccessPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequirePatientProfile>
              <Layout>
                <PatientDashboardPage />
              </Layout>
            </RequirePatientProfile>
          }
        />
        <Route
          path="/account"
          element={
            <RequirePatientProfile>
              <Layout>
                <AccountPage />
              </Layout>
            </RequirePatientProfile>
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
        <Route
          path="/staff/dashboard"
          element={
            <RequireStaff>
              <Layout>
                <StaffDashboardPage />
              </Layout>
            </RequireStaff>
          }
        />
        <Route
          path="/staff/profile"
          element={
            <RequireStaff>
              <Layout>
                <StaffProfilePage />
              </Layout>
            </RequireStaff>
          }
        />
        <Route
          path="/patients/:patientId"
          element={
            <RequireStaff>
              <Layout>
                <PatientClinicalRecordPage />
              </Layout>
            </RequireStaff>
          }
        />
        <Route
          path="/patients/:patientId/encounters/new"
          element={
            <RequireStaff>
              <Layout>
                <RecordEncounterPage />
              </Layout>
            </RequireStaff>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
