import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen }) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create or get the modal root element
    let root = document.getElementById('modal-root');
    
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      root.style.position = 'fixed';
      root.style.top = '0';
      root.style.left = '0';
      root.style.zIndex = '99999';
      root.style.pointerEvents = 'auto';
      document.body.appendChild(root);
    }
    
    setModalRoot(root);
    
    return () => {
      // Don't remove the root on unmount, it might be used by other modals
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Add modal-open class to body for additional styling if needed
      document.body.classList.add('modal-open');
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!modalRoot || !isOpen) {
    return null;
  }

  return createPortal(
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto'
      }}
    >
      {children}
    </div>,
    modalRoot
  );
};

export default ModalPortal;
