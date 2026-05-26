import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../api';
import { PageHeader } from '../components/UI.jsx';

export default function Leaderboard() {
  const [type, setType] = useState('Maverick');
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get(`/analytics/leaderboard?type=${type}`).then(r => setData(r.data)).catch(() => setData([]));
  }, [type]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      <PageHeader title="Leaderboard" subtitle="Top performers this quarter" />

      <div className="flex rounded-lg border border-gray-200 w-fit overflow-hidden">
        {['Maverick', 'Trainer'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-6 py-2 text-sm font-medium transition-colors ${type === t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            Top {t}s
          </button>
        ))}
      </div>

      <div className="grid gap-3 max-w-2xl">
        {data.length === 0
          ? <div className="card text-center py-12 text-gray-400">No data available yet. Complete feedback cycles to see rankings.</div>
          : data.map((item, i) => (
            <div key={i} className={`card flex items-center gap-4 ${i === 0 ? 'border-yellow-300 bg-yellow-50' : ''}`}>
              <span className="text-2xl w-10 text-center">{medals[i] || `#${i + 1}`}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {type === 'Trainer' ? `${item.sessionCount} sessions delivered` : `Employee ID: ${item.employeeId}`}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-lg text-gray-900">
                    {type === 'Trainer' ? item.avgRating : item.avgEffectivenessScore}
                  </span>
                </div>
                <p className="text-xs text-gray-400">avg score</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

