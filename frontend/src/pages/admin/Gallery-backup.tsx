import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Calendar,
  MapPin,
  X,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Grid,
  List,
  Archive,
  CheckCircle,
  MessageSquare,
  Flag,
  Layers,
  ShieldAlert,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { 
  listAdminGalleryItems,
  getGalleryStats, 
  createGalleryItem, 
  updateGalleryItem, 
  deleteGalleryItem,
  listMedia,
  auth,
  type GalleryItem, 
  type GalleryStats,
  type MediaLibraryItem,
  API_BASE 
} from '../../lib/api';
import { toast } from 'react-toastify';
import EditGalleryModal from '../../components/admin/EditGalleryModal';

const AdminGalleryPage: React.FC = () => {
  const token = auth.getToken();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomerInquiry, setShowCustomerInquiry] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'events' as 'facility' | 'products' | 'events' | 'achievements',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    featured: false,
    status: 'active' as 'active' | 'archived'
  });
  
  // Media library state
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  
  const [submitting, setSubmitting] = useState(false);

  // Load gallery items
  const loadGalleryItems = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [itemsResponse, statsResponse] = await Promise.all([
        listAdminGalleryItems(token, { pageSize: 100 }),
        getGalleryStats(token)
      ]);
      
      setGalleryItems(itemsResponse.data);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load gallery items:', error);
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  }, [token]);

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

  useEffect(() => {
    loadGalleryItems();
  }, [loadGalleryItems]);

  // Filter gallery items
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
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
  };

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !formData.title || !formData.imageUrl) return;

    try {
      setSubmitting(true);
      await createGalleryItem(token, formData);
      toast.success('Gallery item created successfully');
      setShowCreateModal(false);
      resetForm();
      loadGalleryItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedItem) return;

    try {
      setSubmitting(true);
      await updateGalleryItem(token, selectedItem.id, formData);
      toast.success('Gallery item updated successfully');
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      loadGalleryItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!token || !selectedItem) return;

    try {
      setSubmitting(true);
      await deleteGalleryItem(token, selectedItem.id);
      toast.success('Gallery item deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      loadGalleryItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle featured status
  const toggleFeatured = async (item: GalleryItem) => {
    if (!token) return;

    try {
      await updateGalleryItem(token, item.id, { featured: !item.featured });
      toast.success(`Item ${item.featured ? 'unfeatured' : 'featured'} successfully`);
      loadGalleryItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update featured status');
    }
  };

  // Toggle status
  const toggleStatus = async (item: GalleryItem) => {
    if (!token) return;

    try {
      const newStatus = item.status === 'active' ? 'archived' : 'active';
      await updateGalleryItem(token, item.id, { status: newStatus });
      
      if (newStatus === 'active') {
        toast.success(`✅ "${item.title}" restored to active successfully!`);
      } else {
        toast.success(`📦 "${item.title}" archived successfully!`);
      }
      
      loadGalleryItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  // Open edit modal
  const openEditModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category as 'facility' | 'products' | 'events' | 'achievements',
      imageUrl: item.imageUrl,
      date: item.date.split('T')[0],
      location: item.location || '',
      featured: item.featured,
      status: item.status as 'active' | 'archived'
    });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Select media from library
  const selectMedia = (mediaItem: MediaLibraryItem) => {
    setFormData(prev => ({ ...prev, imageUrl: mediaItem.url }));
    setShowMediaLibrary(false);
  };

  // Filter media items
  const filteredMediaItems = mediaItems.filter(item =>
    !mediaSearch || 
    (item.altText && item.altText.toLowerCase().includes(mediaSearch.toLowerCase())) ||
    item.url.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'facility', label: 'Facilities' },
    { value: 'products', label: 'Products' },
    { value: 'events', label: 'Events' },
    { value: 'achievements', label: 'Achievements' }
  ];

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' }
  ];

  // Customer Inquiry Modal Component (pixel-identical to Inquiries page)
  const CustomerInquiryModal: React.FC<{ galleryItem: GalleryItem; onClose: () => void }> = ({ galleryItem, onClose }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const modalContent = (
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 20, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 20, scale: 0.95 }} 
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-50/10 overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <h2 className="text-sm font-semibold tracking-wide uppercase">Gallery Item Inquiry</h2>
                  <p className="text-xs text-white/90">{galleryItem.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3" /> {galleryItem.status.replace('_', ' ')}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                  <Flag className="h-3 w-3" /> {galleryItem.category}
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
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Gallery Item Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{galleryItem.title}</p>
                        <div className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                          <Layers className="h-3 w-3" /> {galleryItem.category}
                        </div>
                        {galleryItem.location && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <MapPin className="h-4 w-4" /> {galleryItem.location}
                          </div>
                        )}
                        {galleryItem.date && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(galleryItem.date)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Created: {formatDate(galleryItem.createdAt)}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Updated: {formatDate(galleryItem.updatedAt)}
                        </div>
                        {galleryItem.featured && (
                          <div className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400">
                            <Star className="h-3 w-3" /> Featured Item
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Description</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {galleryItem.description || 'No description provided for this gallery item.'}
                      </p>
                    </div>
                  </section>
                  {/* Image Preview Section */}
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Image Preview</h3>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img 
                        src={galleryItem.imageUrl.startsWith('http') ? galleryItem.imageUrl : `${API_BASE}${galleryItem.imageUrl}`}
                        alt={galleryItem.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.jpg';
                        }}
                      />
                    </div>
                  </section>
                </div>
                {/* Right sidebar */}
                <div className="space-y-6">
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status & Category</h3>
                    <div className="flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-medium ${
                          galleryItem.status === 'active' 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-400'
                        }`}>
                          <CheckCircle className="h-3 w-3" /> {galleryItem.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Category</span>
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[11px] font-medium bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                          <Flag className="h-3 w-3" /> {galleryItem.category}
                        </span>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-800 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Item Properties</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Featured</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
                          galleryItem.featured 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400'
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                        }`}>
                          {galleryItem.featured ? <Star className="h-3 w-3" /> : <StarOff className="h-3 w-3" />}
                          {galleryItem.featured ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Sort Order</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">#{galleryItem.sortOrder || 0}</span>
                      </div>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Actions</h3>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => {
                          setSelectedItem(galleryItem);
                          setShowCustomerInquiry(false);
                          setShowEditModal(true);
                        }}
                        className="h-10 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-md"
                      >
                        Edit Gallery Item
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(galleryItem.imageUrl.startsWith('http') ? galleryItem.imageUrl : `${API_BASE}${galleryItem.imageUrl}`);
                          toast.success('Image URL copied to clipboard');
                        }}
                        className="h-10 rounded-lg bg-green-600/90 hover:bg-green-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-md"
                      >
                        Copy Image URL
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedItem(galleryItem);
                          setShowCustomerInquiry(false);
                          setShowDeleteModal(true);
                        }}
                        className="h-10 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-md"
                      >
                        Delete Item
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

  // Create Gallery Modal Component (same UI/UX as Gallery Item Inquiry)
  const CreateGalleryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const modalContent = (
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
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
          <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-50/10 overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
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
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
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
                            placeholder="Describe this gallery item..."
                          />
                        </div>

                        {/* Category Select */}
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
                  <div className="space-y-6">
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
                              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
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
                            <div className="mt-2">
                              <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
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
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter location..."
                          />
                        </div>

                        {/* Featured Toggle */}
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
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

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
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
                    disabled={submitting || !formData.title || !formData.imageUrl}
                    className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Create Gallery Item
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );

    // Render to portal at document.body level to escape layout constraints
    return createPortal(modalContent, document.body);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
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
          <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-50/10 overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Edit className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <h2 className="text-sm font-semibold tracking-wide uppercase">Edit Gallery Item</h2>
                  <p className="text-xs text-white/90">{selectedItem?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3" /> {selectedItem?.status}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-medium backdrop-blur-sm">
                  <Flag className="h-3 w-3" /> {selectedItem?.category}
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
              <form onSubmit={handleEdit} className="space-y-6">
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

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Describe your gallery item..."
                  />
                </div>

                {/* Image URL and Browse */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Image *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter image URL or browse media library..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        loadMediaLibrary();
                        setShowMediaLibrary(true);
                      }}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Browse
                    </button>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
                    >
                      <option value="facility">🏢 Facilities</option>
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

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter location (optional)..."
                  />
                </div>

                {/* Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Featured Item
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                          formData.featured 
                            ? 'bg-brand-500 border-brand-500' 
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-400'
                        }`}>
                          {formData.featured && (
                            <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Mark as featured item
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="active">✅ Active</option>
                      <option value="archived">📁 Archived</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
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
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );

    // Render to portal at document.body level to escape layout constraints
    return createPortal(modalContent, document.body);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Gallery Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your gallery items and showcase your best content
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Gallery Item
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Items</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalItems}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Featured</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.featuredItems}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.activeItems}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Archived</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {stats.archivedItems}
                </p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Archive className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search gallery items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
            
            <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>Showing {filteredItems.length} of {galleryItems.length} items</span>
            {statusFilter === 'archived' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg">
                <Archive className="w-4 h-4" />
                <span className="text-xs font-medium">Viewing archived items</span>
                <span className="text-xs opacity-75">• Use restore button to activate</span>
              </div>
            )}
          </div>
          <button
            onClick={loadGalleryItems}
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Gallery Items */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-200 ${
                item.status === 'archived' 
                  ? 'opacity-60 ring-2 ring-orange-200 dark:ring-orange-800 bg-orange-50/30 dark:bg-orange-900/10' 
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="relative aspect-video">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className={`w-full h-full object-cover transition-all duration-200 ${
                    item.status === 'archived' ? 'grayscale-[0.3] opacity-75' : ''
                  }`}
                />
                {item.status === 'archived' && (
                  <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Archived
                    </div>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  {item.featured && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Featured
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'active' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {item.category}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeatured(item)}
                      className={`p-1 rounded transition-all duration-200 ${
                        item.featured 
                          ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                          : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                      title={item.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      {item.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleStatus(item)}
                      className={`p-1 rounded transition-all duration-200 ${
                        item.status === 'archived'
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700'
                          : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700'
                      }`}
                      title={item.status === 'active' ? 'Archive item' : 'Restore item to active'}
                    >
                      {item.status === 'archived' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowCustomerInquiry(true);
                      }}
                      className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                      title="View item details"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Edit item"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Item</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Category</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Date</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Status</th>
                  <th className="text-left p-4 font-medium text-slate-900 dark:text-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className={`border-b border-slate-200 dark:border-slate-700 transition-all duration-200 ${
                    item.status === 'archived' 
                      ? 'bg-orange-50/30 dark:bg-orange-900/5 opacity-75' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={`w-12 h-12 object-cover rounded transition-all duration-200 ${
                              item.status === 'archived' ? 'grayscale-[0.3] opacity-75' : ''
                            }`}
                          />
                          {item.status === 'archived' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20 rounded">
                              <Archive className="w-4 h-4 text-orange-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={`font-medium transition-colors duration-200 ${
                            item.status === 'archived' 
                              ? 'text-slate-600 dark:text-slate-400' 
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {item.title}
                            {item.featured && (
                              <Star className="w-4 h-4 text-yellow-500 inline ml-2 fill-current" />
                            )}
                            {item.status === 'archived' && (
                              <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                                (Archived)
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className={`text-sm line-clamp-1 transition-colors duration-200 ${
                              item.status === 'archived' 
                                ? 'text-slate-500 dark:text-slate-500' 
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`capitalize transition-colors duration-200 ${
                        item.status === 'archived' 
                          ? 'text-slate-500 dark:text-slate-500' 
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className={`p-4 transition-colors duration-200 ${
                      item.status === 'archived' 
                        ? 'text-slate-500 dark:text-slate-500' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeatured(item)}
                          className={`p-1 rounded transition-all duration-200 ${
                            item.featured 
                              ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                              : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                          title={item.featured ? 'Remove from featured' : 'Add to featured'}
                        >
                          {item.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleStatus(item)}
                          className={`p-1 rounded transition-all duration-200 ${
                            item.status === 'archived'
                              ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700'
                              : 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700'
                          }`}
                          title={item.status === 'active' ? 'Archive item' : 'Restore item to active'}
                        >
                          {item.status === 'archived' ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowCustomerInquiry(true);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-all duration-200"
                          title="View item details"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all duration-200"
                          title="Edit item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No gallery items found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Get started by creating your first gallery item.'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg"
            >
              Create Gallery Item
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGalleryModal 
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedItem && (
          <EditGalleryModal 
            galleryItem={selectedItem}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEdit}
            onClose={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            submitting={submitting}
            showMediaLibrary={showMediaLibrary}
            setShowMediaLibrary={setShowMediaLibrary}
            mediaItems={mediaItems}
            loadMediaLibrary={loadMediaLibrary}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Delete Gallery Item
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to delete "{selectedItem.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Library Modal */}
      <AnimatePresence>
        {showMediaLibrary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-0 w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
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

      {/* Customer Inquiry Modal */}
      <AnimatePresence>
        {showCustomerInquiry && selectedItem && (
          <CustomerInquiryModal 
            galleryItem={selectedItem}
            onClose={() => {
              setShowCustomerInquiry(false);
              setSelectedItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGalleryPage;
