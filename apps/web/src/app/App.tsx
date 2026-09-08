import { HomePage } from "@/app/HomePage";
import { NotFoundPage } from "@/app/NotFoundPage";
import {
  AdminRoute,
  ProtectedRoute,
  RedirectIfRegistered,
  RequirePatientProfile,
  RequireStaff,
} from "@/app/RouteGuards";
import { AccountProvider } from "@/features/account/hooks/use-account";
import { AccountPage } from "@/features/account/pages/AccountPage";
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage";
import { BookAppointmentPage } from "@/features/appointments/pages/BookAppointmentPage";
import { BookingSuccessPage } from "@/features/appointments/pages/BookingSuccessPage";
import { PatientDashboardPage } from "@/features/appointments/pages/PatientDashboardPage";
import { SignInPage } from "@/features/auth/pages/SignInPage";
import { PatientClinicalRecordPage } from "@/features/encounters/pages/PatientClinicalRecordPage";
import { RecordEncounterPage } from "@/features/encounters/pages/RecordEncounterPage";
import { HelpPage } from "@/features/help/pages/HelpPage";
import { LabResultDetailPage } from "@/features/lab-results/pages/LabResultDetailPage";
import { RequestLabTestPage } from "@/features/lab-results/pages/RequestLabTestPage";
import { CookiePolicyPage, PrivacyPolicyPage, TermsPage } from "@/features/legal/pages/LegalPage";
import { RegisterPatientPage } from "@/features/patients/pages/RegisterPatientPage";
import { StaffDashboardPage } from "@/features/staff/pages/StaffDashboardPage";
import { StaffProfilePage } from "@/features/staff/pages/StaffProfilePage";
import { Layout } from "@/shared/layout/Layout";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

// A data router (rather than <BrowserRouter>) because useBlocker — what powers
// the unsaved-changes guard on the long clinical forms — only works under one.
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in" element={<SignInPage />} />

      {/* Public on purpose: someone has to be able to read what they are
          agreeing to before they have an account, and a patient who has
          closed theirs still needs the privacy policy. */}
      <Route
        path="/privacy"
        element={
          <Layout width="narrow">
            <PrivacyPolicyPage />
          </Layout>
        }
      />
      <Route
        path="/terms"
        element={
          <Layout width="narrow">
            <TermsPage />
          </Layout>
        }
      />
      <Route
        path="/cookies"
        element={
          <Layout width="narrow">
            <CookiePolicyPage />
          </Layout>
        }
      />
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
  // Outside the router: the nav bar renders on every authenticated route, and
  // the account it shows must survive navigation between them.
  return (
    <AccountProvider>
      <RouterProvider router={router} />
    </AccountProvider>
  );
}
