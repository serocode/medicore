import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
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
import { HelpPage } from "./pages/HelpPage";
import { HomePage } from "./pages/HomePage";
import { LabResultDetailPage } from "./pages/LabResultDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PatientClinicalRecordPage } from "./pages/PatientClinicalRecordPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { RecordEncounterPage } from "./pages/RecordEncounterPage";
import { RegisterPatientPage } from "./pages/RegisterPatientPage";
import { RequestLabTestPage } from "./pages/RequestLabTestPage";
import { SignInPage } from "./pages/SignInPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { StaffProfilePage } from "./pages/StaffProfilePage";

// A data router (rather than <BrowserRouter>) because useBlocker — what powers
// the unsaved-changes guard on the long clinical forms — only works under one.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />
      <Route
        path="/register"
        element={
          <RedirectIfRegistered>
            <Layout width="narrow">
              <RegisterPatientPage />
            </Layout>
          </RedirectIfRegistered>
        }
      />
      <Route
        path="/book"
        element={
          <RequirePatientProfile>
            <Layout width="narrow">
              <BookAppointmentPage />
            </Layout>
          </RequirePatientProfile>
        }
      />
      <Route
        path="/book/success"
        element={
          <ProtectedRoute>
            <Layout width="narrow">
              <BookingSuccessPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequirePatientProfile>
            <Layout width="narrow">
              <PatientDashboardPage />
            </Layout>
          </RequirePatientProfile>
        }
      />
      <Route
        path="/account"
        element={
          <RequirePatientProfile>
            <Layout width="narrow">
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
            <Layout width="narrow">
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
            <Layout width="narrow">
              <RecordEncounterPage />
            </Layout>
          </RequireStaff>
        }
      />
      <Route
        path="/patients/:patientId/lab-results/new"
        element={
          <RequireStaff>
            <Layout width="narrow">
              <RequestLabTestPage />
            </Layout>
          </RequireStaff>
        }
      />
      <Route
        path="/patients/:patientId/lab-results/:labResultId"
        element={
          <RequireStaff>
            <Layout width="narrow">
              <LabResultDetailPage />
            </Layout>
          </RequireStaff>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <Layout>
              <HelpPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Route>,
  ),
);

export function App() {
  return <RouterProvider router={router} />;
}
