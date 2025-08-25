import React from 'react';
import { Trash2, Archive, Star, StarOff, X } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string) => Promise<void>;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkAction
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onClearSelection}
          className="text-blue-200 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onBulkAction('archive')}
          className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
        >
          <Archive size={16} />
          <span>Archive</span>
        </button>
        <button
          onClick={() => onBulkAction('feature')}
          className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
        >
          <Star size={16} />
          <span>Feature</span>
        </button>
        <button
          onClick={() => onBulkAction('unfeature')}
          className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
        >
          <StarOff size={16} />
          <span>Unfeature</span>
        </button>
        <button
          onClick={() => onBulkAction('delete')}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center space-x-1 transition-colors"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default SelectionToolbar;
