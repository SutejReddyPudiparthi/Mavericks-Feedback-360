import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "../../api";
import { Badge, Modal, Table, PageHeader } from "../../components/UI.jsx";
import toast from "react-hot-toast";

const DOMAINS = [
  "Java",
  "Python",
  "Cloud",
  "AI/ML",
  "DevOps",
  "Soft Skills",
  "Agile",
  "Leadership",
  "Other",
];

// ── Courses ───────────────────────────────────────────────
export function CoursesList() {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "Technical",
    trainerType: "Internal",
    domain: "Java",
    objectives: "",
    durationDays: "",
  });

  useEffect(() => {
    api.get("/master/courses").then((r) => setCourses(r.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      type: "Technical",
      trainerType: "Internal",
      domain: "Java",
      objectives: "",
      durationDays: "",
    });
    setShowModal(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      type: c.type,
      trainerType: c.trainerType,
      domain: c.domain,
      objectives: c.objectives,
      durationDays: c.durationDays,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { data } = await api.put(`/master/courses/${editing.id}`, {
          ...form,
          durationDays: +form.durationDays,
        });
        setCourses((p) => p.map((c) => (c.id === editing.id ? data : c)));
        toast.success("Course updated");
      } else {
        const { data } = await api.post("/master/courses", {
          ...form,
          durationDays: +form.durationDays,
        });
        setCourses((p) => [data, ...p]);
        toast.success("Course created");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed");
    }
  };

  const handleArchive = async (c) => {
    try {
      await api.patch(`/master/courses/${c.id}/status`, {
        status: c.status === "Active" ? "Archived" : "Active",
      });
      setCourses((p) =>
        p.map((x) =>
          x.id === c.id
            ? { ...x, status: x.status === "Active" ? "Archived" : "Active" }
            : x,
        ),
      );
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed");
    }
  };

  const columns = [
    { key: "name", label: "Course Name" },
    { key: "type", label: "Type", render: (r) => <Badge status={r.type} /> },
    { key: "domain", label: "Domain" },
    {
      key: "durationDays",
      label: "Duration",
      render: (r) => `${r.durationDays} days`,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(r)}
            className="text-brand-600 hover:underline text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleArchive(r)}
            className="text-gray-500 hover:underline text-sm"
          >
            {r.status === "Active" ? "Archive" : "Restore"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Master"
        subtitle="Manage training courses"
        action={
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Course
          </button>
        }
      />
      <Table columns={columns} data={courses} />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Course" : "New Course"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Course Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select
                className="input"
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
              >
                {["Technical", "SoftSkills", "Blended"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Trainer Type *</label>
              <select
                className="input"
                value={form.trainerType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, trainerType: e.target.value }))
                }
              >
                {["Internal", "External"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Domain *</label>
              <select
                className="input"
                value={form.domain}
                onChange={(e) =>
                  setForm((p) => ({ ...p, domain: e.target.value }))
                }
              >
                {DOMAINS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Duration (days) *</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationDays: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Learning Objectives *</label>
            <textarea
              className="input h-20 resize-none"
              value={form.objectives}
              onChange={(e) =>
                setForm((p) => ({ ...p, objectives: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Trainers ──────────────────────────────────────────────
export function TrainersList() {
  const [trainers, setTrainers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    organisation: "",
    domain: "Java",
    engagementType: "Internal",
  });

  useEffect(() => {
    api.get("/master/trainers").then((r) => setTrainers(r.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      organisation: "",
      domain: "Java",
      engagementType: "Internal",
    });
    setShowModal(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      organisation: t.organisation || "",
      domain: t.domain,
      engagementType: t.engagementType,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { data } = await api.put(`/master/trainers/${editing.id}`, form);
        setTrainers((p) => p.map((t) => (t.id === editing.id ? data : t)));
        toast.success("Trainer updated");
      } else {
        const { data } = await api.post("/master/trainers", form);
        setTrainers((p) => [data, ...p]);
        toast.success("Trainer created");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || "Failed");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "organisation",
      label: "Organisation",
      render: (r) => r.organisation || "—",
    },
    { key: "domain", label: "Domain" },
    {
      key: "engagementType",
      label: "Type",
      render: (r) => <Badge status={r.engagementType} />,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button
          onClick={() => openEdit(r)}
          className="text-brand-600 hover:underline text-sm"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainer & Vendor Master"
        subtitle="Manage trainers and vendors"
        action={
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Trainer
          </button>
        }
      />
      <Table columns={columns} data={trainers} />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Trainer" : "New Trainer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Organisation</label>
            <input
              className="input"
              value={form.organisation}
              onChange={(e) =>
                setForm((p) => ({ ...p, organisation: e.target.value }))
              }
              placeholder="For external trainers"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Domain *</label>
              <select
                className="input"
                value={form.domain}
                onChange={(e) =>
                  setForm((p) => ({ ...p, domain: e.target.value }))
                }
              >
                {DOMAINS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Engagement Type *</label>
              <select
                className="input"
                value={form.engagementType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, engagementType: e.target.value }))
                }
              >
                {["Internal", "External"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
