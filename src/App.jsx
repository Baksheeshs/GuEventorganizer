import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CertificateProvider } from './context/CertificateContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { ToastProvider } from './context/ToastContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { EventManagementProvider } from './context/EventManagementContext';
import { ClubManagementProvider } from './context/ClubManagementContext';
import { VenueProvider } from './context/VenueContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { NotificationProvider } from './context/NotificationContext';
import { useLiveNotifications } from './hooks/useLiveNotifications';
import DashboardLayout from './components/layout/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CreateEventPage from './pages/CreateEventPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ClubsPage from './pages/ClubsPage';
import ClubDetailsPage from './pages/ClubDetailsPage';
import CertificatesPage from './pages/CertificatesPage';
import VenuesPage from './pages/VenuesPage';
import ProfilePage from './pages/ProfilePage';
import AttendancePage from './pages/AttendancePage';
import EventResultsPage from './pages/EventResultsPage';
import ManageRegistrationsPage from './pages/ManageRegistrationsPage';
import ManageClubRegistrationsPage from './pages/ManageClubRegistrationsPage';
import MyClubApplicationsPage from './pages/MyClubApplicationsPage';

function DashboardRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gu-200 border-t-gu-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-dark-500 dark:text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  return (
    <BookmarkProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student" element={<DashboardRoute><StudentDashboard /></DashboardRoute>} />
          <Route path="/organizer" element={<DashboardRoute><OrganizerDashboard /></DashboardRoute>} />
          <Route path="/admin" element={<DashboardRoute><AdminDashboard /></DashboardRoute>} />
          <Route path="/events" element={<DashboardRoute><EventsPage /></DashboardRoute>} />
          <Route path="/events/:id" element={<DashboardRoute><EventDetailsPage /></DashboardRoute>} />
          <Route path="/create-event" element={<DashboardRoute><CreateEventPage /></DashboardRoute>} />
          <Route path="/notifications" element={<DashboardRoute><NotificationsPage /></DashboardRoute>} />
          <Route path="/analytics" element={<DashboardRoute><AnalyticsPage /></DashboardRoute>} />
          <Route path="/clubs" element={<DashboardRoute><ClubsPage /></DashboardRoute>} />
          <Route path="/clubs/:id" element={<DashboardRoute><ClubDetailsPage /></DashboardRoute>} />
          <Route path="/certificates" element={<DashboardRoute><CertificatesPage /></DashboardRoute>} />
          <Route path="/venues" element={<DashboardRoute><VenuesPage /></DashboardRoute>} />
          <Route path="/profile" element={<DashboardRoute><ProfilePage /></DashboardRoute>} />
          <Route path="/attendance" element={<DashboardRoute><AttendancePage /></DashboardRoute>} />
          <Route path="/event-results" element={<DashboardRoute><EventResultsPage /></DashboardRoute>} />
          <Route path="/manage-registrations/:eventId" element={<DashboardRoute><ManageRegistrationsPage /></DashboardRoute>} />
          <Route path="/manage-club-registrations" element={<DashboardRoute><ManageClubRegistrationsPage /></DashboardRoute>} />
          <Route path="/my-applications" element={<DashboardRoute><MyClubApplicationsPage /></DashboardRoute>} />
        </Routes>
      </NotificationProvider>
    </BookmarkProvider>
  );
}

function LiveNotificationActivator() {
  useLiveNotifications();
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ClubManagementProvider>
          <VenueProvider>
          <EventManagementProvider>
            <CertificateProvider>
              <RegistrationProvider>
              <FeedbackProvider>
                <ToastProvider>
                  <Router>
                    <LiveNotificationActivator />
                    <AppRoutes />
                  </Router>
                </ToastProvider>
              </FeedbackProvider>
              </RegistrationProvider>
            </CertificateProvider>
          </EventManagementProvider>
          </VenueProvider>
        </ClubManagementProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
