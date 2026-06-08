import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Users } from "lucide-react";
import api from "../../api";
import {
  StatCard,
  Badge,
  Table,
  PageHeader,
  StarRating,
} from "../../components/UI.jsx";
import toast from "react-hot-toast";

const CRITERIA = [
  { key: "technicalScore", label: "Technical Competency" },
  { key: "softSkillsScore", label: "Communication & Soft Skills" },
  { key: "projectPerformScore", label: "Project Performance" },
  { key: "teamCollabScore", label: "Team Collaboration" },
  { key: "overallReadinessScore", label: "Overall Readiness" },
];

// ── Supervisor Dashboard ──────────────────────────────────
export function SupervisorDashboard() {
  const [evals, setEvals] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/feedback/supervisor").then((r) => setEvals(r.data));
    api
      .get("/notifications?pageSize=5")
      .then((r) => setNotifications(r.data.data));
  }, []);

  const pending = evals.filter((e) => e.status === "Draft");
  const submitted = evals.filter((e) => e.status === "Submitted");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Dashboard"
        subtitle="Manage Maverick effectiveness evaluations"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Evaluations"
          value={pending.length}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          label="Completed"
          value={submitted.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Total Mavericks"
          value={evals.length}
          icon={Users}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Pending Evaluations
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              🎉 No pending evaluations.
            </p>
          ) : (
            pending.map((e) => (
              <Link
                key={e.id}
                to={`/supervisor/evaluations/${e.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors mb-2"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {e.maverick?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {e.cycle?.session?.course?.name}
                  </p>
                </div>
                <span className="btn-primary text-xs py-1 px-3">
                  Evaluate →
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg text-xs mb-2 ${n.readAt ? "bg-gray-50 text-gray-500" : "bg-blue-50 text-gray-800 border border-blue-100"}`}
              >
                <p className="font-medium text-gray-400 mb-0.5">{n.type}</p>
                <p>{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Evaluations List ──────────────────────────────────────
export function EvaluationsList() {
  const [evals, setEvals] = useState([]);
  useEffect(() => {
    api.get("/feedback/supervisor").then((r) => setEvals(r.data));
  }, []);

  const columns = [
    { key: "maverick", label: "Maverick", render: (r) => r.maverick?.name },
    {
      key: "course",
      label: "Course",
      render: (r) => r.cycle?.session?.course?.name,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "submittedAt",
      label: "Submitted",
      render: (r) =>
        r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Link
          to={`/supervisor/evaluations/${r.id}`}
          className="text-brand-600 hover:underline text-sm"
        >
          {r.status === "Draft" ? "Complete →" : "View"}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Effectiveness Evaluations"
        subtitle="All assigned Maverick evaluations"
      />
      <Table
        columns={columns}
        data={evals}
        emptyMsg="No evaluations assigned yet"
      />
    </div>
  );
}

export function SupervisorMavericks() {
  const [evals, setEvals] = useState([]);

  useEffect(() => {
    api.get("/feedback/supervisor").then((r) => setEvals(r.data));
  }, []);

  const uniqueMavericks = [];
  const seen = new Set();
  evals.forEach((item) => {
    const key = `${item.maverick?.id}-${item.cycle?.id}`;
    if (item.maverick && !seen.has(key)) {
      seen.add(key);
      uniqueMavericks.push(item);
    }
  });

  const columns = [
    { key: "maverick", label: "Maverick", render: (r) => r.maverick?.name },
    {
      key: "course",
      label: "Course",
      render: (r) => r.cycle?.session?.course?.name,
    },
    {
      key: "trainer",
      label: "Trainer",
      render: (r) => r.cycle?.session?.trainer?.name || "—",
    },
    {
      key: "status",
      label: "Evaluation Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Link
          to={`/supervisor/evaluations/${r.id}`}
          className="text-brand-600 hover:underline text-sm"
        >
          View Evaluation
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Mavericks"
        subtitle="Assigned Mavericks and training status"
      />
      <Table
        columns={columns}
        data={uniqueMavericks}
        emptyMsg="No assigned Mavericks yet"
      />
    </div>
  );
}

// ── Evaluation Form ───────────────────────────────────────
export function EvaluationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ev, setEv] = useState(null);
  const [scores, setScores] = useState({
    technicalScore: 0,
    softSkillsScore: 0,
    projectPerformScore: 0,
    teamCollabScore: 0,
    overallReadinessScore: 0,
  });
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/feedback/supervisor/${id}`).then((r) => {
      setEv(r.data);
      setScores({
        technicalScore: r.data.technicalScore || 0,
        softSkillsScore: r.data.softSkillsScore || 0,
        projectPerformScore: r.data.projectPerformScore || 0,
        teamCollabScore: r.data.teamCollabScore || 0,
        overallReadinessScore: r.data.overallReadinessScore || 0,
      });
      setComments(r.data.comments || "");
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(scores).some((s) => !s || s < 1))
      return toast.error("All 5 criteria must be rated");
    setSubmitting(true);
    try {
      await api.post(`/feedback/supervisor/${id}/submit`, {
        ...scores,
        comments,
      });
      toast.success("Evaluation submitted successfully!");
      navigate("/supervisor/evaluations");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await api.put(`/feedback/supervisor/${id}/draft`, {
        ...scores,
        comments,
      });
      toast.success("Draft saved");
    } catch {
      toast.error("Save failed");
    }
  };

  if (!ev)
    return (
      <div className="text-gray-400 text-center py-20">
        Loading evaluation...
      </div>
    );

  const isReadonly = ev.status === "Submitted";
  const avgScore =
    Object.values(scores).filter(Boolean).length === 5
      ? (Object.values(scores).reduce((a, b) => a + b, 0) / 5).toFixed(1)
      : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Effectiveness Evaluation"
        subtitle={
          isReadonly
            ? "Submitted — read only"
            : "90-day post-deployment assessment"
        }
      />

      {/* Pre-filled header */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Maverick:</span>{" "}
            <span className="font-medium">{ev.maverick?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Employee ID:</span>{" "}
            <span className="font-medium">{ev.maverick?.employeeId}</span>
          </div>
          <div>
            <span className="text-gray-500">Training:</span>{" "}
            <span className="font-medium">
              {ev.cycle?.session?.course?.name}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>{" "}
            <Badge status={ev.status} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            Rate each criterion (1 = Poor, 5 = Excellent){" "}
            <span className="text-red-500">*</span>
          </p>
          {avgScore && (
            <p className="text-xs text-gray-400">
              Current average:{" "}
              <span className="font-semibold text-brand-600">{avgScore}/5</span>
            </p>
          )}
        </div>

        {CRITERIA.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <label className="text-sm text-gray-700 flex-1">{label}</label>
            <StarRating
              value={scores[key]}
              onChange={(v) =>
                !isReadonly && setScores((p) => ({ ...p, [key]: v }))
              }
              readonly={isReadonly}
            />
          </div>
        ))}

        <div>
          <label className="label">
            Manager Comments{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            className="input h-28 resize-none"
            disabled={isReadonly}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            maxLength={2000}
            placeholder="Share your observations about this Maverick's performance..."
          />
          <p className="text-xs text-gray-400 mt-1">{comments.length}/2000</p>
        </div>

        {!isReadonly && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary flex-1"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? "Submitting..." : "Submit Evaluation →"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
