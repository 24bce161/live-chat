import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Shared modal used by every dialog in the app.
 *
 * It's rendered straight into <body> with createPortal. Without that, a parent
 * with `backdrop-filter` (the glass sidebar and header) traps the fixed overlay
 * inside the parent instead of covering the whole screen.
 *
 * Closes on the X button, a click on the dark background, or the Escape key.
 */
const Modal = ({ title, onClose, children, footer, className = '' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={`modal flex flex-col ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex-between p-4 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="btn-icon btn-ghost" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {children}

        {footer && (
          <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
