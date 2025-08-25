import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RefreshCw, ImageIcon, Eye } from 'lucide-react';
import { Search } from 'lucide-react';

interface GalleryItem {
  id: number;
  title: string;
  description?: string;
  category: 'facility' | 'products' | 'events' | 'achievements';
  imageUrl: string;
  date: string;
  location?: string;
  featured: boolean;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  altText?: string;
  size: number;
  type: string;
  createdAt: string;
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

interface EditGalleryModalProps {
  galleryItem: GalleryItem;
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitting: boolean;
  showMediaLibrary: boolean;
  setShowMediaLibrary: (show: boolean) => void;
  mediaItems: MediaItem[];
  loadMediaLibrary: () => Promise<void>;
}

const EditGalleryModal: React.FC<EditGalleryModalProps> = ({
  galleryItem,
  formData,
  setFormData,
  onSubmit,
  onClose,
  submitting,
  showMediaLibrary,
  setShowMediaLibrary,
  mediaItems,
  loadMediaLibrary
}) => {
  const [mediaSearch, setMediaSearch] = React.useState('');
  const [mediaLoading, setMediaLoading] = React.useState(false);

  const filteredMediaItems = mediaItems.filter(item =>
    item.filename.toLowerCase().includes(mediaSearch.toLowerCase()) ||
    (item.altText && item.altText.toLowerCase().includes(mediaSearch.toLowerCase()))
  );

  const selectMedia = (item: MediaItem) => {
    setFormData(prev => ({ ...prev, imageUrl: item.url }));
    setShowMediaLibrary(false);
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-0 w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-gradient-to-r from-brand-600/5 to-brand-700/5 dark:from-brand-400/10 dark:to-brand-500/10 border-b border-slate-200 dark:border-slate-700 px-8 py-6 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                  Edit Gallery Item
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Update your gallery item details and settings
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors duration-200 group"
              >
                <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-140px)] px-8 py-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter gallery item title..."
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter a detailed description..."
                />
              </div>

              {/* Category and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="facility">🏭 Facility</option>
                    <option value="products">📦 Products</option>
                    <option value="events">🎉 Events</option>
                    <option value="achievements">🏆 Achievements</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  📍 Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter location (e.g., Kathmandu, Nepal)"
                />
              </div>

              {/* Image Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  🖼️ Image *
                </label>
                
                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="relative group">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-xl"></div>
                  </div>
                )}

                {/* Image URL Input */}
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Enter image URL or choose from media library"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                  required
                />
                
                {/* Media Library Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaLibrary(true);
                    if (mediaItems.length === 0) loadMediaLibrary();
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 text-sm font-medium border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all duration-200 group"
                >
                  <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-brand-600 transition-colors" />
                  <span className="text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    Choose from Media Library
                  </span>
                </button>
              </div>

              {/* Settings Row */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  ⚙️ Settings
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Featured Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                        formData.featured 
                          ? 'bg-brand-600' 
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          formData.featured ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}></div>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        ⭐ Featured Item
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Show this item prominently
                      </p>
                    </div>
                  </label>

                  {/* Status Select */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="active">✅ Active</option>
                      <option value="archived">📁 Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-8 py-6">
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={onSubmit}
                disabled={submitting || !formData.title || !formData.imageUrl}
                className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Gallery Item
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Media Library Modal */}
        <AnimatePresence>
          {showMediaLibrary && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-0 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
              >
                {/* Media Library Header */}
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
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search media files..."
                        value={mediaSearch}
                        onChange={(e) => setMediaSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Media Library Content */}
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
                          onClick={() => selectMedia(item)}
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
                              <Eye className="w-6 h-6 text-slate-700 dark:text-slate-300" />
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
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default EditGalleryModal;
