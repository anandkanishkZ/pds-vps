import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Eye,
  Star,
  Mail,
  Phone,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { auth } from '../../lib/api';

interface JobApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  experience: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview-scheduled' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  rating?: number;
  notes?: string;
  linkedInProfile?: string;
  portfolioUrl?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  appliedAt: string;
  reviewedAt?: string;
  jobPosting: {
    id: string;
    title: string;
    department: string;
    location: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
  interviews: Array<{
    id: string;
    type: string;
    round: number;
    scheduledAt: string;
    status: string;
  }>;
}

export default function AdminApplicationsPage() {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalApplication, setStatusModalApplication] = useState<JobApplication | null>(null);

  const jobId = searchParams.get('jobId');

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'reviewing', label: 'Reviewing', color: 'blue' },
    { value: 'shortlisted', label: 'Shortlisted', color: 'purple' },
    { value: 'interview-scheduled', label: 'Interview Scheduled', color: 'orange' },
    { value: 'interviewed', label: 'Interviewed', color: 'indigo' },
    { value: 'offered', label: 'Offered', color: 'emerald' },
    { value: 'hired', label: 'Hired', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'slate' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'red' },
  ];

  // Load applications whenever filters or pagination change
  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' });
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (searchTerm) params.append('search', searchTerm);
        if (jobId) params.append('jobId', jobId);

        const response = await fetch(`/api/careers/admin/applications?${params}`, {
          headers: { 'Authorization': `Bearer ${auth.getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to load applications');
        const data = await response.json();
        if (!isCancelled) {
          setApplications(data.applications);
          setTotalPages(data.pagination.totalPages);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) setError('Failed to load applications');
        console.error('Error loading applications:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    load();
    return () => { isCancelled = true; };
  }, [currentPage, statusFilter, priorityFilter, searchTerm, jobId]);

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string, rating?: number, priority?: string) => {
    try {
      const response = await fetch(`/api/careers/admin/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({ status, notes, rating, priority })
      });
      
      if (response.ok) {
        setApplications(applications.map(app => 
          app.id === applicationId 
            ? { ...app, status: status as any, notes, rating, priority: priority as any }
            : app
        ));
        setShowStatusModal(false);
        setStatusModalApplication(null);
      } else {
        alert('Failed to update application status');
      }
    } catch (err) {
      alert('Failed to update application status');
      console.error('Error updating status:', err);
    }
  };

  // Instead of dynamic Tailwind template strings (which lint cannot statically analyze),
  // map status & priority to explicit class name sets.
  const statusClassMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    reviewing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    'interview-scheduled': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    interviewed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    offered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    hired: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  const priorityClassMap: Record<string, string> = {
    low: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  const getStatusClasses = (status: string) => statusClassMap[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
  const getPriorityClasses = (priority: string) => priorityClassMap[priority] || 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';

  const toggleExpanded = (applicationId: string) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const StatusModal = () => {
  const [selectedStatus, setSelectedStatus] = useState<JobApplication['status']>(statusModalApplication?.status || 'pending');
  const [selectedPriority, setSelectedPriority] = useState<JobApplication['priority']>(statusModalApplication?.priority || 'medium');
    const [modalNotes, setModalNotes] = useState(statusModalApplication?.notes || '');
    const [modalRating, setModalRating] = useState(statusModalApplication?.rating || 0);

    if (!statusModalApplication) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Update Application Status
            </h3>
            <button
              onClick={() => setShowStatusModal(false)}
              className="text-slate-400 hover:text-slate-500"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as JobApplication['status'])}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value as JobApplication['priority'])}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Rating (1-5)
              </label>
              <select
                value={modalRating}
                onChange={(e) => setModalRating(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value={0}>No Rating</option>
                {[1, 2, 3, 4, 5].map(rating => (
                  <option key={rating} value={rating}>
                    {rating} Star{rating !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="Add notes about this application..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={() => updateApplicationStatus(
                statusModalApplication.id,
                selectedStatus,
                modalNotes,
                modalRating || undefined,
                selectedPriority
              )}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Applications</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/careers"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Applications</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {jobId ? 'Applications for specific job' : 'All job applications'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {application.applicantName}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityClasses(application.priority)}`}>
                          {application.priority} priority
                        </span>
                        {application.rating && (
                          <div className="flex items-center">
                            {Array.from({ length: application.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Applied for <span className="font-medium">{application.jobPosting.title}</span> • {application.jobPosting.department}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {application.email}
                        </span>
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {application.phone}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(application.status)}`}>
                    {statusOptions.find(s => s.value === application.status)?.label || application.status}
                  </span>
                  
                  <button
                    onClick={() => {
                      setStatusModalApplication(application);
                      setShowStatusModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Update Status"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                  
                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      download={application.resumeFileName}
                      className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400"
                      title="Download Resume"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  
                  <button
                    onClick={() => toggleExpanded(application.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {expandedApplications.has(application.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {expandedApplications.has(application.id) && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Application Details</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Experience:</span> {application.experience}</div>
                        {application.currentSalary && (
                          <div><span className="font-medium">Current Salary:</span> {application.currentSalary}</div>
                        )}
                        {application.expectedSalary && (
                          <div><span className="font-medium">Expected Salary:</span> {application.expectedSalary}</div>
                        )}
                        {application.noticePeriod && (
                          <div><span className="font-medium">Notice Period:</span> {application.noticePeriod}</div>
                        )}
                        {application.linkedInProfile && (
                          <div>
                            <span className="font-medium">LinkedIn:</span>{' '}
                            <a href={application.linkedInProfile} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              Profile
                            </a>
                          </div>
                        )}
                        {application.portfolioUrl && (
                          <div>
                            <span className="font-medium">Portfolio:</span>{' '}
                            <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                              View Portfolio
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Review Information</h4>
                      <div className="space-y-2 text-sm">
                        {application.reviewer && (
                          <div><span className="font-medium">Reviewed by:</span> {application.reviewer.name}</div>
                        )}
                        {application.reviewedAt && (
                          <div><span className="font-medium">Reviewed on:</span> {new Date(application.reviewedAt).toLocaleDateString()}</div>
                        )}
                        {application.interviews.length > 0 && (
                          <div>
                            <span className="font-medium">Interviews:</span> {application.interviews.length} scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {application.coverLetter && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Cover Letter</h4>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                        {application.coverLetter}
                      </div>
                    </div>
                  )}
                  
                  {application.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Notes</h4>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                        {application.notes}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-4">
                    <Link
                      to={`/admin/careers/applications/${application.id}`}
                      className="inline-flex items-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                    <button
                      onClick={() => {
                        setStatusModalApplication(application);
                        setShowStatusModal(true);
                      }}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && <StatusModal />}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
