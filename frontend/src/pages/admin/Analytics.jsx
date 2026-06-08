import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import api from "../../api";
import { PageHeader, Badge } from "../../components/UI.jsx";
import toast from "react-hot-toast";

export default function Analytics() {
  const [leaderboardType, setLeaderboardType] = useState("Maverick");
  const [leaderboard, setLeaderboard] = useState([]);
  const [trainerPerf, setTrainerPerf] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState("");

  useEffect(() => {
    api
      .get(`/analytics/leaderboard?type=${leaderboardType}`)
      .then((r) => setLeaderboard(r.data))
      .catch(() => toast.error("Failed to load leaderboard"));
  }, [leaderboardType]);

  useEffect(() => {
    api.get("/master/trainers").then((r) => {
      setTrainers(r.data);
      if (r.data[0]) setSelectedTrainer(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedTrainer) return;
    api
      .get(`/analytics/trainers/${selectedTrainer}/performance`)
      .then((r) => setTrainerPerf(r.data.avgRatingTrend || []))
      .catch(() => {});
  }, [selectedTrainer]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Training effectiveness and performance insights"
      />

      {/* Trainer Performance Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Trainer Rating Trend</h2>
          <select
            className="input w-48"
            value={selectedTrainer}
            onChange={(e) => setSelectedTrainer(e.target.value)}
          >
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {trainerPerf.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trainerPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="course" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgRating"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Avg Rating"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center py-10">
            No session data for this trainer yet
          </p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Leaderboard</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {["Maverick", "Trainer"].map((t) => (
              <button
                key={t}
                onClick={() => setLeaderboardType(t)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${leaderboardType === t ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">
            No data available yet
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leaderboardType === "Trainer"
                      ? `${item.sessionCount} sessions`
                      : item.employeeId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-600">
                    {leaderboardType === "Trainer"
                      ? item.avgRating
                      : item.avgEffectivenessScore}
                  </p>
                  <p className="text-xs text-gray-400">avg score</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
