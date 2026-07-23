import React from 'react';
import { X, File, Image as ImageIcon } from 'lucide-react';

const FilePreview = ({ file, onRemove }) => {
  const isUrl = typeof file === 'string';
  const isImage = isUrl ? file.match(/\.(jpeg|jpg|gif|png)$/i) : file.type.startsWith('image/');
  
  const src = isUrl ? file : (isImage ? URL.createObjectURL(file) : null);

  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-[var(--bg-hover)] rounded-md border border-[var(--border-color)]">
      {isImage ? (
        <img src={src} alt="Preview" className="w-10 h-10 object-cover rounded" />
      ) : (
        <div className="w-10 h-10 flex-center bg-gray-200 dark:bg-gray-700 rounded text-gray-500">
          <File size={20} />
        </div>
      )}
      
      {!isUrl && (
        <div className="flex flex-col max-w-[120px]">
          <span className="text-xs font-medium truncate">{file.name}</span>
          <span className="text-[10px] text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      )}
      
      {onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default FilePreview;
