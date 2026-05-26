import { useEffect, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import api from '../../api';
import { PageHeader, Table } from '../../components/UI.jsx';
import toast from 'react-hot-toast';

export default function Reports() {
  const [filters, setFilters] = useState({ courseId: '', trainerId: '', dateFrom: '', dateTo: '' });
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data));
    api.get('/trainers').then(r => setTrainers(r.data));
  }, []);

  const buildParams = () => {
    const p = new URLSearchParams();
    if (filters.courseId) p.set('courseId', filters.courseId);
    if (filters.trainerId) p.set('trainerId', filters.trainerId);
    if (filters.dateFrom) p.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) p.set('dateTo', filters.dateTo);
    return p.toString();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/analytics/report?${buildParams()}`);
      setData(res.data);
      if (res.data.length === 0) toast('No data found for selected filters', { icon: 'ℹ️' });
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/analytics/report?${buildParams()}&format=${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
    } catch { toast.error('Export failed'); }
  };

  const columns = [
    { key: 'Course', label: 'Course' },
    { key: 'Trainer', label: 'Trainer' },
    { key: 'Start Date', label: 'Start Date' },
    { key: 'Enrolled', label: 'Enrolled' },
    { key: 'Submitted', label: 'Submitted' },
    { key: 'Completion %', label: 'Completion %' },
    { key: 'Avg Rating', label: 'Avg Rating' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export training reports" />

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Filter size={16} />Filters</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Course</label>
            <select className="input" value={filters.courseId} onChange={e => setFilters(p => ({ ...p, courseId: e.target.value }))}>
              <option value="">All courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trainer</label>
            <select className="input" value={filters.trainerId} onChange={e => setFilters(p => ({ ...p, trainerId: e.target.value }))}>
              <option value="">All trainers</option>
              {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="label">From Date</label><input className="input" type="date" value={filters.dateFrom} onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))} /></div>
          <div><label className="label">To Date</label><input className="input" type="date" value={filters.dateTo} onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))} /></div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {data.length > 0 && (
            <>
              <button onClick={() => handleExport('excel')} className="btn-secondary flex items-center gap-2"><Download size={14} />Excel</button>
            </>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div className="card">
          <p className="text-sm text-gray-500 mb-4">{data.length} session(s) found</p>
          <Table columns={columns} data={data} />
        </div>
      )}
    </div>
  );
}

