import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, BookOpen, Users, Calendar, BarChart2,
  Bell, LogOut, ClipboardList, Star, FileText, Settings, ChevronRight
} from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/trainers', label: 'Trainers', icon: Users },
  { to: '/admin/sessions', label: 'Sessions', icon: Calendar },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/leaderboard', label: 'Leaderboard', icon: Star },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/audit', label: 'Audit Log', icon: ClipboardList },
];

const maverickNav = [
  { to: '/maverick', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/maverick/feedback', label: 'My Feedback', icon: ClipboardList },
  { to: '/maverick/history', label: 'Training History', icon: BookOpen },
  { to: '/maverick/leaderboard', label: 'Leaderboard', icon: Star },
];

const supervisorNav = [
  { to: '/supervisor', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/supervisor/evaluations', label: 'Evaluations', icon: ClipboardList },
  { to: '/supervisor/mavericks', label: 'My Mavericks', icon: Users },
  { to: '/supervisor/leaderboard', label: 'Leaderboard', icon: Star },
];

const navMap = { Admin: adminNav, Maverick: maverickNav, Supervisor: supervisorNav };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = navMap[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 flex flex-col shrink-0">
        <div className="p-5 border-b border-brand-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Maverick 360</p>
              <p className="text-brand-300 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to.split('/').length === 2}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-brand-600 text-white' : 'text-brand-200 hover:bg-brand-800 hover:text-white'}`
              }>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-brand-300 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-brand-200 hover:text-white hover:bg-brand-800 rounded-lg text-sm transition-colors">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}


