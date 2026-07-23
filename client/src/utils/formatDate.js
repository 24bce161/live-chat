export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
};

export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  return d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
};

export const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const formatLastSeen = (date) => {
  if (!date) return 'offline';
  if (isToday(date)) return `last seen today at ${formatMessageTime(date)}`;
  if (isYesterday(date)) return `last seen yesterday at ${formatMessageTime(date)}`;
  return `last seen ${new Date(date).toLocaleDateString()}`;
};

export const formatDateSeparator = (date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};
