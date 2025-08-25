import React from 'react';
import { X, Download, Heart, Eye, Calendar, Tag } from 'lucide-react';

interface GalleryItem {
  id: string;
  imageUrl?: string;
  url?: string;
  title: string;
  date?: string;
  createdAt?: string;
  status: 'active' | 'archived';
  views: number;
  likes: number;
  tags: string[];
  featured: boolean;
  category: 'facility' | 'products' | 'events' | 'achievements' | 'team' | 'awards';
  description?: string;
  type: 'image' | 'video';
  updatedAt?: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  if (!isOpen || !item) return null;

  const imageUrl = item.imageUrl || item.url || '';
  const displayDate = item.date || item.createdAt || '';

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${item.title}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] p-4">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-white text-xl font-semibold truncate max-w-md">
              {item.title}
            </h2>
            {item.featured && (
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex items-center justify-center h-full pt-16 pb-24">
          {item.type === 'image' ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <video
              src={imageUrl}
              controls
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Side - Description and Tags */}
            <div>
              {item.description && (
                <div className="mb-3">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="flex items-center space-x-2 flex-wrap">
                  <Tag size={16} className="text-gray-400" />
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Stats and Meta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Category:</span>
                <span className="capitalize">{item.category}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.status === 'active' 
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm pt-2">
                <div className="flex items-center space-x-1">
                  <Eye size={16} className="text-gray-400" />
                  <span>{item.views.toLocaleString()} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart size={16} className="text-red-400" />
                  <span>{item.likes.toLocaleString()} likes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{new Date(displayDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
