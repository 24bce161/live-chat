import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex-center flex-col h-full text-center p-6 animate-fade-in">
      {Icon && (
        <div className="mb-4 text-muted bg-hover p-4 rounded-full">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && <p className="text-secondary max-w-sm mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
