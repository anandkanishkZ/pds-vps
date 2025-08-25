import React from 'react';
import { Grid, List, Filter, SortAsc, Search } from 'lucide-react';

interface GalleryControlsProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const GalleryControls: React.FC<GalleryControlsProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange
}) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'facility', label: 'Facility' },
    { value: 'products', label: 'Products' },
    { value: 'events', label: 'Events' },
    { value: 'achievements', label: 'Achievements' },
    { value: 'team', label: 'Team' },
    { value: 'awards', label: 'Awards' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'likes', label: 'Most Liked' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SortAsc size={20} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              } transition-colors`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              } transition-colors`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryControls;
