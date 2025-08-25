import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], metadata: any) => Promise<void>;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('products');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    try {
      const metadata = {
        title,
        description,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featured
      };
      await onUpload(files, metadata);
      setFiles([]);
      setTitle('');
      setDescription('');
      setCategory('products');
      setTags('');
      setFeatured(false);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload Media
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Files
            </label>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Drop files here or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: Images (JPG, PNG, GIF) and Videos (MP4, WebM)
                </p>
              </label>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Files ({files.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon size={16} className="text-blue-600" />
                      ) : (
                        <Video size={16} className="text-green-600" />
                      )}
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter media title..."
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter media description..."
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="facility">Facility</option>
              <option value="products">Products</option>
              <option value="events">Events</option>
              <option value="achievements">Achievements</option>
              <option value="team">Team</option>
              <option value="awards">Awards</option>
            </select>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter tags separated by commas..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Example: automotive, lubricants, industrial
            </p>
          </div>

          {/* Featured */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mark as featured
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || !title || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
