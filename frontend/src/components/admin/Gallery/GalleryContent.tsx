import React from 'react';
import { motion } from 'framer-motion';

interface GalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  status: 'active' | 'archived';
  views: number;
  likes: number;
  tags: string[];
  featured: boolean;
  category: 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards';
  description?: string;
  type: 'image' | 'video';
  createdAt: string;
  updatedAt: string;
}

interface GalleryContentProps {
  items: GalleryItem[];
  viewMode: 'grid' | 'list';
  onItemSelect: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
  onItemDelete: (item: GalleryItem) => void;
  onItemPreview: (item: GalleryItem) => void;
  selectedItems: string[];
  onToggleSelect: (id: string) => void;
}

const GalleryContent: React.FC<GalleryContentProps> = ({
  items,
  viewMode,
  onItemSelect,
  onItemEdit,
  onItemDelete,
  onItemPreview,
  selectedItems,
  onToggleSelect
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No media found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload some media files to get started with your gallery.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 ${
              selectedItems.includes(item.id)
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => onToggleSelect(item.id)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>

            {/* Featured Badge */}
            {item.featured && (
              <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </div>
            )}

            {/* Image */}
            <div className="aspect-w-16 aspect-h-9 relative overflow-hidden rounded-t-lg">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => onItemPreview(item)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200" />
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-white truncate mb-2">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>{new Date(item.date).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {item.status}
                </span>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>{item.views} views</span>
                <span>{item.likes} likes</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onItemEdit(item)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onItemDelete(item)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-4 transition-all duration-200 ${
            selectedItems.includes(item.id)
              ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-center space-x-4">
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => onToggleSelect(item.id)}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />

            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onItemPreview(item)}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                  {item.title}
                </h3>
                {item.featured && (
                  <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Featured
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>{new Date(item.date).toLocaleDateString()}</span>
                <span>{item.views} views</span>
                <span>{item.likes} likes</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onItemEdit(item)}
                className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onItemDelete(item)}
                className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium border border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default GalleryContent;
