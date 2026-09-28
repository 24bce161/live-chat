import React from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Shows the user's connection code with a Copy button.
 * The code is the only way people can find each other, so it should be easy to share.
 */
const ConnectionCode = ({ code, label = 'Your connection code' }) => {
  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Connection code copied');
    } catch (error) {
      toast.error('Could not copy — select the code and copy it manually');
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">{label}</span>
      <div className="flex items-center justify-between gap-2 bg-[var(--bg-hover)] pl-3 pr-1 py-1 rounded-md border border-[var(--border-color)]">
        <span className="font-mono text-sm font-bold tracking-widest text-[var(--accent-solid)] select-all">{code}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="btn-icon btn-ghost"
          aria-label="Copy connection code"
          title="Copy"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

export default ConnectionCode;
