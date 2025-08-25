import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X,
  RefreshCw,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';
import { 
  createGalleryItem, 
  listMedia,
  auth,
  type MediaLibraryItem,
  API_BASE 
} from '../../../lib/api';
import { toast } from 'react-toastify';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: 'facility' | 'products' | 'events' | 'achievements';
  imageUrl: string;
  date: string;
  location: string;
  featured: boolean;
  status: 'active' | 'archived';
}

const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const token = auth.getToken();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'events',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    featured: false,
    status: 'active'
  });
  
  // Media library state
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createAndStayRef = useRef(false);

  // Load media library
  const loadMediaLibrary = useCallback(async () => {
    if (!token) return;
    
    try {
      setMediaLoading(true);
      const response = await listMedia(token, { pageSize: 100 });
      
      // Normalize URLs
      const base = API_BASE.replace(/\/$/, '');
      const items = response.data.map(item => ({
        ...item,
        url: item.url.startsWith('http') ? item.url : base + (item.url.startsWith('/') ? item.url : '/' + item.url)
      }));
      
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to load media library:', error);
      toast.error('Failed to load media library');
    } finally {
      setMediaLoading(false);
    }
  }, [token]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      category: 'events',
      imageUrl: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      featured: false,
      status: 'active'
    });
  }, []);

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.title || !formData.imageUrl) return;

    try {
      setSubmitting(true);
      await createGalleryItem(token, formData);
      toast.success('Gallery item created successfully');
      onSuccess();
      if (createAndStayRef.current) {
        resetForm();
        createAndStayRef.current = false; // reset flag after use
      } else {
        resetForm();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change - stable callback to prevent re-renders
  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Select media
  const selectMedia = (item: MediaLibraryItem) => {
    setFormData(prev => ({ ...prev, imageUrl: item.url }));
    // Close only the media picker, keep parent modal open
    setShowMediaLibrary(false);
  };

  // Filter media items
  const filteredMediaItems = mediaItems.filter(item =>
    !mediaSearch || 
    (item.altText && item.altText.toLowerCase().includes(mediaSearch.toLowerCase())) ||
    item.url.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  // Keyboard shortcuts (Esc to close, Ctrl/Cmd+Enter to submit)
  // Track previously focused element for focus restoration
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    if(isOpen){
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      // keyboard shortcuts only while open
      const handler = (e: KeyboardEvent) => {
        if(e.key === 'Escape' && !showMediaLibrary) { e.preventDefault(); onClose(); }
        if((e.ctrlKey||e.metaKey) && e.key === 'Enter') {
          const form = document.getElementById('create-gallery-form') as HTMLFormElement | null;
          if(form && !submitting && formData.title && formData.imageUrl) form.requestSubmit();
        }
      };
      window.addEventListener('keydown', handler);
      // move focus inside modal
      setTimeout(()=>{
        const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      },0);
      return ()=>window.removeEventListener('keydown', handler);
    }
  },[isOpen, showMediaLibrary, submitting, formData.title, formData.imageUrl, onClose]);

  // Lock body scroll while modal open
  useEffect(()=>{
    if(!isOpen) return; 
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  },[isOpen]);

  // Internal render state to allow exit animation
  const [shouldRender, setShouldRender] = useState(isOpen);
  useEffect(()=>{ if(isOpen) setShouldRender(true); }, [isOpen]);

  const titleCharLimit = 120;
  const descCharLimit = 600;
  const titleRemaining = titleCharLimit - formData.title.length;
  const descRemaining = descCharLimit - formData.description.length;

  const modalContent = shouldRender ? (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={() => { if (!showMediaLibrary) onClose(); }}
          role="dialog" aria-modal="true" aria-label="Create gallery item"
          onAnimationComplete={() => {
            if(!isOpen){
              // restore focus after fade-out completes
              previouslyFocusedRef.current?.focus();
              setShouldRender(false);
            }
          }}
        >
          <motion.div 
            ref={modalRef}
            className="w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-slate-50/10 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.94 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 16, scale: 0.96 }} 
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <h2 className="text-sm font-semibold tracking-wide uppercase">Create Gallery Item</h2>
              <p className="text-xs text-white/90">Add a new item to showcase in your gallery</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" /> New Item
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
        <form id="create-gallery-form" onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="grid lg:grid-cols-2 gap-6 items-start">
              {/* Left Column */}
              <div className="space-y-6 order-2 lg:order-1">
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50/60 dark:bg-slate-800/40">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Basic Information
                    </h3>
                    <div className="space-y-4">
                      {/* Title Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter gallery item title..."
                          required
                        />
                        <div className="flex justify-end text-[11px] font-medium tracking-wide">
                          <span className={titleRemaining < 0 ? 'text-rose-500' : titleRemaining < 15 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}>{titleRemaining} left</span>
                        </div>
                      </div>

                      {/* Description Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => {
                            if(e.target.value.length <= descCharLimit) handleInputChange('description', e.target.value);
                          }}
                          rows={5}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none"
                          placeholder="Describe this gallery item..."
                        />
                        <div className="flex justify-end text-[11px] font-medium tracking-wide">
                          <span className={descRemaining < 0 ? 'text-rose-500' : descRemaining < 40 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}>{descRemaining} left</span>
                        </div>
                      </div>

                      {/* Category Select */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          <option value="facility">🏢 Facilities</option>
                          <option value="products">📦 Products</option>
                          <option value="events">🎉 Events</option>
                          <option value="achievements">🏆 Achievements</option>
                        </select>
                      </div>
                    </div>
                  </section>
                </div>
                {/* Right Column */}
                <div className="space-y-6 order-1 lg:order-2">
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Details & Settings
                    </h3>
                    <div className="space-y-4">
                      {/* Image URL */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Image *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                            placeholder="https://example.com/image.jpg"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              loadMediaLibrary();
                              setShowMediaLibrary(true);
                            }}
                            className="px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Browse
                          </button>
                        </div>
                        {formData.imageUrl && (
                          <div className="mt-2 relative group">
                            <img
                              src={formData.imageUrl}
                              alt="Preview"
                              className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                              onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }}
                            />
                            <button type="button" onClick={()=>handleInputChange('imageUrl','')} className="absolute top-2 right-2 px-2 py-1 rounded-md text-[11px] bg-black/50 text-white opacity-0 group-hover:opacity-100 transition">Remove</button>
                          </div>
                        )}
                      </div>

                      {/* Date Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Location Input */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter location..."
                        />
                      </div>

                      {/* Featured Toggle */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => handleInputChange('featured', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData.featured ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.featured ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Featured Item
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Show this item prominently
                          </p>
                        </div>
                      </label>

                      {/* Status Select */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="active">✅ Active</option>
                          <option value="archived">📁 Archived</option>
                        </select>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            {/* Footer */}
            <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 px-6 py-4 sticky bottom-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 order-2 sm:order-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting || !formData.title || !formData.imageUrl}
                      onClick={() => { createAndStayRef.current = true; }}
                      className="px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-brand-700 dark:text-brand-300 ring-1 ring-brand-300/60 dark:ring-brand-400/40 hover:bg-brand-50 dark:hover:bg-brand-900/30 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Plus className="w-4 h-4" /> Add Another
                    </button>
                    <button
                      type="button"
                      onClick={()=>resetForm()}
                      className="px-4 py-2.5 rounded-lg font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >Reset</button>
                  </div>
                </div>
                <div className="flex items-center gap-3 order-1 sm:order-2 justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !formData.title || !formData.imageUrl}
                    onClick={() => { createAndStayRef.current = false; }}
                    className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-7 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Item
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-label="Media library"
          onClick={(e)=>{ e.stopPropagation(); setShowMediaLibrary(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-0 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e)=>e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    📁 Media Library
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Choose an image from your media library
                  </p>
                </div>
                <button
                  onClick={() => setShowMediaLibrary(false)}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors duration-200 group"
                >
                  <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search media files..."
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {mediaLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMediaItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
            onClick={(e) => { e.stopPropagation(); selectMedia(item); }}
                      className="group relative aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-brand-400 transition-all duration-200 shadow-sm hover:shadow-lg"
                    >
                      <img
                        src={item.url}
                        alt={item.altText || 'Media'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-3">
                          <ImageIcon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                        </div>
                      </div>
                      {item.altText && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-white text-xs font-medium truncate">
                            {item.altText}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredMediaItems.length === 0 && !mediaLoading && (
                <div className="text-center py-16">
                  <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {mediaSearch ? 'No matching media found' : 'No media available'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    {mediaSearch 
                      ? 'Try adjusting your search terms or browse all files.' 
                      : 'Upload some media files to your library to get started.'}
                  </p>
                  {mediaSearch && (
                    <button
                      onClick={() => setMediaSearch('')}
                      className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  ) : null;

  return modalContent ? createPortal(modalContent, document.body) : null;
};

export default CreateGalleryModal;
