import React, { useState } from 'react';
import { createDealershipInquiry } from '../lib/api';
import { Building2, Mail, MapPin, Phone, Send, User, FileText } from 'lucide-react';
import BackToTop from '../components/BackToTop';

type FormData = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  businessType: string;
  yearsInBusiness: string;
  currentBrands: string;
  monthlyVolume: string;
  message: string;
};

const DealershipInquiry: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | { type: 'success' | 'error'; msg: string }>(null);
  const [form, setForm] = useState<FormData>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: '',
    businessType: '',
    yearsInBusiness: '',
    currentBrands: '',
    monthlyVolume: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRegex = /^[+]?\d[\d\s()-]{6,}$/; // +977 98..., (01) 5404222, etc.

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'companyName':
        if (!value.trim()) return 'Company name is required.';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters.';
        return '';
      case 'contactPerson':
        if (!value.trim()) return 'Contact person is required.';
        if (value.trim().length < 2) return 'Please enter a valid full name.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!emailRegex.test(value)) return 'Please enter a valid email address.';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone is required.';
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number.';
        return '';
      case 'yearsInBusiness':
        if (!value) return '';
        if (!/^\d+$/.test(value)) return 'Enter a whole number of years.';
        return '';
      case 'monthlyVolume':
        if (!value) return '';
        if (!/^\d+(\.\d+)?$/.test(value)) return 'Enter a valid number (liters).';
        return '';
      case 'location':
        if (!value) return '';
        if (value.trim().length < 2) return 'Please enter a valid location.';
        return '';
      case 'businessType':
        return '';
      case 'currentBrands':
        return '';
      case 'message':
        if (!value) return '';
        if (value.trim().length < 10) return 'Please add at least 10 characters.';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (data: FormData) => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    (Object.keys(data) as (keyof FormData)[]).forEach((k) => {
      const msg = validateField(k, String(data[k] ?? ''));
      if (msg) newErrors[k] = msg;
    });
    // Required set for main fields only
    ['companyName', 'contactPerson', 'email', 'phone'].forEach((k) => {
      const key = k as keyof FormData;
      const msg = validateField(key, data[key]);
      if (msg) newErrors[key] = msg;
    });
    return { valid: Object.keys(newErrors).length === 0, newErrors };
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // live-validate field
    const msg = validateField(name as keyof FormData, value);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[name as keyof FormData] = msg; else delete next[name as keyof FormData];
      return next;
    });
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const msg = validateField(name as keyof FormData, value);
    setErrors((prev) => ({ ...prev, ...(msg ? { [name]: msg } : (() => { const { [name]: _, ...rest } = prev as any; return rest; })()) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const { valid, newErrors } = validateForm(form);
    if (!valid) {
      setErrors(newErrors);
      setStatus({ type: 'error', msg: 'Please fix the highlighted fields and try again.' });
      return;
    }
    try {
      setSubmitting(true);
      await createDealershipInquiry({ ...form });
      setStatus({ type: 'success', msg: 'Thanks! Your dealership inquiry has been received. We will contact you shortly.' });
      setForm({ companyName: '', contactPerson: '', email: '', phone: '', location: '', businessType: '', yearsInBusiness: '', currentBrands: '', monthlyVolume: '', message: '' });
      setErrors({});
    } catch (err:any) {
      setStatus({ type: 'error', msg: err.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative py-16 md:py-20 text-white" style={{ background: 'linear-gradient(135deg,#06477f 0%,#053d6e 60%,#032f55 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Dealership Inquiry</h1>
          <p className="mt-4 text-white/90 max-w-2xl">Partner with Power Drive Solution to grow in your region with quality products and dependable support.</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <form onSubmit={onSubmit} className="p-8 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-lg space-y-6" noValidate>
                {/* Honeypot field */}
                <div className="hidden" aria-hidden="true">
                  <label>Leave blank</label>
                  <input type="text" name="honeypot" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input name="companyName" value={form.companyName} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.companyName} aria-describedby={errors.companyName ? 'err-companyName' : undefined} required className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.companyName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Your company" />
                      {errors.companyName && <p id="err-companyName" className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Person *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input name="contactPerson" value={form.contactPerson} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.contactPerson} aria-describedby={errors.contactPerson ? 'err-contactPerson' : undefined} required className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.contactPerson ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Full name" />
                      {errors.contactPerson && <p id="err-contactPerson" className="mt-1 text-xs text-red-500">{errors.contactPerson}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" name="email" value={form.email} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} required className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="name@example.com" />
                      {errors.email && <p id="err-email" className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input name="phone" value={form.phone} onChange={onChange} onBlur={onBlur} inputMode="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'err-phone' : undefined} required className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="e.g. +977 98xxxxxxx" />
                      {errors.phone && <p id="err-phone" className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input name="location" value={form.location} onChange={onChange} onBlur={onBlur} aria-invalid={!!errors.location} aria-describedby={errors.location ? 'err-location' : undefined} className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.location ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="City, Country" />
                      {errors.location && <p id="err-location" className="mt-1 text-xs text-red-500">{errors.location}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Type</label>
                    <select name="businessType" value={form.businessType} onChange={onChange} onBlur={onBlur} className={`w-full px-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.businessType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`}>
                      <option value="">Select</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="fleet">Fleet</option>
                      <option value="industrial">Industrial Supply</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Years in Business</label>
                    <input name="yearsInBusiness" value={form.yearsInBusiness} onChange={onChange} onBlur={onBlur} inputMode="numeric" className={`w-full px-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.yearsInBusiness ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="e.g. 5" />
                    {errors.yearsInBusiness && <p className="mt-1 text-xs text-red-500">{errors.yearsInBusiness}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Brands (if any)</label>
                    <input name="currentBrands" value={form.currentBrands} onChange={onChange} onBlur={onBlur} className={`w-full px-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.currentBrands ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Separate by comma" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estimated Monthly Volume (L)</label>
                    <input name="monthlyVolume" value={form.monthlyVolume} onChange={onChange} onBlur={onBlur} inputMode="numeric" className={`w-full px-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.monthlyVolume ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="e.g. 1000" />
                    {errors.monthlyVolume && <p className="mt-1 text-xs text-red-500">{errors.monthlyVolume}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tell us more</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea name="message" value={form.message} onChange={onChange} onBlur={onBlur} rows={6} className={`w-full pl-9 pr-3 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Business background, territory, objectives, anything else..." />
                    {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
                  </div>
                </div>
                {status && (
                  <div className={`text-sm font-medium px-4 py-3 rounded-lg border ${status.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'}`}>{status.msg}</div>
                )}
                <button type="submit" disabled={submitting} className="w-full bg-brand-600 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg font-semibold inline-flex items-center justify-center">
                  <Send className={`h-5 w-5 mr-2 ${submitting ? 'animate-pulse' : ''}`} />
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
            <aside className="space-y-5">
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Why partner with us?</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>• Strong product portfolio with proven performance</li>
                  <li>• Marketing assets and launch support</li>
                  <li>• Reliable supply and responsive service</li>
                  <li>• Long-term, growth-focused partnership</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Need help?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Email: <a className="text-brand-600" href="mailto:info@powerdrivesolution.com.np">info@powerdrivesolution.com.np</a></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Phone: <a className="text-brand-600" href="tel:015404222">01-5404222</a></p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <BackToTop />
    </div>
  );
};

export default DealershipInquiry;
