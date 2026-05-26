import { X } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card flex items-start gap-4">
      {Icon && <div className={`p-3 rounded-xl ${colors[color]}`}><Icon size={22} /></div>}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    Active: 'badge-green', Open: 'badge-blue', Closed: 'badge-gray',
    'Closed-Override': 'badge-yellow', Cancelled: 'badge-red', Completed: 'badge-green',
    Submitted: 'badge-green', Draft: 'badge-yellow', Archived: 'badge-gray',
    Internal: 'badge-blue', External: 'badge-purple',
    Admin: 'badge-purple', Maverick: 'badge-blue', Supervisor: 'badge-green',
    Positive: 'badge-green', Neutral: 'badge-yellow', Negative: 'badge-red',
    Technical: 'badge-blue', SoftSkills: 'badge-green', Blended: 'badge-purple',
  };
  return <span className={map[status] || 'badge-gray'}>{status}</span>;
}

export function StarRating({ value, onChange, max = 5, readonly = false }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button key={star} type="button" disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Table({ columns, data, emptyMsg = 'No data found' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{columns.map((c) => <th key={c.key} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0
            ? <tr><td colSpan={columns.length} className="text-center py-10 text-gray-400">{emptyMsg}</td></tr>
            : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((c) => <td key={c.key} className="px-4 py-3 text-gray-700">{c.render ? c.render(row) : row[c.key]}</td>)}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CompletionBar({ pct, threshold = 75 }) {
  const color = pct >= threshold ? 'bg-green-500' : pct >= threshold * 0.7 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{pct}% complete</span>
        <span>Target: {threshold}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
