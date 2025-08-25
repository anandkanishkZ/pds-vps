import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Edit3, 
  X, 
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Info,
  Calendar,
  Tag,
  FileType,
  Monitor,
  Hash
} from 'lucide-react';
import { toast } from 'react-toastify';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (item: any) => void;
  onDelete: (id: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ 
  isOpen, 
  onClose, 
  item, 
  onSave, 
  onDelete 
}) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || '',
    tags: item?.tags?.join(', ') || '',
    isVisible: item?.isVisible ?? true,
    featured: item?.featured || false,
    metadata: {
      alt: item?.metadata?.alt || '',
      keywords: item?.metadata?.keywords || '',
      copyright: item?.metadata?.copyright || '',
      ...item?.metadata
    }
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'metadata' | 'advanced'>('basic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metadataField = field.replace('metadata.', '');
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedItem = {
        ...item,
        ...formData,
        tags: formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
        updatedAt: new Date().toISOString()
      };
      
      await onSave(updatedItem);
      toast.success('Item updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(item.id);
      toast.success('Item deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/gallery/${item.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const openExternal = () => {
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  if (!isOpen || !item) return null;

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {/* Left Panel - Preview */}
          <div className="w-1/2 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <div className="h-full flex flex-col">
              {/* Preview Header */}
              <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Copy className="w-3 h-3" />
                    Copy Link
                  </button>
                  <button
                    onClick={openExternal}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-hidden">
                {item.type?.startsWith('image') ? (
                  <img
                    src={item.url || item.src}
                    alt={formData.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                    <div className="text-center">
                      <FileType className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        {item.type || 'Unknown file type'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    <span>
                      {item.metadata?.width}×{item.metadata?.height}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    <span>
                      {item.metadata?.size ? `${(item.metadata.size / 1024 / 1024).toFixed(1)}MB` : 'Unknown size'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Edit Form */}
          <div className="w-1/2 flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Edit Media</h2>
                  <p className="text-sm text-white/90">
                    Update media details and metadata
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/15 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                {[
                  { id: 'basic', label: 'Basic Info', icon: Info },
                  { id: 'metadata', label: 'Metadata', icon: Tag },
                  { id: 'advanced', label: 'Advanced', icon: Monitor }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        <option value="products">Products</option>
                        <option value="gallery">Gallery</option>
                        <option value="events">Events</option>
                        <option value="news">News</option>
                        <option value="testimonials">Testimonials</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isVisible}
                        onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Visible
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        Featured
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={formData.metadata.alt}
                      onChange={(e) => handleInputChange('metadata.alt', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Alternative text for accessibility..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.metadata.keywords}
                      onChange={(e) => handleInputChange('metadata.keywords', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO keywords, separated by commas..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Copyright
                    </label>
                    <input
                      type="text"
                      value={formData.metadata.copyright}
                      onChange={(e) => handleInputChange('metadata.copyright', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Copyright information..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      File Information
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">File Type:</span>
                        <span className="text-slate-900 dark:text-slate-100">{item.type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Size:</span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {item.metadata?.size ? `${(item.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Dimensions:</span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {item.metadata?.width && item.metadata?.height 
                            ? `${item.metadata.width} × ${item.metadata.height}` 
                            : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Created:</span>
                        <span className="text-slate-900 dark:text-slate-100">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Replace File
                    </h4>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        // Handle file replacement logic here
                        if (e.target.files?.[0]) {
                          toast.info('File replacement not yet implemented');
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Choose New File
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Delete Media
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to delete this media? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
