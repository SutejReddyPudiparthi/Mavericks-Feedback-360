import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../../api";
import {
  StatCard,
  Badge,
  CompletionBar,
  PageHeader,
} from "../../components/UI.jsx";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/master/sessions?pageSize=5"),
      api.get("/notifications?pageSize=5"),
    ])
      .then(([ov, sess, notifs]) => {
        setOverview(ov.data);
        setSessions(sess.data.data);
        setNotifications(notifs.data.data);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Training feedback overview and key metrics"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Sessions"
          value={overview?.activeSessions}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          label="Closed Cycles"
          value={overview?.closedCycles}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Overdue Cycles"
          value={overview?.overdueCycles}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Total Submissions"
          value={overview?.totalSubmissions}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Sessions</h2>
            <Link
              to="/admin/sessions"
              className="text-sm text-brand-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {sessions.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">
                No sessions yet
              </p>
            )}
            {sessions.map((s) => (
              <Link
                key={s.id}
                to={`/admin/sessions/${s.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {s.course?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.trainer?.name} ·{" "}
                    {new Date(s.startDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge status={s.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Alerts</h2>
            <span className="badge-red">
              {overview?.alertCount || 0} unread
            </span>
          </div>
          <div className="space-y-3">
            {notifications.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">
                No alerts
              </p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border text-sm ${n.readAt ? "border-gray-100 text-gray-500" : "border-yellow-200 bg-yellow-50 text-gray-800"}`}
              >
                <p className="font-medium text-xs text-gray-400 mb-0.5">
                  {n.type}
                </p>
                <p className="text-xs">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
