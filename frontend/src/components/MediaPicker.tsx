import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Check,
  Grid3X3,
  FolderOpen,
  Calendar,
  File
} from 'lucide-react';
import { 
  listMedia, 
  directMediaUploadWithProgress, 
  auth,
  type MediaLibraryItem,
  API_BASE 
} from '../lib/api';
import { toast } from 'react-toastify';

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  title?: string;
  allowedTypes?: string[];
  multiple?: boolean;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "Select Media",
  allowedTypes = ['image'],
  multiple = false 
}) => {
  const token = auth.getToken();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isVisible, setIsVisible] = useState(false);

  // Load media items
  const loadMedia = useCallback(async () => {
    if (!token || !isOpen) return;
    
    try {
      setLoading(true);
      const response = await listMedia(token, { 
        pageSize: 100,
        q: searchTerm || undefined,
        type: allowedTypes.length === 1 ? allowedTypes[0] : undefined
      });
      
      // Normalize URLs
      const base = API_BASE.replace(/\/$/, '');
      const items = response.data.map(item => ({
        ...item,
        url: item.url.startsWith('http') ? item.url : base + (item.url.startsWith('/') ? item.url : '/' + item.url)
      }));
      
      setMediaItems(items);
    } catch (error) {
      console.error('Failed to load media:', error);
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  }, [token, isOpen, searchTerm, allowedTypes]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!token) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const result = await directMediaUploadWithProgress(
        token, 
        file, 
        { type: 'image' },
        (progress) => setUploadProgress(Math.round(progress * 100))
      );
      
      toast.success('Image uploaded successfully');
      
      // Add to media items
      const base = API_BASE.replace(/\/$/, '');
      const newItem: MediaLibraryItem = {
        id: result.id,
        productId: null,
        productName: null,
        type: result.type,
        url: result.url.startsWith('http') ? result.url : base + (result.url.startsWith('/') ? result.url : '/' + result.url),
        altText: result.altText || null,
        createdAt: new Date().toISOString()
      };
      
      setMediaItems(prev => [newItem, ...prev]);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [token]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFileUpload(imageFiles[0]);
    }
  }, [handleFileUpload]);

  // Handle item selection
  const handleItemSelect = (item: MediaLibraryItem) => {
    if (!multiple) {
      onSelect(item.url);
      onClose();
      return;
    }
    
    setSelectedItems(prev => {
      if (prev.includes(item.url)) {
        return prev.filter(url => url !== item.url);
      } else {
        return [...prev, item.url];
      }
    });
  };

  // Handle multiple selection confirm
  const handleMultipleSelect = () => {
    if (selectedItems.length > 0) {
      // For multiple selection, you might want to modify the onSelect callback
      // For now, we'll just select the first one
      onSelect(selectedItems[0]);
      onClose();
    }
  };

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setSelectedItems([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter media items
  const filteredItems = mediaItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.altText?.toLowerCase().includes(term) ||
      item.productName?.toLowerCase().includes(term) ||
      item.type?.toLowerCase().includes(term)
    );
  });

  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[100] bg-slate-950/75 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`relative w-[min(1200px,95vw)] max-w-[95vw] h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose from your media library or upload new images</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-200"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-200"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              
              <label className="relative cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95">
                <Upload className="h-4 w-4" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="flex-none px-6 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-200/50 dark:border-brand-800/50">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-700 dark:text-brand-300">Uploading...</span>
                  <span className="text-brand-600 dark:text-brand-400">{uploadProgress}%</span>
                </div>
                <div className="mt-1 w-full bg-brand-200 dark:bg-brand-800 rounded-full h-2">
                  <div 
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading media library...</span>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center h-full text-slate-500 border-2 border-dashed border-slate-300 dark:border-slate-600 m-6 rounded-xl"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <FolderOpen className="h-12 w-12 mb-3 text-slate-400" />
              <p className="text-lg font-medium mb-1">No media found</p>
              <p className="text-sm text-center max-w-sm mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first image to get started'}
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all duration-200">
                <Upload className="h-4 w-4" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="p-6">
              <div className={`grid gap-4 ${viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : 'grid-cols-1'}`}>
                {filteredItems.map((item) => (
                  <div
                    key={item.url}
                    onClick={() => handleItemSelect(item)}
                    className={`relative group cursor-pointer rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-brand-500/50 transition-all duration-200 transform hover:scale-[1.02] ${
                      selectedItems.includes(item.url) 
                        ? 'ring-2 ring-brand-500' 
                        : ''
                    }`}
                  >
                    {/* Image */}
                    <div className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-[16/9]'} bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden`}>
                      {item.url ? (
                        <img 
                          src={item.url} 
                          alt={item.altText || 'Media item'} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      )}
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                    {/* Selection indicator */}
                    {selectedItems.includes(item.url) && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Info */}
                    {viewMode === 'list' && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <p className="text-sm font-medium truncate">
                          {item.altText || item.productName || 'Untitled'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-white/80 mt-1">
                          <File className="h-3 w-3" />
                          <span>{item.type}</span>
                          {item.createdAt && (
                            <>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hover info for grid mode */}
                    {viewMode === 'grid' && (
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <p className="text-xs text-white font-medium truncate bg-black/60 px-2 py-1 rounded">
                          {item.altText || item.productName || 'Untitled'}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer for multiple selection */}
        {multiple && selectedItems.length > 0 && (
          <div className="flex-none px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200"
                >
                  Clear
                </button>
                <button
                  onClick={handleMultipleSelect}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default MediaPicker;
