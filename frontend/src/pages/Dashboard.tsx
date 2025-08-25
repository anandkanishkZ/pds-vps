import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, auth } from '../lib/api';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    getDashboard(token)
      .then(setData)
      .catch((e) => setError(e.message || 'Failed to load dashboard'));
  }, [navigate]);

  function logout() {
    auth.clear();
    navigate('/login');
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button onClick={logout} className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">Logout</button>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200 text-sm">{error}</div>
        )}
        {!data && !error && (
          <div className="text-gray-600 dark:text-gray-300">Loading…</div>
        )}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Users</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.users}</div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Products</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.products}</div>
            </div>
            <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Inquiries</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.stats.inquiries}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
