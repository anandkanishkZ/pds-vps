import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { auth, type DealershipInquiry, listDealershipInquiries, getDealershipInquiryStats, updateDealershipInquiry, deleteDealershipInquiry, type DealershipInquiryStats } from '../../lib/api';
import { RefreshCw, Search, Mail, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const statusColors: Record<string, string> = { new: 'bg-amber-500', in_progress: 'bg-blue-500', resolved: 'bg-emerald-500', closed: 'bg-slate-500' };
const priorityColors: Record<string, string> = { low: 'bg-slate-400', medium: 'bg-sky-500', high: 'bg-orange-500', urgent: 'bg-red-600' };

const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleString() : '—';

// Skeleton Components
const SkeletonCard: React.FC = () => (
  <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-16"></div>
    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
  </div>
);

const SkeletonTableRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
    </td>
  </tr>
);

const LoadingSkeleton: React.FC = () => (
  <div className="p-6 space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    
    {/* Filters skeleton */}
    <div className="flex flex-wrap items-center gap-3">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-32 animate-pulse"></div>
    </div>
    
    {/* Table skeleton */}
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Company</th>
            <th className="px-4 py-3 text-left font-semibold">Contact</th>
            <th className="px-4 py-3 text-left font-semibold">Priority</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">IP</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DealershipInquiryModal: React.FC<{ inquiry: DealershipInquiry; onClose: () => void; onUpdate: (patch: Partial<DealershipInquiry>) => void; onDelete: () => void; updating: boolean; deleting: boolean; }> = ({ inquiry, onClose, onUpdate, onDelete, updating, deleting }) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Portal content
  const modalContent = (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[100]" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <motion.div 
          className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" 
          onClick={onClose}
          initial={{opacity:0}} 
          animate={{opacity:1}} 
          exit={{opacity:0}}
        />
        <motion.div 
          className="relative w-full max-w-4xl mx-auto h-[90vh] mt-8 flex items-stretch px-4" 
          initial={{opacity:0, y:30, scale:.96}} 
          animate={{opacity:1, y:0, scale:1}} 
          exit={{opacity:0, y:20, scale:.95}} 
          transition={{type:'spring', stiffness:220, damping:24}}
        >
          <div className="w-full bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Dealership Inquiry</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition" aria-label="Close">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Company</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1"><Building2 className="h-4 w-4" /> {inquiry.companyName}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Contact Person</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.contactPerson}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Email</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100 break-all">{inquiry.email}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Phone</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Location</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.location || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Business Type</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.businessType || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Monthly Volume</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.monthlyVolume || '—'}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-medium">Years In Business</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{inquiry.yearsInBusiness ?? '—'}</div>
                </div>
              </div>
              {inquiry.message && (
                <div className="text-sm">
                  <div className="text-slate-500 mb-2 font-medium">Message</div>
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{inquiry.message}</div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={`px-2.5 py-1 rounded-full font-medium text-white ${statusColors[inquiry.status]}`}>{inquiry.status.replace('_',' ')}</span>
                <span className={`px-2.5 py-1 rounded-full font-medium text-white ${priorityColors[inquiry.priority]}`}>{inquiry.priority}</span>
                {inquiry.ipAddress && <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium border border-blue-200 dark:border-blue-700">IP {inquiry.ipAddress}</span>}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
                <div>Created: {formatDate(inquiry.createdAt)}</div>
                <div>Updated: {formatDate(inquiry.updatedAt)}</div>
                {(inquiry as any).resolvedAt && <div>Resolved: {formatDate((inquiry as any).resolvedAt)}</div>}
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4">
              <div className="flex gap-3 flex-wrap">
                {inquiry.status !== 'resolved' && inquiry.status !== 'closed' && (
                  <button disabled={updating} onClick={()=>onUpdate({ status: 'in_progress' })} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">{updating? 'Updating...' : 'Mark In Progress'}</button>
                )}
                {inquiry.status !== 'resolved' && (
                  <button disabled={updating} onClick={()=>onUpdate({ status: 'resolved' })} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold">{updating? 'Updating...' : 'Resolve'}</button>
                )}
                <button disabled={deleting} onClick={onDelete} className="ml-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold">{deleting? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Render to portal at document.body level to escape layout constraints
  return createPortal(modalContent, document.body);
};

const DealershipInquiriesPage: React.FC = () => {
  const [items, setItems] = useState<DealershipInquiry[]>([]);
  const [stats, setStats] = useState<DealershipInquiryStats | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DealershipInquiry | null>(null);
  const [modalUpdating, setModalUpdating] = useState(false);
  const [modalDeleting, setModalDeleting] = useState(false);

  const fetchAll = async () => {
    const token = auth.getToken();
    if (!token) return;
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        listDealershipInquiries(token, { page, pageSize, search, status: statusFilter, priority: priorityFilter }),
        getDealershipInquiryStats(token)
      ]);
      setItems(listRes.data);
      setTotalPages(listRes.pagination.pages);
      setStats(statsRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchAll(); /* eslint-disable-next-line */ }, [page, search, statusFilter, priorityFilter]);

  const handleUpdate = async (patch: Partial<DealershipInquiry>) => {
    if (!selected) return;
    const token = auth.getToken();
    if (!token) return;
    try { setModalUpdating(true); const res = await updateDealershipInquiry(token, selected.id, patch as any); setSelected(res.inquiry); setItems(prev => prev.map(i => i.id === res.inquiry.id ? res.inquiry : i)); toast.success('Updated'); fetchAll(); } catch (e:any) { toast.error(e.message || 'Update failed'); } finally { setModalUpdating(false); }
  };
  const handleDelete = async () => {
    if (!selected) return; const token = auth.getToken(); if (!token) return;
    if (!confirm('Delete this inquiry?')) return;
    try { setModalDeleting(true); await deleteDealershipInquiry(token, selected.id); toast.success('Deleted'); setSelected(null); fetchAll(); } catch (e:any) { toast.error(e.message || 'Delete failed'); } finally { setModalDeleting(false); }
  };

  // Show skeleton loading on initial load
  if (loading && items.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dealership Inquiries</h1>
        <button 
          onClick={fetchAll} 
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 text-sm font-medium shadow-sm transition-opacity"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {loading && !stats ? (
        // Show skeleton stats while loading
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : stats && (
        // Show actual stats
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'New', value: stats.byStatus.new },
            { label: 'Unresolved', value: stats.unresolved },
            { label: 'Urgent', value: stats.byPriority.urgent }
          ].map(k => (
            <div key={k.label} className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1">{k.label}</div>
              <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">{k.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e=>{ setPage(1); setSearch(e.target.value); }} placeholder="Search..." className="pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e=>{ setPage(1); setStatusFilter(e.target.value); }} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm">
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={e=>{ setPage(1); setPriorityFilter(e.target.value); }} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      {error && <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-medium">{error}</div>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Company</th>
              <th className="px-4 py-3 text-left font-semibold">Contact</th>
              <th className="px-4 py-3 text-left font-semibold">Priority</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">IP</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading && items.length === 0 ? (
              // Show skeleton rows while loading
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={`skeleton-${i}`} />
              ))
            ) : (
              // Show actual data
              items.map(inquiry => (
                <tr key={inquiry.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-colors" onClick={()=>setSelected(inquiry)}>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {inquiry.companyName}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{inquiry.contactPerson}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${priorityColors[inquiry.priority]}`}>{inquiry.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${statusColors[inquiry.status]}`}>{inquiry.status.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">{inquiry.ipAddress || '–'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(inquiry.createdAt)}</td>
                </tr>
              ))
            )}
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 text-sm">No inquiries found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-200 text-xs font-medium">Prev</button>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Page {page} / {totalPages}</div>
          <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-800 dark:text-slate-200 text-xs font-medium">Next</button>
        </div>
      )}
      <AnimatePresence>{selected && (
        <DealershipInquiryModal inquiry={selected} onClose={()=>setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} updating={modalUpdating} deleting={modalDeleting} />
      )}</AnimatePresence>
    </div>
  );
};

export default DealershipInquiriesPage;
