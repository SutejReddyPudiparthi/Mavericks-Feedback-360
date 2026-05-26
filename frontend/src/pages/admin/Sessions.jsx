import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Upload, Download, Eye } from 'lucide-react';
import api from '../../api';
import { Badge, Modal, Table, PageHeader, CompletionBar } from '../../components/UI.jsx';
import toast from 'react-hot-toast';

// ── Sessions List ─────────────────────────────────────────
export function SessionsList() {
  const [sessions, setSessions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [form, setForm] = useState({ courseId: '', trainerId: '', startDate: '', endDate: '', location: '', capacity: '' });

  useEffect(() => {
    api.get('/sessions?pageSize=50').then(r => setSessions(r.data.data));
    api.get('/courses?status=Active').then(r => setCourses(r.data));
    api.get('/trainers').then(r => setTrainers(r.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/sessions', { ...form, capacity: +form.capacity });
      if (data.conflictWarning) toast(data.conflictWarning, { icon: '⚠️' });
      else toast.success('Session created');
      setSessions(prev => [data, ...prev]);
      setShowCreate(false);
      setForm({ courseId: '', trainerId: '', startDate: '', endDate: '', location: '', capacity: '' });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
  };

  const columns = [
    { key: 'course', label: 'Course', render: r => r.course?.name },
    { key: 'trainer', label: 'Trainer', render: r => r.trainer?.name },
    { key: 'startDate', label: 'Start', render: r => new Date(r.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End', render: r => new Date(r.endDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'actions', label: '', render: r => <Link to={`/admin/sessions/${r.id}`} className="text-brand-600 hover:underline text-sm flex items-center gap-1"><Eye size={14} />View</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sessions" subtitle="Manage training sessions"
        action={<button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />New Session</button>} />
      <Table columns={columns} data={sessions} emptyMsg="No sessions found" />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Session">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Course *</label>
            <select className="input" value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} required>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trainer *</label>
            <select className="input" value={form.trainerId} onChange={e => setForm(p => ({ ...p, trainerId: e.target.value }))} required>
              <option value="">Select trainer</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.engagementType})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start Date *</label><input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required /></div>
            <div><label className="label">End Date *</label><input className="input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required /></div>
          </div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Room / Virtual link" /></div>
          <div><label className="label">Capacity *</label><input className="input" type="number" min="1" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} required /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Create Session</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Session Detail ────────────────────────────────────────
export function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('roster');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [cycleData, setCycleData] = useState(null);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => {
      setSession(r.data);
      const mCycle = r.data.cycles?.find(c => c.cycleType === 'Maverick');
      if (mCycle) api.get(`/feedback/cycles/${mCycle.id}`).then(cr => setCycleData(cr.data));
    });
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post(`/participants/upload/${id}`, fd);
      setUploadResult(data);
      toast.success(`Imported ${data.imported} participants`);
      api.get(`/sessions/${id}`).then(r => setSession(r.data));
    } catch (err) {
      setUploadResult(err.response?.data);
      toast.error('Upload had errors — check report below');
    } finally { setUploading(false); }
  };

  const handleOverride = async () => {
    if (overrideReason.length < 20) return toast.error('Reason must be at least 20 characters');
    const cycle = session?.cycles?.find(c => c.cycleType === 'Maverick');
    if (!cycle) return;
    try {
      await api.post(`/feedback/cycles/${cycle.id}/close-override`, { reason: overrideReason });
      toast.success('Cycle closed with override');
      setOverrideModal(false);
      api.get(`/feedback/cycles/${cycle.id}`).then(r => setCycleData(r.data));
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
  };

  const handleDownloadTemplate = async () => {
    const res = await api.get('/participants/template', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a'); a.href = url; a.download = 'participant_template.xlsx'; a.click();
  };

  if (!session) return <div className="text-gray-400 text-center py-20">Loading...</div>;

  const tabs = ['roster', 'cycle', 'upload'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={session.course?.name}
        subtitle={`${session.trainer?.name} · ${new Date(session.startDate).toLocaleDateString()} – ${new Date(session.endDate).toLocaleDateString()}`}
        action={<Badge status={session.status} />}
      />

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'cycle' ? 'Feedback Cycle' : t}
          </button>
        ))}
      </div>

      {activeTab === 'roster' && (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">{session.participants?.length || 0} participants enrolled (capacity: {session.capacity})</p>
          <Table
            columns={[
              { key: 'name', label: 'Name', render: r => r.user?.name },
              { key: 'email', label: 'Email', render: r => r.user?.email },
              { key: 'enrolled', label: 'Enrolled', render: r => new Date(r.enrolledAt).toLocaleDateString() },
            ]}
            data={session.participants || []}
          />
        </div>
      )}

      {activeTab === 'cycle' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Maverick Feedback Cycle</h3>
          {cycleData ? (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">{cycleData.completionPct}%</p><p className="text-xs text-gray-500">Completion</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">{cycleData.submitted}</p><p className="text-xs text-gray-500">Submitted</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-2xl font-bold text-gray-900">{cycleData.total}</p><p className="text-xs text-gray-500">Total</p></div>
              </div>
              <CompletionBar pct={cycleData.completionPct} threshold={cycleData.threshold} />
              <div className="flex items-center justify-between">
                <Badge status={cycleData.status} />
                {cycleData.status === 'Open' && (
                  <button onClick={() => setOverrideModal(true)} className="btn-danger text-sm">Close Cycle (Override)</button>
                )}
              </div>
            </>
          ) : <p className="text-gray-400 text-sm">No feedback cycle found for this session.</p>}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upload Participants</h3>
            <button onClick={handleDownloadTemplate} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} />Download Template</button>
          </div>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
            <Upload size={28} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 font-medium">{uploading ? 'Uploading...' : 'Click to upload Excel file'}</p>
            <p className="text-xs text-gray-400 mt-1">Max 1,000 rows · .xlsx format</p>
            <input type="file" accept=".xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {uploadResult && (
            <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-2">
              <p className="font-medium">Result: <span className="text-green-600">{uploadResult.imported} imported</span> · <span className="text-yellow-600">{uploadResult.skipped} skipped</span></p>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-600 mb-1">Errors:</p>
                  {uploadResult.errors.map((e, i) => <p key={i} className="text-xs text-red-500">Row {e.row} · {e.field}: {e.message}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={overrideModal} onClose={() => setOverrideModal(false)} title="Close Cycle (Override)">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">You are closing this cycle before the completion threshold is met. This action is audit-logged.</p>
          <div>
            <label className="label">Reason * (min 20 characters)</label>
            <textarea className="input h-24 resize-none" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Explain why you are closing this cycle early..." />
            <p className="text-xs text-gray-400 mt-1">{overrideReason.length}/20 minimum</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleOverride} className="btn-danger flex-1">Confirm Override</button>
            <button onClick={() => setOverrideModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

