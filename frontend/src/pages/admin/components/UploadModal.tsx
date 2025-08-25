import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileUpload {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
  };
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      return true;
    });

    const uploads: FileUpload[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploads]);

    // Get image metadata
    uploads.forEach(upload => {
      const img = new Image();
      img.onload = () => {
        setFiles(prev => prev.map(f => 
          f.id === upload.id 
            ? { 
                ...f, 
                metadata: {
                  width: img.width,
                  height: img.height,
                  size: upload.file.size,
                  type: upload.file.type
                }
              }
            : f
        ));
      };
      img.src = upload.preview;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    for (const file of files) {
      if (file.status !== 'pending') continue;

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' as const } : f
        ));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }

        // Simulate processing
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing' as const } : f
        ));
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark as completed
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'completed' as const, progress: 100 } : f
        ));

        toast.success(`${file.file.name} uploaded successfully`);
      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error' as const, 
            error: 'Upload failed' 
          } : f
        ));
        toast.error(`Failed to upload ${file.file.name}`);
      }
    }

    setUploading(false);
    
    // Wait a moment then trigger success callback
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1000);
  };

  const clearCompleted = () => {
    setFiles(prev => {
      const toRemove = prev.filter(f => f.status === 'completed');
      toRemove.forEach(f => URL.revokeObjectURL(f.preview));
      return prev.filter(f => f.status !== 'completed');
    });
  };

  const retryFailed = () => {
    setFiles(prev => prev.map(f => 
      f.status === 'error' ? { ...f, status: 'pending', error: undefined } : f
    ));
  };

  if (!isOpen) return null;

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
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Upload Media</h2>
                <p className="text-sm text-white/90">
                  Drag & drop files or click to browse
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Drop Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Supports: JPG, PNG, GIF, WebP • Max file size: 10MB
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Choose Files
                </motion.button>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Files ({files.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {files.some(f => f.status === 'completed') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearCompleted}
                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        Clear Completed
                      </motion.button>
                    )}
                    {files.some(f => f.status === 'error') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={retryFailed}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Retry Failed
                      </motion.button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {files.map((file) => (
                    <FileUploadItem
                      key={file.id}
                      file={file}
                      onRemove={() => removeFile(file.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {files.length > 0 && (
            <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {files.filter(f => f.status === 'completed').length} of {files.length} uploaded
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={uploadFiles}
                    disabled={uploading || files.every(f => f.status !== 'pending')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload {files.filter(f => f.status === 'pending').length} Files
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};

// File Upload Item Component
const FileUploadItem: React.FC<{
  file: FileUpload;
  onRemove: () => void;
}> = ({ file, onRemove }) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <FileText className="w-4 h-4 text-slate-400" />;
      case 'uploading':
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Upload complete';
      case 'error':
        return file.error || 'Upload failed';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      {/* Preview */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={file.preview}
          alt={file.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon()}
          <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate">
            {file.file.name}
          </h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {getStatusText()}
        </p>
        {file.metadata && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {file.metadata.width}×{file.metadata.height} • {(file.metadata.size / 1024 / 1024).toFixed(1)}MB
          </p>
        )}

        {/* Progress Bar */}
        {(file.status === 'uploading' || file.status === 'processing') && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                file.status === 'processing' 
                  ? 'bg-yellow-500 animate-pulse' 
                  : 'bg-blue-500'
              }`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0">
        {file.status === 'pending' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
};
