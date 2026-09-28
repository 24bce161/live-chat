/**
 * Socket.IO event constants — must match server/src/socket/events.js exactly.
 * Messages are SENT with the REST API; sockets are only used to receive updates
 * (plus the typing indicator).
 */

// Messages
export const MESSAGE_RECEIVE = 'message:receive';
export const MESSAGE_READ_UPDATE = 'message:read:update';

// Typing
export const TYPING_START = 'typing:start';
export const TYPING_STOP = 'typing:stop';

// Presence
export const ONLINE_USERS = 'users:online';
export const USER_ONLINE = 'user:online';
export const USER_OFFLINE = 'user:offline';

// Conversations
export const CONVERSATION_CREATED = 'conversation:created';
export const CONVERSATION_UPDATED = 'conversation:updated';
export const CONVERSATION_REMOVED = 'conversation:removed';
