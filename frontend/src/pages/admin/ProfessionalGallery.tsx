import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  Star, 
  BarChart3,
  TrendingUp,
  Users,
  Search,
  Filter
} from 'lucide-react';
import GalleryControls from '../../components/admin/Gallery/GalleryControls';
import SelectionToolbar from '../../components/admin/Gallery/SelectionToolbar';
import GalleryContent from '../../components/admin/Gallery/GalleryContent';
import UploadModal from '../../components/admin/Gallery/UploadModal';
import EditModal from '../../components/admin/Gallery/EditModal';
import PreviewModal from '../../components/admin/Gallery/PreviewModal';

// Types
export type ViewMode = 'grid' | 'masonry' | 'list' | 'timeline';

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  type: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  isVisible?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    alt?: string;
    keywords?: string;
    copyright?: string;
  };
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  likes?: number;
}

// Transform function to match component interface
const transformGalleryItem = (item: GalleryItem) => ({
  id: item.id,
  imageUrl: item.url,
  title: item.title,
  date: item.createdAt || new Date().toISOString(),
  status: item.isVisible ? 'active' as const : 'archived' as const,
  views: item.views || 0,
  likes: item.likes || 0,
  tags: item.tags || [],
  featured: item.featured || false,
  category: (item.category || 'products') as 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards',
  description: item.description,
  type: (item.type === 'video' ? 'video' : 'image') as 'image' | 'video',
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString()
});

// Transform function for view mode
const transformViewMode = (mode: ViewMode): 'grid' | 'list' => {
  return mode === 'list' ? 'list' : 'grid';
};

export interface FilterOptions {
  category: string;
  status: string;
  tags: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: 'newest' | 'oldest' | 'title' | 'views' | 'likes';
  sortOrder: 'asc' | 'desc';
}

export interface GalleryStats {
  total: number;
  visible: number;
  featured: number;
  totalViews: number;
  totalLikes: number;
  storageUsed: number;
  categories: { [key: string]: number };
}

// Mock data
const mockGalleryItems: GalleryItem[] = [
  {
    id: '1',
    title: 'Beautiful Landscape',
    description: 'A stunning mountain landscape captured during golden hour',
    url: '/images/category/deo.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['landscape', 'mountains', 'nature'],
    featured: true,
    isVisible: true,
    author: 'John Doe',
    createdAt: '2024-01-15T10:30:00Z',
    views: 245,
    likes: 18,
    metadata: {
      width: 1920,
      height: 1080,
      size: 2458120,
      alt: 'Mountain landscape at golden hour'
    }
  },
  {
    id: '2',
    title: 'Industrial Equipment',
    description: 'High-quality industrial lubricants for heavy machinery',
    url: '/images/category/industrial.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['industrial', 'equipment', 'machinery'],
    featured: false,
    isVisible: true,
    author: 'Jane Smith',
    createdAt: '2024-01-10T14:20:00Z',
    views: 189,
    likes: 12,
    metadata: {
      width: 1600,
      height: 900,
      size: 1892340,
      alt: 'Industrial machinery equipment'
    }
  },
  {
    id: '3',
    title: 'Grease Products',
    description: 'Premium quality grease for automotive applications',
    url: '/images/category/greases.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['grease', 'automotive', 'lubrication'],
    featured: true,
    isVisible: true,
    author: 'Mike Johnson',
    createdAt: '2024-01-08T09:45:00Z',
    views: 156,
    likes: 9,
    metadata: {
      width: 1440,
      height: 810,
      size: 1623540,
      alt: 'Automotive grease products'
    }
  },
  {
    id: '4',
    title: 'Motor Oil Collection',
    description: 'Complete range of motor oils for different vehicle types',
    url: '/images/category/mco.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['motor oil', 'automotive', 'vehicles'],
    featured: false,
    isVisible: true,
    author: 'Sarah Wilson',
    createdAt: '2024-01-05T16:30:00Z',
    views: 298,
    likes: 24,
    metadata: {
      width: 1800,
      height: 1200,
      size: 2156780,
      alt: 'Motor oil product collection'
    }
  },
  {
    id: '5',
    title: 'Gear Transmission Oil',
    description: 'Specialized gear oils for transmission systems',
    url: '/images/category/gto.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['gear oil', 'transmission', 'automotive'],
    featured: true,
    isVisible: true,
    author: 'David Brown',
    createdAt: '2024-01-03T11:15:00Z',
    views: 167,
    likes: 15,
    metadata: {
      width: 1600,
      height: 1000,
      size: 1789450,
      alt: 'Gear transmission oil products'
    }
  },
  {
    id: '6',
    title: 'Premium PCMO Range',
    description: 'Passenger car motor oils for superior engine protection',
    url: '/images/category/pcmo.jpg',
    type: 'image/jpeg',
    category: 'products',
    tags: ['pcmo', 'passenger car', 'engine protection'],
    featured: false,
    isVisible: true,
    author: 'Lisa Anderson',
    createdAt: '2024-01-01T08:00:00Z',
    views: 203,
    likes: 19,
    metadata: {
      width: 1920,
      height: 1280,
      size: 2345670,
      alt: 'Passenger car motor oil range'
    }
  }
];

const ProfessionalGalleryAdmin: React.FC = () => {
  // Core state
  const [items, setItems] = useState<GalleryItem[]>(mockGalleryItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    status: '',
    tags: [],
    dateRange: { start: '', end: '' },
    sortBy: 'newest',
    sortOrder: 'desc'
  });

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Loading state
  const [isLoading] = useState(false);

  // Stats calculation
  const stats = useMemo((): GalleryStats => {
    const visible = items.filter(item => item.isVisible).length;
    const featured = items.filter(item => item.featured).length;
    const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalLikes = items.reduce((sum, item) => sum + (item.likes || 0), 0);
    const storageUsed = items.reduce((sum, item) => sum + (item.metadata?.size || 0), 0);
    
    const categories = items.reduce((acc, item) => {
      if (item.category) {
        acc[item.category] = (acc[item.category] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    return {
      total: items.length,
      visible,
      featured,
      totalViews,
      totalLikes,
      storageUsed,
      categories
    };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }

      // Category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status === 'visible' && !item.isVisible) return false;
      if (filters.status === 'hidden' && item.isVisible) return false;
      if (filters.status === 'featured' && !item.featured) return false;

      // Tags filter
      if (filters.tags.length > 0 && !filters.tags.some(tag => item.tags?.includes(tag))) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'views':
          comparison = (a.views || 0) - (b.views || 0);
          break;
        case 'likes':
          comparison = (a.likes || 0) - (b.likes || 0);
          break;
        case 'oldest':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'newest':
        default:
          comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [items, searchQuery, filters]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [items]);

  // Event handlers
  const handleItemSelect = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  }, [filteredItems, selectedItems.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleBulkAction = useCallback(async (action: 'delete' | 'archive' | 'feature' | 'unfeature') => {
    const selectedIds = Array.from(selectedItems);
    
    switch (action) {
      case 'delete':
        setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
        break;
      case 'feature':
        setItems(prev => prev.map(item => 
          selectedIds.includes(item.id) ? { ...item, featured: true } : item
        ));
        break;
      case 'unfeature':
        setItems(prev => prev.map(item => 
          selectedIds.includes(item.id) ? { ...item, featured: false } : item
        ));
        break;
      case 'archive':
        setItems(prev => prev.map(item => 
          selectedIds.includes(item.id) ? { ...item, isVisible: false } : item
        ));
        break;
    }
    
    setSelectedItems(new Set());
  }, [selectedItems]);

  const handleItemPreview = useCallback((item: GalleryItem) => {
    const index = filteredItems.findIndex(i => i.id === item.id);
    setPreviewIndex(index >= 0 ? index : 0);
    setShowPreviewModal(true);
  }, [filteredItems]);

  const handleItemEdit = useCallback((item: GalleryItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  }, []);

  const handleSaveItem = useCallback((updatedItem: GalleryItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setShowEditModal(false);
    setEditingItem(null);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setShowEditModal(false);
    setEditingItem(null);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    // Refresh gallery items
    setShowUploadModal(false);
    // In real app, would refetch from API
  }, []);

  const handlePreviewIndexChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < filteredItems.length) {
      setPreviewIndex(newIndex);
      setPreviewItem(filteredItems[newIndex]);
    }
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Professional Gallery
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your media library with advanced tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Media
            </motion.button>
          </div>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search media by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Quick Filter */}
            <button className="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              <Filter className="w-5 h-5" />
              Quick Filter
            </button>
          </div>
        </div>

        {/* Gallery Controls */}
        <GalleryControls
          viewMode={transformViewMode(viewMode)}
          onViewModeChange={(mode) => setViewMode(mode === 'list' ? 'list' : 'grid')}
          sortBy={filters.sortBy || 'newest'}
          onSortChange={(sort) => setFilters({...filters, sortBy: sort as 'newest' | 'oldest' | 'title' | 'views' | 'likes'})}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={filters.category}
          onCategoryChange={(category) => setFilters({...filters, category})}
        />

        {/* Selection Toolbar */}
        <AnimatePresence>
          {isSelectionMode && (
            <SelectionToolbar
              selectedCount={selectedItems.size}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
            />
          )}
        </AnimatePresence>

        {/* Gallery Content */}
        <div className="mb-8">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <GalleryContent
              items={filteredItems.map(transformGalleryItem)}
              viewMode={transformViewMode(viewMode)}
              selectedItems={Array.from(selectedItems)}
              onToggleSelect={(id) => handleItemSelect(id)}
              onItemSelect={(item) => handleItemPreview(filteredItems.find(i => i.id === item.id)!)}
              onItemPreview={(item) => handleItemPreview(filteredItems.find(i => i.id === item.id)!)}
              onItemEdit={(item) => handleItemEdit(filteredItems.find(i => i.id === item.id)!)}
              onItemDelete={(item) => {
                // For now, just log the delete action
                console.log('Delete item:', item.id);
              }}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={async (files, metadata) => {
          console.log('Upload files:', files, metadata);
          setShowUploadModal(false);
        }}
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        item={editingItem ? {
          ...editingItem,
          status: editingItem.isVisible ? 'active' as const : 'archived' as const,
          imageUrl: editingItem.url,
          date: editingItem.createdAt || new Date().toISOString(),
          type: (editingItem.type === 'video' ? 'video' : 'image') as 'image' | 'video',
          views: editingItem.views || 0,
          likes: editingItem.likes || 0,
          tags: editingItem.tags || [],
          featured: editingItem.featured || false,
          category: (editingItem.category || 'products') as 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards'
        } : null}
        onSave={async (item) => {
          console.log('Save item:', item);
          setShowEditModal(false);
          setEditingItem(null);
        }}
      />

      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        item={filteredItems[previewIndex] ? {
          ...filteredItems[previewIndex],
          status: filteredItems[previewIndex].isVisible ? 'active' as const : 'archived' as const,
          imageUrl: filteredItems[previewIndex].url,
          date: filteredItems[previewIndex].createdAt || new Date().toISOString(),
          type: (filteredItems[previewIndex].type === 'video' ? 'video' : 'image') as 'image' | 'video',
          views: filteredItems[previewIndex].views || 0,
          likes: filteredItems[previewIndex].likes || 0,
          tags: filteredItems[previewIndex].tags || [],
          featured: filteredItems[previewIndex].featured || false,
          category: (filteredItems[previewIndex].category || 'products') as 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards'
        } : null}
      />
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Stats Bar Component
const StatsBar: React.FC<{ stats: GalleryStats }> = ({ stats }) => {
  const statItems = [
    {
      label: 'Total Items',
      value: stats.total.toLocaleString(),
      icon: Camera,
      color: 'blue'
    },
    {
      label: 'Visible',
      value: stats.visible.toLocaleString(),
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Featured',
      value: stats.featured.toLocaleString(),
      icon: Star,
      color: 'yellow'
    },
    {
      label: 'Total Views',
      value: stats.totalViews.toLocaleString(),
      icon: BarChart3,
      color: 'purple'
    },
    {
      label: 'Storage Used',
      value: `${(stats.storageUsed / 1024 / 1024).toFixed(1)}MB`,
      icon: Users,
      color: 'indigo'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stat.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfessionalGalleryAdmin;
