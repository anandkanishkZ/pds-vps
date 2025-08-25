import { useEffect, useState } from 'react';
import { getDashboard, auth, getInquiryStats, listInquiries, listUsers } from '../../lib/api';
import { Users, Package, Mail, AlertCircle, RefreshCw, Activity, Clock, ArrowUpRight, ArrowDownRight, TrendingUp, Shield, Settings, Filter } from 'lucide-react';

interface InquiryStatShape {
  total: number;
  byStatus: { new: number; in_progress: number; resolved: number; closed: number };
  byPriority: { urgent: number; high: number; medium: number; low: number };
  recent?: any[];
}

const skeletonPulse = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded';

type KPI = {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  delta?: number | null;
  help?: string;
};

export default function AdminDashboard() {
  const [core, setCore] = useState<any>(null);
  const [inqStats, setInqStats] = useState<InquiryStatShape | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch dashboard data
  const load = async () => {
    const token = auth.getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [c, is, inqList, userList] = await Promise.all([
        getDashboard(token),
        getInquiryStats(token).catch(() => null),
        listInquiries(token, { page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }).catch(() => ({ data: [] })),
        listUsers(token, { page: 1, pageSize: 5, }).catch(() => ({ data: [] }))
      ]);
      setCore(c);
      setInqStats(is);
      setRecentInquiries(inqList?.data || []);
      setRecentUsers(userList?.data || []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto refresh every 60s if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const kpis: KPI[] = [
    { label: 'Users', value: core?.stats?.users ?? '—', icon: Users, color: 'bg-[#06477f]', help: 'Total registered users.' },
    { label: 'Products', value: core?.stats?.products ?? '—', icon: Package, color: 'bg-emerald-600', help: 'Active products in catalog.' },
    { label: 'Inquiries', value: core?.stats?.inquiries ?? '—', icon: Mail, color: 'bg-amber-400 text-slate-900', help: 'All customer inquiries.' },
    { label: 'New Inquiries', value: core?.stats?.newInquiries ?? '—', icon: AlertCircle, color: 'bg-red-500', help: 'Untriaged inquiries.' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#06477f] dark:text-[#fec216]" /> Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Operational overview & key metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#06477f] hover:bg-[#053961] text-white text-sm font-medium disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} className="rounded border-slate-300 text-[#06477f] focus:ring-[#06477f]" /> Auto 60s
          </label>
          {lastUpdated && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {lastUpdated.toLocaleTimeString()}</div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="text-rose-700 underline decoration-dotted">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map(({ label, value, icon: Icon, color, delta, help }) => (
          <div key={label} className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wide font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {label}
                  {help && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{help}</span>}
                </div>
                <div className="mt-1 text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {loading ? <span className={`${skeletonPulse} h-8 w-16`}></span> : value}
                  {delta != null && (
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${delta > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}> {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {Math.abs(delta)}%</span>
                  )}
                </div>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-inner ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity text-white pointer-events-none">
              <Icon className="h-20 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        {/* Inquiry Status & Priority */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 2xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Filter className="h-4 w-4" /> Inquiries Breakdown</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Live</span>
          </div>
          {/* Status Bars */}
          <div className="space-y-4">
            {['new','in_progress','resolved','closed'].map(status => {
              const total = inqStats?.total || 0;
              const value = inqStats?.byStatus?.[status as keyof typeof inqStats.byStatus] || 0;
              const pct = total ? Math.round((value/total)*100) : 0;
              const colors: Record<string,string> = { new: 'bg-red-500', in_progress:'bg-amber-500', resolved:'bg-emerald-600', closed:'bg-slate-500' };
              return (
                <div key={status}>
                  <div className="flex justify-between text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-1">
                    <span>{status.replace('_',' ')}</span><span>{value}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`${colors[status]} h-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 font-medium">Priority Mix</div>
            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <div className="relative w-28 h-28">
                {(() => {
                  const total = (inqStats?.byPriority?.urgent||0)+(inqStats?.byPriority?.high||0)+(inqStats?.byPriority?.medium||0)+(inqStats?.byPriority?.low||0);
                  const segs: { value:number; color:string; label:string }[] = [
                    { value: inqStats?.byPriority?.urgent||0, color:'#dc2626', label:'Urgent' },
                    { value: inqStats?.byPriority?.high||0, color:'#f59e0b', label:'High' },
                    { value: inqStats?.byPriority?.medium||0, color:'#10b981', label:'Medium' },
                    { value: inqStats?.byPriority?.low||0, color:'#64748b', label:'Low' },
                  ];
                  let cumulative = 0;
                  return (
                    <svg viewBox="0 0 42 42" className="w-28 h-28 -rotate-90">
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
                      {segs.map((s,i)=>{
                        const dash = total? (s.value/total)*100 : 0;
                        const circle = (<circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={s.color} strokeWidth="6" strokeDasharray={`${dash} ${100-dash}`} strokeDashoffset={-cumulative} />);
                        cumulative += dash;
                        return circle;
                      })}
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-700 dark:fill-slate-300 text-[7px] font-semibold rotate-90">{inqStats?.total ?? 0}</text>
                    </svg>
                  );
                })()}
              </div>
              <ul className="flex-1 space-y-1 text-[11px] tracking-wide">
                {['urgent','#dc2626','high','#f59e0b','medium','#10b981','low','#64748b'].reduce<any[]>((acc, cur, idx, arr)=>{
                  if(idx%2===0) acc.push({ key: cur, color: arr[idx+1] });
                  return acc;}, []).map(item => (
                  <li key={item.key} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 capitalize"><span className="h-2 w-2 rounded-full" style={{ background:item.color }} />{item.key}</span>
                    <span className="text-slate-600 dark:text-slate-400">{inqStats?.byPriority?.[item.key as keyof typeof inqStats.byPriority] ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 2xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Mail className="h-4 w-4" /> Recent Inquiries</h2>
            <a href="/admin/inquiries" className="text-xs text-[#06477f] dark:text-[#fec216] hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="py-2 font-medium">Subject</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Priority</th>
                  <th className="py-2 font-medium hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {loading && Array.from({ length: 5 }).map((_,i)=>(
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-40`} /></td>
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-20`} /></td>
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-16`} /></td>
                    <td className="py-3 hidden md:table-cell"><div className={`${skeletonPulse} h-4 w-24`} /></td>
                  </tr>
                ))}
                {!loading && recentInquiries.map((inq: any) => (
                  <tr key={inq.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 pr-4 max-w-xs">
                      <div className="font-medium text-slate-700 dark:text-slate-200 line-clamp-2">{inq.subject || '(No Subject)'}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{inq.email}</div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full capitalize ${
                        inq.status==='new'?'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300':
                        inq.status==='in_progress'?'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300':
                        inq.status==='resolved'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300':
                        'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
                      }`}>{inq.status.replace('_',' ')}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${
                        inq.priority==='urgent'?'bg-red-600 text-white':
                        inq.priority==='high'?'bg-amber-500 text-slate-900':
                        inq.priority==='medium'?'bg-emerald-600 text-white':
                        'bg-slate-500 text-white'
                      }`}>{inq.priority}</span>
                    </td>
                    <td className="py-2 hidden md:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(inq.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!loading && !recentInquiries.length && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No inquiries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Users & System */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Users className="h-4 w-4" /> Recent Users</h2>
            <a href="/admin/users" className="text-xs text-[#06477f] dark:text-[#fec216] hover:underline">Manage users</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="py-2 font-medium">User</th>
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading && Array.from({ length: 5 }).map((_,i)=>(
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-48`} /></td>
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-16`} /></td>
                    <td className="py-3"><div className={`${skeletonPulse} h-4 w-20`} /></td>
                    <td className="py-3 hidden md:table-cell"><div className={`${skeletonPulse} h-4 w-24`} /></td>
                  </tr>
                ))}
                {!loading && recentUsers.map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-2 pr-4 max-w-xs">
                      <div className="font-medium text-slate-700 dark:text-slate-200 truncate">{u.name || '(No Name)'}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                    </td>
                    <td className="py-2 pr-4 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400 font-semibold">{u.role}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full capitalize ${
                        u.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300':
                        u.status==='blocked'?'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300':
                        u.status==='pending'?'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300':
                        'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
                      }`}>{u.status}</span>
                    </td>
                    <td className="py-2 hidden md:table-cell text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!loading && !recentUsers.length && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health / Shortcuts */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Shield className="h-4 w-4" /> System Snapshot</h2>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <ul className="space-y-3 text-xs">
            <li className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Uptime</span><span className="font-semibold text-slate-800 dark:text-slate-200">99.9%</span></li>
            <li className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Avg Response</span><span className="font-semibold text-slate-800 dark:text-slate-200">180ms</span></li>
            <li className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Error Rate</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">0.2%</span></li>
            <li className="flex items-center justify-between"><span className="text-slate-600 dark:text-slate-400">Security Alerts</span><span className="font-semibold text-slate-800 dark:text-slate-200">0</span></li>
          </ul>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-medium mb-3 flex items-center gap-1"><Settings className="h-3 w-3" /> Quick Actions</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Users', href:'/admin/users' },
                { label:'Products', href:'/admin/products' },
                { label:'Inquiries', href:'/admin/inquiries' },
                { label:'Media', href:'/admin/media-library' },
                { label:'Careers', href:'/admin/careers' },
                { label:'Settings', href:'/admin/settings' },
              ].map(a => (
                <a key={a.label} href={a.href} className="text-[11px] font-medium px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#06477f] hover:text-white dark:hover:bg-[#06477f] transition-colors text-center">
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
