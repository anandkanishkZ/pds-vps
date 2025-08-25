import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Users, Briefcase, ChevronRight, Send, Award, Target, AlertCircle, Loader } from 'lucide-react';

interface JobListing {
  id: number;
  title: string;
  department: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  salaryRange?: string;
  isHot: boolean;
  isActive: boolean;
  applicationDeadline?: string;
  positionsAvailable: number;
  createdAt: string;
}

type FormData = {
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  coverLetter: string;
  resumeFile: File | null;
};

const Career = () => {
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>(['all']);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    coverLetter: '',
    resumeFile: null,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsAnimated(true);
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/careers/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobListings(data.jobs || []);
        
        // Extract unique departments
        const uniqueDepts = ['all', ...new Set(data.jobs?.map((job: JobListing) => job.department) || [])];
        setDepartments(uniqueDepts as string[]);
      } else {
        setError('Failed to load job listings');
      }
    } catch (err) {
      setError('Failed to load job listings');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = activeFilter === 'all' 
    ? jobListings 
    : jobListings.filter((job) => job.department === activeFilter);

  const stats = [
    { icon: Users, value: '200+', label: 'Team Members' },
    { icon: Award, value: '15+', label: 'Years of Excellence' },
    { icon: Target, value: '98%', label: 'Employee Satisfaction' },
    { icon: Briefcase, value: `${jobListings.length}+`, label: 'Open Positions' },
  ];

  const validate = (data: FormData) => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!data.name.trim()) e.name = 'Full name is required';
    const emailOk = /^\S+@\S+\.\S+$/.test(data.email);
    if (!emailOk) e.email = 'Enter a valid email address';
    const phoneOk = /^[0-9+()\-\s]{7,15}$/.test(data.phone);
    if (!phoneOk) e.phone = 'Enter a valid phone number';
    if (!data.position.trim()) e.position = 'Please specify a position';
    if (!data.experience.trim()) e.experience = 'Experience is required';
    if (data.resumeFile && data.resumeFile.size > 5 * 1024 * 1024) e.resumeFile = 'Max file size is 5MB';
    return e;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, resumeFile: file }));
    setFormErrors((prev) => ({ ...prev, resumeFile: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(formData);
    setFormErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitStatus('submitting');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('position', formData.position);
      submitData.append('experience', formData.experience);
      submitData.append('coverLetter', formData.coverLetter);
      
      if (formData.resumeFile) {
        submitData.append('resume', formData.resumeFile);
      }

      const response = await fetch('/api/careers/apply', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          experience: '',
          coverLetter: '',
          resumeFile: null,
        });
        // Reset file input
        const fileInput = document.getElementById('resume') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setSubmitStatus('error');
    }
  };

  const scrollToForm = (positionPrefill?: string) => {
    if (positionPrefill) {
      setFormData((prev) => ({ ...prev, position: positionPrefill }));
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isDeadlinePassed = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading career opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchJobs}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#06477f]/20 to-[#fec216]/20 dark:from-[#06477f]/10 dark:to-[#fec216]/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div
              className={`transition-all duration-1000 ${
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <span className="inline-block text-sm font-semibold uppercase tracking-wider bg-[#06477f]/10 text-[#06477f] dark:bg-[#fec216]/10 dark:text-[#fec216] px-4 py-2 rounded-full mb-4">
                Careers at Power Drive Solution
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Join Our{' '}
                <span className="bg-gradient-to-r from-[#06477f] to-[#fec216] bg-clip-text text-transparent">
                  Innovation
                </span>{' '}
                Journey
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Be part of a team that's driving the future of automotive lubrication technology. 
                We offer exciting opportunities for growth, innovation, and making a real impact in the industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-1000 delay-${index * 150} ${
                  isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#06477f] to-[#fec216] rounded-2xl mb-4 mx-auto">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover exciting career opportunities and find the perfect role that matches your skills and ambitions.
            </p>
          </div>

          {/* Department Filter */}
          {departments.length > 1 && (
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setActiveFilter(dept)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === dept
                      ? 'bg-[#06477f] text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {dept === 'all' ? 'All Departments' : dept}
                </button>
              ))}
            </div>
          )}

          {/* Job Cards */}
          {filteredJobs.length > 0 ? (
            <div className="grid gap-8">
              {filteredJobs.map((job, index) => (
                <div
                  key={job.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-1000 delay-${index * 100} ${
                    isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  } hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {job.title}
                              </h3>
                              {job.isHot && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  🔥 Hot Job
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                {job.department}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {job.jobType}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {job.experienceLevel}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Additional Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-6">
                          {job.salaryRange && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
                              💰 {job.salaryRange}
                            </span>
                          )}
                          {job.positionsAvailable > 1 && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                              👥 {job.positionsAvailable} positions
                            </span>
                          )}
                          {job.applicationDeadline && !isDeadlinePassed(job.applicationDeadline) && (
                            <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full">
                              📅 Apply by {formatDate(job.applicationDeadline)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={() => scrollToForm(job.title)}
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#06477f] to-[#0056b3] text-white rounded-lg font-medium hover:from-[#0056b3] hover:to-[#06477f] transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Apply Now
                          </button>
                          <button
                            onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group"
                          >
                            View Details
                            <ChevronRight 
                              className={`h-4 w-4 ml-2 transition-transform duration-300 ${
                                selectedJob === job.id ? 'rotate-90' : 'group-hover:translate-x-1'
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedJob === job.id && (
                      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-6">
                        {job.requirements.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Requirements</h4>
                            <ul className="space-y-2">
                              {job.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-2 h-2 bg-[#06477f] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                  <span className="text-gray-600 dark:text-gray-300">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.benefits.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Benefits</h4>
                            <ul className="space-y-2">
                              {job.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-start">
                                  <div className="w-2 h-2 bg-[#fec216] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                  <span className="text-gray-600 dark:text-gray-300">{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.skills.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                              {job.skills.map((skill, idx) => (
                                <span 
                                  key={idx}
                                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Open Positions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We don't have any open positions at the moment, but we're always looking for talented individuals.
              </p>
              <button
                onClick={() => scrollToForm()}
                className="inline-flex items-center px-6 py-3 bg-[#06477f] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
              >
                Submit Your Resume
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            ref={formRef}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12 transition-all duration-1000 delay-150 ${
              isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="text-center mb-8">
              <span className="inline-block text-sm font-semibold uppercase tracking-wider bg-[#06477f]/10 text-[#06477f] dark:bg-[#fec216]/10 dark:text-[#fec216] px-4 py-2 rounded-full mb-4">
                Apply Now
              </span>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                Submit Your Application
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ready to join our team? Send us your details and we'll get back to you shortly.
              </p>
            </div>

            {submitStatus === 'success' && (
              <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-green-800 dark:text-green-400 font-medium">Application Submitted!</h4>
                    <p className="text-green-700 dark:text-green-300 text-sm">Thank you for your interest. We'll review your application and get back to you soon.</p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h4 className="text-red-800 dark:text-red-400 font-medium">Submission Failed</h4>
                    <p className="text-red-700 dark:text-red-300 text-sm">Please try again or contact us directly.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="+977 98XXXXXXXX"
                  />
                  {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Position Applied For <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors ${
                      formErrors.position ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="e.g., Senior Chemical Engineer"
                  />
                  {formErrors.position && <p className="mt-1 text-sm text-red-500">{formErrors.position}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience Level <span className="text-red-500">*</span>
                </label>
                <input
                  id="experience"
                  name="experience"
                  type="text"
                  value={formData.experience}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors ${
                    formErrors.experience ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., 3-5 years in chemical engineering"
                />
                {formErrors.experience && <p className="mt-1 text-sm text-red-500">{formErrors.experience}</p>}
              </div>

              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resume/CV <span className="text-gray-500">(PDF, DOC, DOCX - Max 5MB)</span>
                </label>
                <input
                  id="resume"
                  name="resume"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#06477f] file:text-white hover:file:bg-[#0056b3] transition-colors ${
                    formErrors.resumeFile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.resumeFile && <p className="mt-1 text-sm text-red-500">{formErrors.resumeFile}</p>}
              </div>

              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cover Letter <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={5}
                  value={formData.coverLetter}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#06477f] focus:border-[#06477f] transition-colors resize-vertical"
                  placeholder="Tell us why you're the perfect fit for this role..."
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#06477f] to-[#0056b3] text-white rounded-lg font-medium hover:from-[#0056b3] hover:to-[#06477f] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {submitStatus === 'submitting' ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Career;
