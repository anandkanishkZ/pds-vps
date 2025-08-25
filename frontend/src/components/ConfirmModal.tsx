import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon: Icon = AlertTriangle,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) || null;
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside dialog
    const root = dialogRef.current;
    if (root) {
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusables[0] || root).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus
      if (previouslyFocused.current) previouslyFocused.current.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm mx-4" ref={dialogRef}>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/10 text-rose-700 dark:text-rose-300">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                {description && (
                  <p id={descId} className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-2 text-sm font-semibold rounded-lg text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:ring-rose-900/40 dark:hover:bg-rose-900/20"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
