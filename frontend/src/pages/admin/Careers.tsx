import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Clock,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Briefcase,
  Star,
} from 'lucide-react';
import { auth } from '../../lib/api';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salaryRange?: string;
  isActive: boolean;
  isHot: boolean;
  applicationDeadline?: string;
  positionsAvailable: number;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  creator: {
    name: string;
    email: string;
  };
  applicationStats: {
    total: number;
    pending: number;
    reviewing: number;
    shortlisted: number;
    hired: number;
  };
}

interface CareerStats {
  overview: {
    activeJobs: number;
    inactiveJobs: number;
    totalApplications: number;
    pendingApplications: number;
    shortlistedApplications: number;
    hiredCandidates: number;
    scheduledInterviews: number;
    completedInterviews: number;
  };
  recentApplications: Array<{
    id: string;
    applicantName: string;
    jobPosting: {
      title: string;
      department: string;
    };
    appliedAt: string;
    status: string;
  }>;
  departmentStats: Array<{
    department: string;
    count: number;
  }>;
}

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [stats, setStats] = useState<CareerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const departments = [
    'Research & Development',
    'Sales & Marketing',
    'Quality Assurance',
    'Marketing',
    'Operations',
    'HR',
    'Finance',
    'IT'
  ];

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, departmentFilter, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await fetch('/api/careers/admin/stats', {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      // Load jobs
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const jobsResponse = await fetch(`/api/careers/admin/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.jobs);
        setTotalPages(jobsData.pagination.totalPages);
      } else {
        setError('Failed to load jobs');
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading career data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/careers/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });
      
      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
      } else {
        alert('Failed to delete job posting');
      }
    } catch (err) {
      alert('Failed to delete job posting');
      console.error('Error deleting job:', err);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/careers/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        const updatedJob = await response.json();
        setJobs(jobs.map(job => 
          job.id === jobId ? { ...job, isActive: updatedJob.job.isActive } : job
        ));
      } else {
        alert('Failed to update job status');
      }
    } catch (err) {
      alert('Failed to update job status');
      console.error('Error updating job status:', err);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Career Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Career Management</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage job postings and applications</p>
        </div>
        <Link
          to="/admin/careers/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Jobs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overview.activeJobs}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Applications</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overview.totalApplications}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pending Applications</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overview.pendingApplications}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Hired Candidates</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overview.hiredCandidates}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs by title, department, or description..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Job Postings</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {job.isHot && (
                          <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {job.title}
                          </p>
                          {job.isHot && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              HOT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {job.jobType}
                          </span>
                          {job.salaryRange && (
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {job.salaryRange}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-900 dark:text-white">{job.department}</span>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {job.experienceLevel}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {job.applicationStats.total}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">total</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs">
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {job.applicationStats.pending} pending
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        {job.applicationStats.hired} hired
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleJobStatus(job.id, job.isActive)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                          job.isActive ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            job.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="ml-3 text-sm">
                        <span className={`font-medium ${job.isActive ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/careers/applications?jobId=${job.id}`}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View Applications"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/careers/edit/${job.id}`}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit Job"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
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
      </div>

      {/* Quick Stats */}
      {stats && stats.recentApplications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {stats.recentApplications.map((application) => (
              <div key={application.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {application.applicantName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applied for {application.jobPosting.title} • {application.jobPosting.department}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    application.status === 'hired' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
                  }`}>
                    {application.status}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Link
              to="/admin/careers/applications"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All Applications →
            </Link>
          </div>
        </div>
      )}

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
