import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid3X3, 
  List, 
  Columns3, 
  Calendar, 
  SortAsc, 
  SortDesc,
  Eye,
  Heart,
  Star,
  Clock,
  Filter
} from 'lucide-react';

interface ViewMode {
  type: 'grid' | 'masonry' | 'carousel' | 'timeline' | 'list';
  size: 'small' | 'medium' | 'large';
}

interface FilterOptions {
  category: string[];
  status: string[];
  featured: boolean | null;
  dateRange: { start: string; end: string } | null;
  tags: string[];
  sortBy: 'date' | 'title' | 'views' | 'likes' | 'featured';
  sortOrder: 'asc' | 'desc';
}

// View Mode Selector Component
export const ViewModeSelector: React.FC<{
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}> = ({ viewMode, setViewMode }) => {
  const viewModes = [
    { type: 'grid' as const, icon: Grid3X3, label: 'Grid' },
    { type: 'masonry' as const, icon: Columns3, label: 'Masonry' },
    { type: 'list' as const, icon: List, label: 'List' },
    { type: 'timeline' as const, icon: Calendar, label: 'Timeline' }
  ];

  const sizes = [
    { size: 'small' as const, label: 'S' },
    { size: 'medium' as const, label: 'M' },
    { size: 'large' as const, label: 'L' }
  ];

  return (
    <div className="flex items-center gap-2">
      {/* View Type */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
        {viewModes.map((mode) => (
          <motion.button
            key={mode.type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode({ ...viewMode, type: mode.type })}
            className={`p-2 transition-all duration-200 ${
              viewMode.type === mode.type
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={mode.label}
          >
            <mode.icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      {/* Size Selector */}
      {(viewMode.type === 'grid' || viewMode.type === 'masonry') && (
        <div className="flex bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
          {sizes.map((size) => (
            <motion.button
              key={size.size}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode({ ...viewMode, size: size.size })}
              className={`px-3 py-2 text-xs font-medium transition-all duration-200 ${
                viewMode.size === size.size
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {size.label}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

// Sort Selector Component
export const SortSelector: React.FC<{
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
}> = ({ filters, setFilters }) => {
  const sortOptions = [
    { value: 'date', label: 'Date', icon: Clock },
    { value: 'title', label: 'Title', icon: SortAsc },
    { value: 'views', label: 'Views', icon: Eye },
    { value: 'likes', label: 'Likes', icon: Heart },
    { value: 'featured', label: 'Featured', icon: Star }
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={filters.sortBy}
        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Sort by {option.label}
          </option>
        ))}
      </select>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setFilters({ 
          ...filters, 
          sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
        })}
        className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
        title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
      >
        {filters.sortOrder === 'asc' ? (
          <SortAsc className="w-4 h-4" />
        ) : (
          <SortDesc className="w-4 h-4" />
        )}
      </motion.button>
    </div>
  );
};

// Advanced Filters Component
export const AdvancedFilters: React.FC<{
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  allTags: string[];
}> = ({ filters, setFilters, allTags }) => {
  const categories = [
    { value: 'facility', label: '🏢 Facilities' },
    { value: 'products', label: '📦 Products' },
    { value: 'events', label: '🎉 Events' },
    { value: 'achievements', label: '🏆 Achievements' },
    { value: 'team', label: '👥 Team' },
    { value: 'awards', label: '🥇 Awards' }
  ];

  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'archived', label: '📁 Archived' },
    { value: 'draft', label: '📝 Draft' }
  ];

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category];
    setFilters({ ...filters, category: newCategories });
  };

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    setFilters({ ...filters, status: newStatuses });
  };

  const handleTagChange = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    setFilters({ ...filters, tags: newTags });
  };

  const clearAllFilters = () => {
    setFilters({
      category: [],
      status: [],
      featured: null,
      dateRange: null,
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Advanced Filters
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          Clear All
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Categories
          </h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.category.includes(category.value)}
                  onChange={() => handleCategoryChange(category.value)}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {category.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Status
          </h4>
          <div className="space-y-2">
            {statuses.map((status) => (
              <label
                key={status.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(status.value)}
                  onChange={() => handleStatusChange(status.value)}
                  className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {status.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Featured */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Featured
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="featured"
                checked={filters.featured === true}
                onChange={() => setFilters({ ...filters, featured: true })}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                ⭐ Featured Only
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="featured"
                checked={filters.featured === false}
                onChange={() => setFilters({ ...filters, featured: false })}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Regular Items
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="featured"
                checked={filters.featured === null}
                onChange={() => setFilters({ ...filters, featured: null })}
                className="w-4 h-4 text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                All Items
              </span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Date Range
          </h4>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: e.target.value 
                  ? { start: e.target.value, end: filters.dateRange?.end || e.target.value }
                  : null
              })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: filters.dateRange?.start && e.target.value
                  ? { start: filters.dateRange.start, end: e.target.value }
                  : null
              })}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <motion.button
                key={tag}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  filters.tags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Gallery Controls Component
export const GalleryControls: React.FC<{
  viewMode: any;
  setViewMode: (mode: any) => void;
  filters: any;
  setFilters: (filters: any) => void;
  allTags: string[];
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  itemCount: number;
}> = ({ 
  viewMode, 
  setViewMode, 
  filters, 
  setFilters, 
  allTags, 
  isSelectionMode, 
  setIsSelectionMode, 
  itemCount 
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
      {/* Top Row - View Mode, Sort, Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />
          <SortSelector filters={filters} setFilters={setFilters} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {itemCount} items
          </span>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Advanced Filters
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isSelectionMode
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {isSelectionMode ? 'Exit Selection' : 'Select Items'}
          </motion.button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200 dark:border-slate-700 pt-6 overflow-hidden"
          >
            <AdvancedFilters
              filters={filters}
              setFilters={setFilters}
              allTags={allTags}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
