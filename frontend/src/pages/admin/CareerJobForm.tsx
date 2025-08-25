import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { auth } from '../../lib/api';

interface JobFormData {
  title: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salaryRange: string;
  isActive: boolean;
  isHot: boolean;
  applicationDeadline: string;
  positionsAvailable: number;
  skills: string[];
}

export default function AdminJobForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: '',
    description: '',
    requirements: [''],
    benefits: [''],
    salaryRange: '',
    isActive: true,
    isHot: false,
    applicationDeadline: '',
    positionsAvailable: 1,
    skills: [''],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const departments = [
    'Research & Development',
    'Sales & Marketing',
    'Quality Assurance',
    'Marketing',
    'Operations',
    'HR',
    'Finance',
    'IT',
    'Customer Service',
    'Legal',
  ];

  const locations = [
    'Kathmandu, Nepal',
    'Pokhara, Nepal',
    'Biratnagar, Nepal',
    'Lalitpur, Nepal',
    'Bharatpur, Nepal',
    'Remote',
    'Hybrid',
  ];

  useEffect(() => {
    if (isEditing) {
      loadJobData();
    }
  }, [id, isEditing]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/careers/jobs/${id}`, {
        headers: {
          'Authorization': `Bearer ${auth.getToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const job = data.job;
        
        setFormData({
          title: job.title,
          department: job.department,
          location: job.location,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          description: job.description,
          requirements: job.requirements.length > 0 ? job.requirements : [''],
          benefits: job.benefits.length > 0 ? job.benefits : [''],
          salaryRange: job.salaryRange || '',
          isActive: job.isActive,
          isHot: job.isHot,
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
          positionsAvailable: job.positionsAvailable,
          skills: job.skills.length > 0 ? job.skills : [''],
        });
      } else {
        setError('Failed to load job data');
      }
    } catch (err) {
      setError('Failed to load job data');
      console.error('Error loading job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'requirements' | 'benefits' | 'skills', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'requirements' | 'benefits' | 'skills') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field: 'requirements' | 'benefits' | 'skills', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray.length > 0 ? newArray : [''] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.department || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Clean up arrays by removing empty items
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        skills: formData.skills.filter(skill => skill.trim() !== ''),
        applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline).toISOString() : null,
      };

      const url = isEditing ? `/api/careers/admin/jobs/${id}` : '/api/careers/admin/jobs';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.getToken()}`
        },
        body: JSON.stringify(cleanedData)
      });

      if (response.ok) {
        navigate('/admin/careers');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save job posting');
      }
    } catch (err) {
      setError('Failed to save job posting');
      console.error('Error saving job:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/careers')}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {isEditing ? 'Update job posting details' : 'Fill in the details for the new job posting'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Job Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => handleInputChange('jobType', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 3-5 years"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Salary Range (Optional)
              </label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., NPR 50,000 - 80,000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Number of Positions
              </label>
              <input
                type="number"
                min="1"
                value={formData.positionsAvailable}
                onChange={(e) => handleInputChange('positionsAvailable', parseInt(e.target.value))}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={6}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              required
            />
          </div>

          <div className="mt-6 flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Job is active and accepting applications
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHot"
                checked={formData.isHot}
                onChange={(e) => handleInputChange('isHot', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
              />
              <label htmlFor="isHot" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Mark as "Hot" job (urgent hiring)
              </label>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Requirements</h3>
            <button
              type="button"
              onClick={() => addArrayItem('requirements')}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Requirement
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.requirements.map((requirement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                  className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a requirement..."
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Benefits</h3>
            <button
              type="button"
              onClick={() => addArrayItem('benefits')}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Benefit
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                  className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a benefit..."
                />
                {formData.benefits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Required Skills</h3>
            <button
              type="button"
              onClick={() => addArrayItem('skills')}
              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                  className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a skill..."
                />
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('skills', index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
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

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/careers')}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Job' : 'Create Job'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
