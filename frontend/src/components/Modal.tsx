import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '4xl' | '5xl' | '6xl';
  actions?: React.ReactNode; // footer actions
  hideCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
  initialFocusSelector?: string;
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl'
};

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = 'md',
  actions,
  hideCloseButton,
  className = '',
  children,
  initialFocusSelector
}) => {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(open);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Mount/unmount with animation
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      const t = setTimeout(() => setMounted(false), 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Keep latest onClose in ref to avoid effect re-running from identity changes
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Focus management & escape (runs only when open toggles true)
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) || null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const node = containerRef.current;
    if (node) {
      let focusTarget: HTMLElement | null = null;
      if (initialFocusSelector) {
        focusTarget = node.querySelector<HTMLElement>(initialFocusSelector);
      }
      if (!focusTarget) {
        const focusables = node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusTarget = focusables[0] || node;
      }
      focusTarget?.focus();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled'));
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

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = bodyOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, initialFocusSelector]);

  if (!mounted) return null;

  const backdropClasses = `fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`;
  const panelClasses = `relative w-full ${sizeMap[size]} mx-auto transform transition-all duration-300 ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'} focus:outline-none`;

  const panelInnerClasses = `group rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_10px_40px_-4px_rgba(0,0,0,0.3)] ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden ${className}`;

  const headerAccent = (
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 dark:from-brand-400 dark:via-brand-500 dark:to-brand-600" />
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className={backdropClasses} onClick={onClose} aria-hidden="true" />
      <div className={panelClasses} ref={containerRef}>
        <div className={panelInnerClasses}>
          {headerAccent}
          {(title || icon || !hideCloseButton) && (
            <div className="flex items-start gap-4 p-6 pb-4 relative">
              {icon && (
                <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/10 text-brand-700 dark:text-brand-300 ring-1 ring-inset ring-brand-600/15 dark:ring-brand-400/20">
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
              </div>
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-2 rounded-lg p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          <div className="px-6 pb-6 space-y-6">
            {children}
            {actions && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
