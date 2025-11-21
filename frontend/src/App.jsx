import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/ProfilePage'
import JobsPage from './pages/JobsPage'
import Automations from './pages/Automations'
import Outreach from './pages/Outreach'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import DashboardLayout from './components/DashboardLayout'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        } />

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          <Route path="/automations" element={
            <SignedIn>
              <Automations />
            </SignedIn>
          } />
          <Route path="/jobs" element={
            <SignedIn>
              <JobsPage />
            </SignedIn>
          } />
          <Route path="/outreach" element={
            <SignedIn>
              <Outreach />
            </SignedIn>
          } />
          <Route path="/analytics" element={
            <SignedIn>
              <Analytics />
            </SignedIn>
          } />
          <Route path="/settings" element={
            <SignedIn>
              <Settings />
            </SignedIn>
          } />
          <Route path="/profile" element={
            <SignedIn>
              <ProfilePage />
            </SignedIn>
          } />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
