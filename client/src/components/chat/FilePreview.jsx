import React, { useEffect, useState } from 'react';
import { X, File } from 'lucide-react';

/**
 * Preview of the file picked in the message box, before it's sent.
 */
const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [src, setSrc] = useState(null);

  // Create the preview URL once per file (not on every render) and free it afterwards
  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-[var(--bg-card)] rounded-md border border-[var(--border-color)]">
      {isImage && src ? (
        <img src={src} alt="Preview" className="w-10 h-10 object-cover rounded" />
      ) : (
        <div className="w-10 h-10 flex-center bg-[var(--bg-hover)] rounded text-secondary">
          <File size={20} />
        </div>
      )}

      <div className="flex flex-col max-w-[160px]">
        <span className="text-xs font-medium truncate">{file.name}</span>
        <span className="text-[10px] text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>

      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          aria-label="Remove attachment"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default FilePreview;
