import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { MailLoader } from './components/ui/MailLoader';
import { RequireAuth, RedirectIfAuthed } from './features/auth/RequireAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MailboxPage from './pages/MailboxPage';
import EmailDetailPage from './pages/EmailDetailPage';
import { ContactsPage } from './pages/ContactsPage';

const ComposePage = lazy(() => import('./pages/ComposePage'));

function DashboardRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/scheduled', search }} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/scheduled" element={<MailboxPage key="scheduled" tab="scheduled" />} />
        <Route path="/sent" element={<MailboxPage key="sent" tab="sent" />} />
        <Route path="/contacts" element={<ContactsPage />} />
      </Route>

      <Route
        path="/emails/:id"
        element={
          <RequireAuth>
            <EmailDetailPage />
          </RequireAuth>
        }
      />

      <Route
        path="/compose"
        element={
          <RequireAuth>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <MailLoader label="Opening the composer" />
                </div>
              }
            >
              <ComposePage />
            </Suspense>
          </RequireAuth>
        }
      />

      <Route path="/dashboard" element={<DashboardRedirect />} />
      <Route path="*" element={<Navigate to="/scheduled" replace />} />
    </Routes>
  );
}