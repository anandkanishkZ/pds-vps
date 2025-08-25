import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Archive, 
  Star, 
  StarOff
} from 'lucide-react';

// Selection Toolbar Component
export const SelectionToolbar: React.FC<{
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkAction: (action: string) => Promise<void>;
  onClearSelection: () => void;
}> = ({ selectedCount, totalCount, onSelectAll, onBulkAction, onClearSelection }) => {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const bulkActions = [
    {
      id: 'feature',
      label: 'Make Featured',
      icon: Star,
      color: 'yellow',
      confirm: false
    },
    {
      id: 'unfeature',
      label: 'Remove Featured',
      icon: StarOff,
      color: 'gray',
      confirm: false
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'orange',
      confirm: true
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'red',
      confirm: true
    }
  ];

  const handleBulkAction = async (action: string) => {
    const actionConfig = bulkActions.find(a => a.id === action);
    if (actionConfig?.confirm) {
      const confirmed = window.confirm(
        `Are you sure you want to ${action} ${selectedCount} selected items? This action cannot be undone.`
      );
      if (!confirmed) return;
    }
    
    await onBulkAction(action);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
    >
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAll}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
        >
          {isAllSelected ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </motion.button>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {selectedCount}
          </span> of {totalCount} items selected
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {bulkActions.slice(0, 2).map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBulkAction(action.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  action.color === 'yellow' 
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
                title={action.label}
              >
                <action.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>

          {/* Dangerous Actions */}
          <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-600 pl-2 ml-2">
            {bulkActions.slice(2).map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBulkAction(action.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  action.color === 'red'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30'
                }`}
                title={action.label}
              >
                <action.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>

          {/* Clear Selection */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearSelection}
            className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200"
          >
            Clear
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
