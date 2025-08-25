import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Heart, 
  Star, 
  Calendar, 
  MapPin, 
  Edit3, 
  CheckSquare, 
  Square,
  Image as ImageIcon,
  Tag
} from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  category: 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards';
  tags: string[];
  imageUrl: string;
  thumbnailUrl?: string;
  date: string;
  location?: string;
  featured: boolean;
  status: 'active' | 'archived' | 'draft';
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    photographer?: string;
    camera?: string;
    lens?: string;
    settings?: string;
  };
}

interface ViewMode {
  type: 'grid' | 'masonry' | 'carousel' | 'timeline' | 'list';
  size: 'small' | 'medium' | 'large';
}

// Gallery Content Component
export const GalleryContent: React.FC<{
  items: GalleryItem[];
  viewMode: ViewMode;
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  onItemPreview: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
}> = ({ 
  items, 
  viewMode, 
  isSelectionMode, 
  selectedItems, 
  onItemSelect, 
  onItemPreview, 
  onItemEdit 
}) => {
  if (items.length === 0) {
    return <EmptyState />;
  }

  switch (viewMode.type) {
    case 'grid':
      return (
        <GridView 
          items={items} 
          size={viewMode.size} 
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemPreview={onItemPreview}
          onItemEdit={onItemEdit}
        />
      );
    case 'masonry':
      return (
        <MasonryView 
          items={items} 
          size={viewMode.size} 
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemPreview={onItemPreview}
          onItemEdit={onItemEdit}
        />
      );
    case 'list':
      return (
        <ListView 
          items={items} 
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemPreview={onItemPreview}
          onItemEdit={onItemEdit}
        />
      );
    case 'timeline':
      return (
        <TimelineView 
          items={items} 
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemPreview={onItemPreview}
          onItemEdit={onItemEdit}
        />
      );
    default:
      return (
        <GridView 
          items={items} 
          size={viewMode.size} 
          isSelectionMode={isSelectionMode}
          selectedItems={selectedItems}
          onItemSelect={onItemSelect}
          onItemPreview={onItemPreview}
          onItemEdit={onItemEdit}
        />
      );
  }
};

// Grid View Component
const GridView: React.FC<{
  items: GalleryItem[];
  size: 'small' | 'medium' | 'large';
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  onItemPreview: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
}> = ({ items, size, isSelectionMode, selectedItems, onItemSelect, onItemPreview, onItemEdit }) => {
  const getGridCols = () => {
    switch (size) {
      case 'small': return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
      case 'medium': return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 'large': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-6`}>
      {items.map((item, index) => (
        <GalleryCard
          key={item.id}
          item={item}
          index={index}
          size={size}
          isSelectionMode={isSelectionMode}
          isSelected={selectedItems.has(item.id)}
          onSelect={() => onItemSelect(item.id)}
          onPreview={() => onItemPreview(item)}
          onEdit={() => onItemEdit(item)}
        />
      ))}
    </div>
  );
};

// Masonry View Component
const MasonryView: React.FC<{
  items: GalleryItem[];
  size: 'small' | 'medium' | 'large';
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  onItemPreview: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
}> = ({ items, size, isSelectionMode, selectedItems, onItemSelect, onItemPreview, onItemEdit }) => {
  const getCols = () => {
    switch (size) {
      case 'small': return 4;
      case 'medium': return 3;
      case 'large': return 2;
      default: return 3;
    }
  };

  const cols = getCols();
  const columns = Array.from({ length: cols }, () => [] as GalleryItem[]);
  
  items.forEach((item, index) => {
    columns[index % cols].push(item);
  });

  return (
    <div className={`grid grid-cols-${cols} gap-6`}>
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="space-y-6">
          {column.map((item, index) => (
            <GalleryCard
              key={item.id}
              item={item}
              index={index}
              size={size}
              isSelectionMode={isSelectionMode}
              isSelected={selectedItems.has(item.id)}
              onSelect={() => onItemSelect(item.id)}
              onPreview={() => onItemPreview(item)}
              onEdit={() => onItemEdit(item)}
              variant="masonry"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// List View Component
const ListView: React.FC<{
  items: GalleryItem[];
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  onItemPreview: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
}> = ({ items, isSelectionMode, selectedItems, onItemSelect, onItemPreview, onItemEdit }) => {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center gap-4 p-4">
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onItemSelect(item.id)}
                className="flex-shrink-0"
              >
                {selectedItems.has(item.id) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </motion.button>
            )}

            {/* Thumbnail */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
              <img
                src={item.thumbnailUrl || item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {item.likes}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {item.featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  <CategoryBadge category={item.category} />
                  <StatusBadge status={item.status} />
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onItemPreview(item)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onItemEdit(item)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Timeline View Component
const TimelineView: React.FC<{
  items: GalleryItem[];
  isSelectionMode: boolean;
  selectedItems: Set<string>;
  onItemSelect: (id: string) => void;
  onItemPreview: (item: GalleryItem) => void;
  onItemEdit: (item: GalleryItem) => void;
}> = ({ items, isSelectionMode, selectedItems, onItemSelect, onItemPreview, onItemEdit }) => {
  // Group items by date
  const groupedItems = items.reduce((groups, item) => {
    const date = new Date(item.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, GalleryItem[]>);

  const sortedDates = Object.keys(groupedItems).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-8">
      {sortedDates.map((date, dateIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dateIndex * 0.1 }}
          className="relative"
        >
          {/* Date Header */}
          <div className="sticky top-32 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {groupedItems[date].length} item{groupedItems[date].length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedItems[date].map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                index={index}
                size="medium"
                isSelectionMode={isSelectionMode}
                isSelected={selectedItems.has(item.id)}
                onSelect={() => onItemSelect(item.id)}
                onPreview={() => onItemPreview(item)}
                onEdit={() => onItemEdit(item)}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Gallery Card Component
const GalleryCard: React.FC<{
  item: GalleryItem;
  index: number;
  size: 'small' | 'medium' | 'large';
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onEdit: () => void;
  variant?: 'grid' | 'masonry';
}> = ({ 
  item, 
  index, 
  size, 
  isSelectionMode, 
  isSelected, 
  onSelect, 
  onPreview, 
  onEdit,
  variant = 'grid' 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const getAspectRatio = () => {
    if (variant === 'masonry') return 'aspect-auto';
    switch (size) {
      case 'small': return 'aspect-square';
      case 'medium': return 'aspect-[4/3]';
      case 'large': return 'aspect-[3/2]';
      default: return 'aspect-[4/3]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setShowActions(false)}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''
      }`}
    >
      {/* Image Container */}
      <div className={`relative ${getAspectRatio()} overflow-hidden`}>
        {/* Image */}
        <img
          src={item.thumbnailUrl || item.imageUrl}
          alt={item.title}
          className={`w-full h-full object-cover transition-all duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${showActions ? 'scale-110' : 'scale-100'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}

        {/* Selection checkbox */}
        {isSelectionMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onSelect}
            className="absolute top-3 left-3 z-10"
          >
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-1">
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </motion.button>
        )}

        {/* Status indicators */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {item.featured && (
            <div className="bg-yellow-500 text-white rounded-full p-1">
              <Star className="w-3 h-3 fill-current" />
            </div>
          )}
          <StatusBadge status={item.status} size="small" />
        </div>

        {/* Action overlay */}
        <AnimatePresence>
          {(showActions || isSelectionMode) && !isSelectionMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPreview}
                  className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 p-3 rounded-full hover:bg-white dark:hover:bg-slate-900 transition-all duration-200"
                >
                  <Eye className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onEdit}
                  className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 p-3 rounded-full hover:bg-white dark:hover:bg-slate-900 transition-all duration-200"
                >
                  <Edit3 className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
            {item.title}
          </h3>
          <CategoryBadge category={item.category} />
        </div>

        {size !== 'small' && item.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {item.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {item.likes}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.date).toLocaleDateString()}
          </span>
        </div>

        {/* Tags */}
        {size !== 'small' && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
              >
                <Tag className="w-2 h-2" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Helper Components
const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'facility': return { emoji: '🏢', color: 'blue' };
      case 'products': return { emoji: '📦', color: 'green' };
      case 'events': return { emoji: '🎉', color: 'purple' };
      case 'achievements': return { emoji: '🏆', color: 'yellow' };
      case 'team': return { emoji: '👥', color: 'indigo' };
      case 'awards': return { emoji: '🥇', color: 'orange' };
      default: return { emoji: '📁', color: 'gray' };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${config.color}-100 dark:bg-${config.color}-900/20 text-${config.color}-700 dark:text-${config.color}-300 text-xs rounded-full font-medium`}>
      {config.emoji}
      {category}
    </span>
  );
};

const StatusBadge: React.FC<{ status: string; size?: 'small' | 'normal' }> = ({ status, size = 'normal' }) => {
  const getStatusConfig = (stat: string) => {
    switch (stat) {
      case 'active': return { label: 'Active', color: 'green', dot: '●' };
      case 'archived': return { label: 'Archived', color: 'orange', dot: '●' };
      case 'draft': return { label: 'Draft', color: 'gray', dot: '●' };
      default: return { label: 'Unknown', color: 'gray', dot: '●' };
    }
  };

  const config = getStatusConfig(status);
  const isSmall = size === 'small';

  return (
    <span className={`inline-flex items-center gap-1 ${
      isSmall ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
    } bg-${config.color}-100 dark:bg-${config.color}-900/20 text-${config.color}-700 dark:text-${config.color}-300 rounded-full font-medium`}>
      <span className={`text-${config.color}-500`}>{config.dot}</span>
      {!isSmall && config.label}
    </span>
  );
};

// Empty State Component
const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <ImageIcon className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No gallery items found
      </h3>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
        Get started by uploading your first image or adjusting your search filters to find existing content.
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <ImageIcon className="w-5 h-5" />
        Upload First Image
      </motion.button>
    </div>
  );
};
