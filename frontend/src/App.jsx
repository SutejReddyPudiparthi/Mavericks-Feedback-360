import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import { SessionsList, SessionDetail } from './pages/admin/Sessions';
import { CoursesList, TrainersList } from './pages/admin/CoursesTrainers';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import { UsersList, AuditLog } from './pages/admin/UsersAudit';

// Maverick pages
import { MaverickDashboard, MaverickFeedbackList, MaverickFeedbackForm } from './pages/maverick/Maverick';

// Supervisor pages
import { SupervisorDashboard, EvaluationsList, EvaluationForm } from './pages/supervisor/Supervisor';

// Shared
import Leaderboard from './pages/Leaderboard';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} replace /> : <Login />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute roles={['Admin']}><CoursesList /></ProtectedRoute>} />
      <Route path="/admin/trainers" element={<ProtectedRoute roles={['Admin']}><TrainersList /></ProtectedRoute>} />
      <Route path="/admin/sessions" element={<ProtectedRoute roles={['Admin']}><SessionsList /></ProtectedRoute>} />
      <Route path="/admin/sessions/:id" element={<ProtectedRoute roles={['Admin']}><SessionDetail /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['Admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['Admin']}><Reports /></ProtectedRoute>} />
      <Route path="/admin/leaderboard" element={<ProtectedRoute roles={['Admin']}><Leaderboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['Admin']}><UsersList /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['Admin']}><AuditLog /></ProtectedRoute>} />

      {/* Maverick */}
      <Route path="/maverick" element={<ProtectedRoute roles={['Maverick']}><MaverickDashboard /></ProtectedRoute>} />
      <Route path="/maverick/feedback" element={<ProtectedRoute roles={['Maverick']}><MaverickFeedbackList /></ProtectedRoute>} />
      <Route path="/maverick/feedback/:id" element={<ProtectedRoute roles={['Maverick']}><MaverickFeedbackForm /></ProtectedRoute>} />
      <Route path="/maverick/history" element={<ProtectedRoute roles={['Maverick']}><MaverickFeedbackList /></ProtectedRoute>} />
      <Route path="/maverick/leaderboard" element={<ProtectedRoute roles={['Maverick']}><Leaderboard /></ProtectedRoute>} />

      {/* Supervisor */}
      <Route path="/supervisor" element={<ProtectedRoute roles={['Supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
      <Route path="/supervisor/evaluations" element={<ProtectedRoute roles={['Supervisor']}><EvaluationsList /></ProtectedRoute>} />
      <Route path="/supervisor/evaluations/:id" element={<ProtectedRoute roles={['Supervisor']}><EvaluationForm /></ProtectedRoute>} />
      <Route path="/supervisor/mavericks" element={<ProtectedRoute roles={['Supervisor']}><EvaluationsList /></ProtectedRoute>} />
      <Route path="/supervisor/leaderboard" element={<ProtectedRoute roles={['Supervisor']}><Leaderboard /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
