import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import api from "../../api";
import {
  StatCard,
  Badge,
  Table,
  PageHeader,
  StarRating,
} from "../../components/UI.jsx";
import toast from "react-hot-toast";

// ── Maverick Dashboard ────────────────────────────────────
export function MaverickDashboard() {
  const [forms, setForms] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get("/feedback/maverick").then((r) => setForms(r.data));
    api
      .get("/notifications?pageSize=5")
      .then((r) => setNotifications(r.data.data));
  }, []);

  const pending = forms.filter((f) => f.status === "Draft");
  const submitted = forms.filter((f) => f.status === "Submitted");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        subtitle="Your training feedback and history"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Feedback"
          value={pending.length}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          label="Submitted"
          value={submitted.length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Total Assigned"
          value={forms.length}
          icon={ClipboardList}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">
            Pending Feedback Forms
          </h2>
          {pending.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              🎉 All caught up! No pending feedback.
            </p>
          ) : (
            pending.map((f) => (
              <Link
                key={f.id}
                to={`/maverick/feedback/${f.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors mb-2"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {f.cycle?.session?.course?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Trainer: {f.cycle?.session?.trainer?.name}
                  </p>
                </div>
                <span className="btn-primary text-xs py-1 px-3">
                  Submit Now →
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

// ── Feedback List ─────────────────────────────────────────
export function MaverickFeedbackList() {
  const [forms, setForms] = useState([]);
  useEffect(() => {
    api.get("/feedback/maverick").then((r) => setForms(r.data));
  }, []);

  const columns = [
    {
      key: "course",
      label: "Course",
      render: (r) => r.cycle?.session?.course?.name,
    },
    {
      key: "trainer",
      label: "Trainer",
      render: (r) => r.cycle?.session?.trainer?.name,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "rating",
      label: "Rating",
      render: (r) => (r.overallRating ? `${r.overallRating}/5` : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Link
          to={`/maverick/feedback/${r.id}`}
          className="text-brand-600 hover:underline text-sm"
        >
          {r.status === "Draft" ? "Complete →" : "View"}
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Feedback" subtitle="All assigned feedback forms" />
      <Table
        columns={columns}
        data={forms}
        emptyMsg="No feedback forms assigned yet"
      />
    </div>
  );
}

export function MaverickHistory() {
  const [forms, setForms] = useState([]);
  useEffect(() => {
    api.get("/feedback/maverick").then((r) => setForms(r.data));
  }, []);

  const submitted = forms.filter((f) => f.status === "Submitted");
  const columns = [
    {
      key: "course",
      label: "Course",
      render: (r) => r.cycle?.session?.course?.name,
    },
    {
      key: "trainer",
      label: "Trainer",
      render: (r) => r.cycle?.session?.trainer?.name,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "rating",
      label: "Rating",
      render: (r) => (r.overallRating ? `${r.overallRating}/5` : "—"),
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <Link
          to={`/maverick/feedback/${r.id}`}
          className="text-brand-600 hover:underline text-sm"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training History"
        subtitle="Past completed feedback forms"
      />
      <Table
        columns={columns}
        data={submitted}
        emptyMsg="No completed training history yet"
      />
    </div>
  );
}

// ── Feedback Form ─────────────────────────────────────────
export function MaverickFeedbackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({
    overallRating: 0,
    keyLearnings: "",
    suggestedImprovements: "",
    followUpResponse: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const saveStatusText = (() => {
    if (saving) return "Saving draft...";
    if (lastSaved) return `Draft saved ${lastSaved.toLocaleTimeString()}`;
    return "Auto-saves every 60s";
  })();

  useEffect(() => {
    api.get(`/feedback/maverick/${id}`).then((r) => {
      setForm(r.data);
      setValues({
        overallRating: r.data.overallRating || 0,
        keyLearnings: r.data.keyLearnings || "",
        suggestedImprovements: r.data.suggestedImprovements || "",
        followUpResponse: r.data.followUpResponse || "",
      });
    });
  }, [id]);

  // Auto-save every 60s
  useEffect(() => {
    if (!form || form.status === "Submitted") return;
    const t = setInterval(async () => {
      setSaving(true);
      try {
        await api.put(`/feedback/maverick/${id}/draft`, values);
        setLastSaved(new Date());
      } catch {
      } finally {
        setSaving(false);
      }
    }, 60000);
    return () => clearInterval(t);
  }, [form, values, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.overallRating) return toast.error("Overall rating is required");
    setSubmitting(true);
    try {
      await api.post(`/feedback/maverick/${id}/submit`, values);
      toast.success("Feedback submitted successfully!");
      navigate("/maverick/feedback");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.put(`/feedback/maverick/${id}/draft`, values);
      setLastSaved(new Date());
      toast.success("Draft saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!form)
    return (
      <div className="text-gray-400 text-center py-20">Loading form...</div>
    );

  const isReadonly = form.status === "Submitted";
  const session = form.cycle?.session;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Training Feedback Form"
        subtitle={
          isReadonly
            ? "Submitted — read only"
            : "Complete and submit your feedback"
        }
      />

      {/* Pre-filled header */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Employee:</span>{" "}
            <span className="font-medium">{form.user?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Employee ID:</span>{" "}
            <span className="font-medium">{form.user?.employeeId}</span>
          </div>
          <div>
            <span className="text-gray-500">Course:</span>{" "}
            <span className="font-medium">{session?.course?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Trainer:</span>{" "}
            <span className="font-medium">{session?.trainer?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Session:</span>{" "}
            <span className="font-medium">
              {session && new Date(session.startDate).toLocaleDateString()} –{" "}
              {session && new Date(session.endDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>{" "}
            <Badge status={form.status} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Rating */}
        <div>
          <p className="label text-base">
            Overall Satisfaction <span className="text-red-500">*</span>
          </p>
          <p className="text-xs text-gray-400 mb-2">1 = Poor, 5 = Excellent</p>
          <StarRating
            value={values.overallRating}
            onChange={(v) =>
              !isReadonly && setValues((p) => ({ ...p, overallRating: v }))
            }
            readonly={isReadonly}
          />
        </div>

        {/* Conditional follow-up */}
        {values.overallRating > 0 && values.overallRating <= 2 && (
          <div>
            <label htmlFor="followUpResponse" className="label">
              What specifically disappointed you?
            </label>
            <textarea
              id="followUpResponse"
              className="input h-20 resize-none"
              disabled={isReadonly}
              value={values.followUpResponse}
              onChange={(e) =>
                setValues((p) => ({ ...p, followUpResponse: e.target.value }))
              }
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 mt-1">
              {values.followUpResponse.length}/1000
            </p>
          </div>
        )}

        {/* Key Learnings */}
        <div>
          <label htmlFor="keyLearnings" className="label">
            Key Learning Highlights{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="keyLearnings"
            className="input h-24 resize-none"
            disabled={isReadonly}
            value={values.keyLearnings}
            onChange={(e) =>
              setValues((p) => ({ ...p, keyLearnings: e.target.value }))
            }
            maxLength={1000}
            placeholder="What were your key takeaways?"
          />
          <p className="text-xs text-gray-400 mt-1">
            {values.keyLearnings.length}/1000
          </p>
        </div>

        {/* Suggested Improvements */}
        <div>
          <label htmlFor="suggestedImprovements" className="label">
            Suggested Improvements{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="suggestedImprovements"
            className="input h-24 resize-none"
            disabled={isReadonly}
            value={values.suggestedImprovements}
            onChange={(e) =>
              setValues((p) => ({
                ...p,
                suggestedImprovements: e.target.value,
              }))
            }
            maxLength={1000}
            placeholder="How could this training be improved?"
          />
          <p className="text-xs text-gray-400 mt-1">
            {values.suggestedImprovements.length}/1000
          </p>
        </div>

        {!isReadonly && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              {saving ? "Saving draft..." : saveStatusText}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="btn-secondary text-sm"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-sm"
              >
                {submitting ? "Submitting..." : "Submit Feedback →"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
