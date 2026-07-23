import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import CandidateHome from './pages/CandidateHome';
import Referrals from './pages/Referrals';
import Earnings from './pages/Earnings';
import JobDetail from './pages/JobDetail';
import AIInterview from './pages/AIInterview';
import ApplicationSteps from './pages/ApplicationSteps';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route
            path="/jobs/:id/interview"
            element={
              <ProtectedRoute role="candidate">
                <AIInterview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id/apply"
            element={
              <ProtectedRoute role="candidate">
                <ApplicationSteps />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute role="candidate">
                <CandidateHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute role="candidate">
                <Referrals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/earnings"
            element={
              <ProtectedRoute role="candidate">
                <Earnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="recruiter">
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}