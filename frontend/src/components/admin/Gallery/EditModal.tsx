import React, { useState, useEffect } from 'react';
import { X, Star, StarOff } from 'lucide-react';

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
  isVisible?: boolean;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GalleryItem | null;
  onSave: (item: GalleryItem) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GalleryItem['category']>('products');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setCategory(item.category);
      setTags(item.tags.join(', '));
      setFeatured(item.featured);
      setStatus(item.status);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedItem: GalleryItem = {
        ...item,
        title,
        description,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featured,
        status,
        updatedAt: new Date().toISOString()
      };

      await onSave(updatedItem);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = item.imageUrl || item.url || '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Media
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex">
          {/* Image Preview */}
          <div className="w-1/2 p-6">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={imageUrl}
                alt={item.title}
                className="w-full h-64 object-cover"
              />
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Type: {item.type}</p>
              <p>Created: {new Date(item.createdAt || item.date || '').toLocaleDateString()}</p>
              <p>Views: {item.views}</p>
              <p>Likes: {item.likes}</p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="w-1/2 p-6 border-l border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GalleryItem['category'])}
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
              <div>
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
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Featured */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Featured
                  </span>
                  {featured ? (
                    <Star size={16} className="ml-2 text-yellow-500" />
                  ) : (
                    <StarOff size={16} className="ml-2 text-gray-400" />
                  )}
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
