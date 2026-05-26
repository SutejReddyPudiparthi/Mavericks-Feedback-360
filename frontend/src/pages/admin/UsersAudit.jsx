import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../api';
import { Badge, Modal, Table, PageHeader } from '../../components/UI.jsx';
import toast from 'react-hot-toast';

// ── Users ─────────────────────────────────────────────────
export function UsersList() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', employeeId: '', role: 'Maverick', password: '' });

  useEffect(() => { api.get('/users').then(r => setUsers(r.data.data)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('User created');
      api.get('/users').then(r => setUsers(r.data.data));
      setShowModal(false);
      setForm({ name: '', email: '', mobile: '', employeeId: '', role: 'Maverick', password: '' });
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
  };

  const toggleStatus = async (u) => {
    const status = u.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.patch(`/users/${u.id}/status`, { status });
      setUsers(p => p.map(x => x.id === u.id ? { ...x, status } : x));
      toast.success(`User ${status === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'role', label: 'Role', render: r => <Badge status={r.role} /> },
    { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => toggleStatus(r)} className={`text-sm ${r.status === 'Active' ? 'text-red-500 hover:underline' : 'text-green-600 hover:underline'}`}>
        {r.status === 'Active' ? 'Deactivate' : 'Activate'}
      </button>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Manage platform users and roles"
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />New User</button>} />
      <Table columns={columns} data={users} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div><label className="label">Employee ID *</label><input className="input" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} required /></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
          <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {['Admin', 'Maverick', 'Supervisor'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="label">Password</label><input className="input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Default: Maverick@123" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Create User</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────
export function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', entityType: '', dateFrom: '', dateTo: '' });

  const fetchLogs = () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    api.get(`/audit-logs?${p.toString()}&pageSize=100`).then(r => setLogs(r.data.data));
  };

  useEffect(() => { fetchLogs(); }, []);

  const columns = [
    { key: 'timestamp', label: 'Time', render: r => new Date(r.timestamp).toLocaleString() },
    { key: 'actor', label: 'Actor', render: r => r.actor?.name },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID', render: r => <span className="font-mono text-xs">{r.entityId.slice(0, 12)}…</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle="Immutable record of all admin actions" />
      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div><label className="label">Action</label><input className="input" placeholder="e.g. CREATE" value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} /></div>
          <div><label className="label">Entity Type</label><input className="input" placeholder="e.g. Session" value={filters.entityType} onChange={e => setFilters(p => ({ ...p, entityType: e.target.value }))} /></div>
          <div><label className="label">From</label><input className="input" type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} /></div>
          <div><label className="label">To</label><input className="input" type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} /></div>
        </div>
        <button onClick={fetchLogs} className="btn-primary text-sm mb-4">Apply Filters</button>
        <Table columns={columns} data={logs} emptyMsg="No audit logs found" />
      </div>
    </div>
  );
}

