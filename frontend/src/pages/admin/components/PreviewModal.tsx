import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Share2, 
  Info,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Eye,
  Calendar,
  User,
  Tag,
  Heart,
  MessageCircle,
  Send
} from 'lucide-react';
import { toast } from 'react-toastify';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  currentIndex, 
  onIndexChange 
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentItem = items[currentIndex];

  // Reset transform when item changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          resetTransform();
          break;
        case 'r':
          handleRotate();
          break;
        case 'i':
          setShowInfo(!showInfo);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case ' ':
          e.preventDefault();
          if (currentItem?.type?.startsWith('video')) {
            setIsPlaying(!isPlaying);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showInfo, isPlaying, currentIndex]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentItem.url || currentItem.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentItem.title || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentItem.title,
          text: currentItem.description,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      const url = `${window.location.origin}/gallery/${currentItem.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addComment = () => {
    if (newComment.trim()) {
      // In a real app, this would send to backend
      toast.success('Comment added');
      setNewComment('');
    }
  };

  if (!isOpen || !currentItem) return null;

  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">
              {currentIndex + 1} of {items.length}
            </span>
            <span className="text-sm text-white/70">•</span>
            <span className="text-sm text-white/70">{currentItem.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded-lg transition-colors ${
                showInfo ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
              title="Info (I)"
            >
              <Info className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-full">
        {/* Media Viewer */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 z-10 p-3 bg-black/30 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === items.length - 1}
                className="absolute right-4 z-10 p-3 bg-black/30 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all"
                title="Next (→)"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Media Content */}
          <div
            className="relative max-w-full max-h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            {currentItem.type?.startsWith('image') ? (
              <img
                src={currentItem.url || currentItem.src}
                alt={currentItem.title}
                className="max-w-full max-h-full object-contain select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                draggable={false}
              />
            ) : currentItem.type?.startsWith('video') ? (
              <video
                src={currentItem.url || currentItem.src}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay={isPlaying}
                muted={isMuted}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
              />
            ) : (
              <div className="flex items-center justify-center w-96 h-96 bg-slate-800 rounded-lg">
                <div className="text-center text-white">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Preview not available</p>
                  <p className="text-sm opacity-70">{currentItem.type}</p>
                </div>
              </div>
            )}
          </div>

          {/* Media Controls */}
          {currentItem.type?.startsWith('image') && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full p-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-white text-sm min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title="Rotate (R)"
                >
                  <RotateCw className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={resetTransform}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-xs"
                  title="Reset (0)"
                >
                  1:1
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              className="w-80 bg-black/80 backdrop-blur-sm border-l border-white/10 overflow-y-auto"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">{currentItem.title}</h3>
                
                {currentItem.description && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white/70 mb-2">Description</h4>
                    <p className="text-sm leading-relaxed">{currentItem.description}</p>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-white/50" />
                    <span>{currentItem.createdAt ? new Date(currentItem.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                  </div>
                  
                  {currentItem.author && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-white/50" />
                      <span>{currentItem.author}</span>
                    </div>
                  )}
                  
                  {currentItem.category && (
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="w-4 h-4 text-white/50" />
                      <span className="capitalize">{currentItem.category}</span>
                    </div>
                  )}

                  {currentItem.tags && currentItem.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentItem.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/10 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {currentItem.metadata && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-white/70 mb-3">File Info</h4>
                    <div className="space-y-2 text-xs text-white/60">
                      {currentItem.metadata.width && currentItem.metadata.height && (
                        <div className="flex justify-between">
                          <span>Dimensions:</span>
                          <span>{currentItem.metadata.width} × {currentItem.metadata.height}</span>
                        </div>
                      )}
                      {currentItem.metadata.size && (
                        <div className="flex justify-between">
                          <span>File Size:</span>
                          <span>{(currentItem.metadata.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                      {currentItem.type && (
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="uppercase">{currentItem.type.split('/')[1]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mb-6">
                  <button className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
                    <Heart className="w-4 h-4" />
                    Like
                  </button>
                  <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Comments
                  </button>
                </div>

                {/* Comments Section */}
                {showComments && (
                  <div>
                    <h4 className="text-sm font-medium text-white/70 mb-3">Comments</h4>
                    
                    {/* Add Comment */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30"
                        onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      />
                      <button
                        onClick={addComment}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      <div className="text-sm text-white/60 text-center py-4">
                        No comments yet. Be the first to comment!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnail Strip */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <div className="flex gap-2 overflow-x-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onIndexChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-transparent hover:border-white/50'
                }`}
              >
                <img
                  src={item.thumbnail || item.url || item.src}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
