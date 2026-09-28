// Must match client/src/utils/socketEvents.js

// Connection
export const CONNECTION = 'connection';
export const DISCONNECTING = 'disconnecting';
export const DISCONNECT = 'disconnect';

// Messages (sent by the server after the REST API saves them)
export const MESSAGE_RECEIVE = 'message:receive';
export const MESSAGE_READ_UPDATE = 'message:read:update';

// Typing (client <-> server)
export const TYPING_START = 'typing:start';
export const TYPING_STOP = 'typing:stop';

// Presence
export const ONLINE_USERS = 'users:online'; // full list, sent once when you connect
export const USER_ONLINE = 'user:online';
export const USER_OFFLINE = 'user:offline';

// Conversations
export const CONVERSATION_CREATED = 'conversation:created';
export const CONVERSATION_UPDATED = 'conversation:updated';
export const CONVERSATION_REMOVED = 'conversation:removed';
