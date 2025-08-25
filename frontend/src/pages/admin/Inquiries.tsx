import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Phone,
  Building2,
  MessageSquare,
  Flag,
  Globe,
  Layers,
  ShieldAlert,
  X
} from 'lucide-react';
import { listInquiries, updateInquiry, deleteInquiry, getInquiryStats, auth, type Inquiry, type InquiryStats } from '../../lib/api';
import { toast } from 'react-toastify';

// Skeleton Components
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 w-9 h-9"></div>
      <div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 mb-2"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8"></div>
      </div>
    </div>
  </div>
);

const SkeletonTableRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-3 sm:px-6 py-4 w-1/4 min-w-[200px]">
      <div className="max-w-[200px]">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-1"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
      </div>
    </td>
    <td className="px-3 sm:px-6 py-4 w-1/3 min-w-[250px]">
      <div className="max-w-[250px]">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-1"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-56"></div>
      </div>
    </td>
    <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-[120px]">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
    </td>
    <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-[100px]">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
    </td>
    <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-[140px]">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28"></div>
    </td>
    <td className="px-3 sm:px-6 py-4 whitespace-nowrap w-[100px]">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </td>
  </tr>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
      </div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse"></div>
    </div>

    {/* Statistics Cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Search and filters skeleton */}
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 animate-pulse"></div>
      </div>
    </div>

    {/* Table skeleton */}
    <div className="bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject & Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Shared helper utilities (placed before modal so they're in scope)
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'new': return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Enhanced Modal Component using Portal
interface InquiryDetailModalProps {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusChange: (inquiry: Inquiry, status: string) => void;
  onDelete: (inquiry: Inquiry) => void;
  updating: string | null;
}

const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({ 
  inquiry, 
  onClose, 
  onStatusChange, 
  onDelete, 
  updating 
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Portal content
  const modalContent = (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" 
        onClick={onClose}
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
      />
      <motion.div 
        className="relative w-full max-w-5xl max-h-[90vh] flex items-stretch" 
        initial={{ opacity: 0, y: 30, scale: 0.96 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 20, scale: 0.95 }} 
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-50/10 overflow-hidden border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h2 className="text-sm font-semibold tracking-wide uppercase">Customer Inquiry</h2>
                <p className="text-xs text-white/90">{inquiry.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                {getStatusIcon(inquiry.status)} {inquiry.status.replace('_', ' ')}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                <Flag className="h-3 w-3" /> {inquiry.priority}
              </span>
              <button 
                onClick={onClose} 
                className="p-2 rounded-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left main */}
                <div className="lg:col-span-2 space-y-6">
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50/60 dark:bg-slate-800/40">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Contact Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{inquiry.name}</p>
                        <a href={`mailto:${inquiry.email}`} className="text-brand-600 dark:text-brand-400 hover:underline break-all inline-flex items-center gap-1 transition-colors"><Mail className="h-4 w-4" /> {inquiry.email}</a>
                        {inquiry.phone && <a href={`tel:${inquiry.phone}`} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 inline-flex items-center gap-1 transition-colors"><Phone className="h-4 w-4" /> {inquiry.phone}</a>}
                        {inquiry.company && <div className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"><Building2 className="h-3 w-3" /> {inquiry.company}</div>}
                      </div>
                      <div className="space-y-2">
                        {inquiry.ipAddress && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Globe className="h-4 w-4" /> <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded">{inquiry.ipAddress}</code></div>}
                        {inquiry.userAgent && (
                          <div className="text-[10px] leading-snug text-slate-500 dark:text-slate-400 max-h-20 overflow-y-auto pr-1 border-l border-slate-200 dark:border-slate-700 pl-2 bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                            {inquiry.userAgent}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(inquiry.createdAt)}</div>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Message</h3>
                      {inquiry.subject && <span className="text-[11px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 inline-flex items-center gap-1"><Layers className="h-3 w-3" /> {inquiry.subject}</span>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{inquiry.message}</p>
                    </div>
                  </section>
                </div>
                {/* Right sidebar */}
                <div className="space-y-6">
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status & Priority</h3>
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-medium ${getStatusColor(inquiry.status)}`}>
                          {getStatusIcon(inquiry.status)} {inquiry.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Priority</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-medium ${getPriorityColor(inquiry.priority)}`}>
                          <Flag className="h-3 w-3" /> {inquiry.priority}
                        </span>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Risk Signals</h3>
                    {renderFlags(inquiry)}
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                      {inquiry.status !== 'in_progress' && inquiry.status !== 'resolved' && (
                        <button 
                          onClick={() => onStatusChange(inquiry, 'in_progress')} 
                          disabled={updating === inquiry.id} 
                          className="h-10 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white text-xs font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                        >
                          Mark In Progress
                        </button>
                      )}
                      {inquiry.status !== 'resolved' && (
                        <button 
                          onClick={() => onStatusChange(inquiry, 'resolved')} 
                          disabled={updating === inquiry.id} 
                          className="h-10 rounded-lg bg-green-600/90 hover:bg-green-600 text-white text-xs font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {inquiry.status !== 'closed' && (
                        <button 
                          onClick={() => onStatusChange(inquiry, 'closed')} 
                          disabled={updating === inquiry.id} 
                          className="h-10 rounded-lg bg-slate-600/90 hover:bg-slate-600 text-white text-xs font-medium disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                        >
                          Close Inquiry
                        </button>
                      )}
                      <button 
                        onClick={() => onDelete(inquiry)} 
                        className="h-10 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-md"
                      >
                        Delete Inquiry
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <AlertCircle className="h-3 w-3" /> 
                      All actions are logged immediately
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );

  // Render to portal at document.body level to escape layout constraints
  return createPortal(modalContent, document.body);
};

const Inquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInquiries = useCallback(async () => {
    const token = auth.getToken();
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }
    
    try {
      setLoading(true);
      const [inquiriesResult, statsResult] = await Promise.all([
        listInquiries(token, {
          page: currentPage,
          pageSize,
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter,
          assignedTo: assignedFilter,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }),
        getInquiryStats(token)
      ]);

      setInquiries(inquiriesResult.data);
      setTotalPages(inquiriesResult.pagination.pages);
      setTotalCount(inquiriesResult.pagination.total);
      setStats(statsResult);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inquiries';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, priorityFilter, assignedFilter, pageSize]);

  useEffect(() => {
    fetchInquiries();
  }, [currentPage, searchTerm, statusFilter, priorityFilter, assignedFilter]);

  const handleStatusChange = useCallback(async (inquiry: Inquiry, newStatus: string) => {
    const token = auth.getToken();
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      setUpdating(inquiry.id);
      const result = await updateInquiry(token, inquiry.id, { status: newStatus });
      
      // Update the inquiry in the list
      setInquiries(prev => prev.map(inq => 
        inq.id === inquiry.id ? result.inquiry : inq
      ));
      
      // Refresh stats
      const newStats = await getInquiryStats(token);
      setStats(newStats);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inquiry';
      setError(errorMessage);
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  }, []);

  const handleDelete = useCallback(async (inquiry: Inquiry) => {
    const token = auth.getToken();
    if (!token) {
      toast.error('Authentication required');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete this inquiry from ${inquiry.name}?`)) {
      return;
    }
    
    try {
      setDeleting(inquiry.id);
      await deleteInquiry(token, inquiry.id);
      
      // Remove from list
      setInquiries(prev => prev.filter(inq => inq.id !== inquiry.id));
      
      // Refresh stats
      const newStats = await getInquiryStats(token);
      setStats(newStats);
      toast.success('Inquiry deleted successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete inquiry';
      setError(errorMessage);
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInquiries();
  }, [fetchInquiries]);

  // Memoized filtered and sorted data for better performance
  const filteredInquiries = useMemo(() => {
    return inquiries; // Already filtered by backend
  }, [inquiries]);

  // Memoized stats cards for better performance
  const statsCards = useMemo(() => {
    if (!stats) return null;
    
    return [
      {
        title: 'Total Inquiries',
        value: stats.total,
        icon: Mail,
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400'
      },
      {
        title: 'Unresolved',
        value: stats.unresolved,
        icon: AlertCircle,
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-600 dark:text-red-400'
      },
      {
        title: 'In Progress',
        value: stats.byStatus.in_progress,
        icon: Clock,
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-600 dark:text-yellow-400'
      },
      {
        title: 'Resolved',
        value: stats.byStatus.resolved,
        icon: CheckCircle,
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400'
      }
    ];
  }, [stats]);

  // Show skeleton loading on initial load
  if (loading && inquiries.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            Customer Inquiries
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
            Manage and respond to customer contact form submissions
          </p>
          {stats && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>Total: {stats.total}</span>
              <span>•</span>
              <span>Unresolved: {stats.unresolved}</span>
              <span>•</span>
              <span>Today: {stats.byStatus.new}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => fetchInquiries()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-sm disabled:opacity-50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 hover:shadow-md"
          >
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{loading ? 'Loading...' : 'View All'}</span>
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {loading && !stats ? (
        // Show skeleton stats while loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : statsCards && (
        // Show actual stats with improved animation
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
        >
          {statsCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Filters */}
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm w-full min-w-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 placeholder:text-slate-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md w-full sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              {loading ? 'Filtering...' : 'Apply Filters'}
            </button>
          </div>
          
          {/* Active Filters Display */}
          {(searchTerm || statusFilter || priorityFilter) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs">
                  Search: <span className="max-w-[100px] truncate">{searchTerm}</span>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="hover:text-brand-900 dark:hover:text-brand-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                  Status: {statusFilter.replace('_', ' ')}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('')}
                    className="hover:text-blue-900 dark:hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {priorityFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                  Priority: {priorityFilter}
                  <button
                    type="button"
                    onClick={() => setPriorityFilter('')}
                    className="hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </form>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error occurred
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inquiries Table */}
      <motion.div 
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full min-w-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] align-middle">
            <table className="w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '25%', minWidth: '200px' }}>Contact</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '30%', minWidth: '250px' }}>Subject</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '15%', minWidth: '120px' }}>Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '12%', minWidth: '100px' }}>Priority</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '13%', minWidth: '140px' }}>Date</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '5%', minWidth: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading && filteredInquiries.length === 0 ? (
                  // Show skeleton rows while loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={`skeleton-${i}`} />
                  ))
                ) : (
                  // Show actual data with improved animations
                  filteredInquiries.map((inquiry, index) => (
                    <motion.tr 
                      key={inquiry.id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-4 sm:px-6 py-4" style={{ width: '25%', minWidth: '200px' }}>
                        <div className="max-w-[180px]">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{inquiry.name}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">{inquiry.email}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {inquiry.company && (
                              <div className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 max-w-[100px] truncate">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{inquiry.company}</span>
                              </div>
                            )}
                            {inquiry.ipAddress && (
                              <div className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 inline-flex items-center gap-1" title="Origin IP">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span className="font-mono text-[9px]">{inquiry.ipAddress}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4" style={{ width: '30%', minWidth: '250px' }}>
                        <div className="max-w-[230px]">
                          <div className="text-sm text-slate-900 dark:text-slate-100 truncate">
                            {inquiry.subject || 'No subject'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {inquiry.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap" style={{ width: '15%', minWidth: '120px' }}>
                        <div className="relative">
                          <select
                            value={inquiry.status}
                            onChange={(e) => handleStatusChange(inquiry, e.target.value)}
                            disabled={updating === inquiry.id}
                            className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-brand-500 w-full max-w-[100px] ${getStatusColor(inquiry.status)}`}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          {updating === inquiry.id && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap" style={{ width: '12%', minWidth: '100px' }}>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                          <Flag className="h-3 w-3" />
                          <span className="hidden sm:inline">{inquiry.priority}</span>
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400" style={{ width: '13%', minWidth: '140px' }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs truncate">{formatDate(inquiry.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ width: '5%', minWidth: '100px' }}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setShowDetail(true);
                            }}
                            className="text-brand-600 hover:text-brand-500 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
                            title="View Details"
                            aria-label={`View details for inquiry from ${inquiry.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inquiry)}
                            disabled={deleting === inquiry.id}
                            className="text-red-600 hover:text-red-500 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 transition-colors"
                            title="Delete inquiry"
                            aria-label={`Delete inquiry from ${inquiry.name}`}
                          >
                            {deleting === inquiry.id ? (
                              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredInquiries.length === 0 && !loading && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Mail className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">No inquiries</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || statusFilter || priorityFilter ? 'No inquiries match your filters.' : 'No inquiries have been submitted yet.'}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div 
          className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-medium">{totalCount}</span> inquiries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Detail Modal - Using Portal for proper positioning */}
      <AnimatePresence>
        {showDetail && selectedInquiry && (
          <InquiryDetailModal 
            inquiry={selectedInquiry}
            onClose={() => {
              setShowDetail(false);
              setSelectedInquiry(null);
            }}
            onStatusChange={handleStatusChange}
            onDelete={(inquiry) => {
              handleDelete(inquiry);
              setShowDetail(false);
              setSelectedInquiry(null);
            }}
            updating={updating}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Helpers for modal enhancements
function renderFlags(inquiry: Inquiry) {
  // Since the Inquiry type doesn't have metadata property,
  // we'll use adminNotes or implement a simple default
  const flags: string[] = [];
  
  // Add some basic flags based on available data
  if (inquiry.priority === 'urgent') {
    flags.push('high_priority');
  }
  if (inquiry.subject && inquiry.subject.toLowerCase().includes('urgent')) {
    flags.push('urgent_keyword');
  }
  
  if (!flags.length) {
    return <div className="text-xs text-slate-500 dark:text-slate-400">No risk signals detected.</div>;
  }
  
  const colorMap: Record<string,string> = {
    high_priority: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    urgent_keyword: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    duplicate_content: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {flags.map(f => (
        <span key={f} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${colorMap[f] || 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300'}`}>
          <ShieldAlert className="h-3 w-3" />{f.replace(/_/g,' ')}
        </span>
      ))}
    </div>
  );
}

export default Inquiries;
