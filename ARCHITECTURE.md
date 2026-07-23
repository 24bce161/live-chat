# Architecture — Real-Time Event Flow

This document explains how real-time events flow through the LiveChat application, from client interaction to database persistence to broadcast.

## System Overview

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐     Mongoose      ┌──────────────┐
│                 │ ──────────────────> │                  │ ───────────────>  │              │
│   React Client  │                    │  Express Server   │                   │   MongoDB    │
│   (Vite Dev)    │ <───────────────── │  + Socket.IO      │ <──────────────── │              │
│                 │     WebSocket      │                  │                   │              │
└─────────────────┘                    └──────────────────┘                   └──────────────┘
     :5173                                   :5000
```

## Connection Lifecycle

### 1. Authentication & Socket Connection

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as MongoDB

    C->>S: POST /api/auth/login {email, password}
    S->>DB: Find user, verify password
    DB-->>S: User document
    S-->>C: { user, JWT token }
    Note over C: Store token in localStorage

    C->>S: Socket.IO connect (auth: { token })
    S->>S: Verify JWT in socket middleware
    S->>DB: Update user.status = 'online'
    S->>S: Join user to conversation rooms
    S->>S: Add to onlineUsers Map
    S-->>C: Connection confirmed
    S->>S: Broadcast 'user:online' to all clients
```

### 2. Sending a Message

This is the core real-time flow. When a user sends a message:

```mermaid
sequenceDiagram
    participant A as Sender (Client A)
    participant S as Server (Socket.IO)
    participant DB as MongoDB
    participant B as Receiver (Client B)

    A->>S: emit 'message:send' { conversationId, text }
    Note over S: 1. Validate sender is participant
    S->>DB: Create Message document
    S->>DB: Update Conversation.lastMessage
    DB-->>S: Saved message (populated)
    S->>A: emit 'message:receive' { message }
    S->>B: emit 'message:receive' { message }
    Note over B: 2. Add to local state
    Note over B: 3. Increment unread if not active conversation
    Note over B: 4. Play notification sound
```

**Key implementation detail**: The message is broadcast to the entire conversation room (`io.to(conversationId).emit(...)`), which means all participants (including the sender) receive it. The client checks `message.senderId === currentUser.id` to distinguish sent vs received.

### 3. Typing Indicators

```mermaid
sequenceDiagram
    participant A as Typer (Client A)
    participant S as Server
    participant B as Other Participant (Client B)

    A->>S: emit 'typing:start' { conversationId }
    S->>B: emit 'typing:start' { conversationId, userId, userName }
    Note over B: Show "Alice is typing..."

    Note over A: 3 seconds of no keypress
    A->>S: emit 'typing:stop' { conversationId }
    S->>B: emit 'typing:stop' { conversationId, userId }
    Note over B: Hide typing indicator
```

**Client-side debouncing**: The client uses a 3-second debounce timer. On each keypress, if `typing:start` hasn't been sent recently, it emits the event and starts a timer. If no keypress occurs for 3 seconds, it emits `typing:stop`. This prevents excessive socket traffic.

### 4. Read Receipts

```mermaid
sequenceDiagram
    participant A as Sender (Client A)
    participant S as Server
    participant DB as MongoDB
    participant B as Reader (Client B)

    Note over B: Opens conversation
    B->>S: emit 'message:read' { conversationId }
    S->>DB: Update messages: add userId to readBy[]
    DB-->>S: Modified count
    S->>A: emit 'message:read:update' { conversationId, userId, readAt }
    Note over A: Update check marks: ✓✓ → blue ✓✓
```

**Message states**:
| State | Icon | Meaning |
|-------|------|---------|
| Sent | ✓ | Server received and persisted the message |
| Delivered | ✓✓ | At least one recipient's client received it |
| Read | ✓✓ (blue) | Recipient opened the conversation |

### 5. Presence (Online/Offline)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as MongoDB
    participant Others as Other Clients

    Note over C: User closes browser tab
    C--xS: Socket disconnects
    S->>S: Remove from onlineUsers Map
    S->>DB: Update user.status = 'offline', lastSeen = now
    S->>Others: emit 'user:offline' { userId, lastSeen }
    Note over Others: Update status dot to grey
    Note over Others: Show "last seen 2 min ago"
```

**Multi-tab support**: The server tracks `Map<userId, Set<socketId>>`. A user is only marked offline when their *last* socket disconnects (i.e., all tabs are closed).

### 6. Reconnection & Missed Messages

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as MongoDB

    Note over C: Connection lost (network issue)
    C->>C: Socket.IO auto-reconnects (exp. backoff)
    C->>S: Reconnect with JWT
    S->>S: Re-authenticate, rejoin rooms
    C->>S: GET /api/conversations (fetch latest)
    S->>DB: Query conversations
    DB-->>S: Updated conversations with lastMessage
    S-->>C: Conversation list (with any missed messages reflected)
    Note over C: Diff with local state, update UI
```

## Socket Event Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ conversationId, text, attachmentUrl?, attachmentType? }` | Send a message |
| `message:read` | `{ conversationId }` | Mark all messages in conversation as read |
| `typing:start` | `{ conversationId }` | User started typing |
| `typing:stop` | `{ conversationId }` | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:receive` | `{ _id, conversationId, senderId, text, ... }` | New message |
| `message:read:update` | `{ conversationId, userId, readAt }` | Messages were read |
| `typing:start` | `{ conversationId, userId, userName }` | Someone started typing |
| `typing:stop` | `{ conversationId, userId }` | Someone stopped typing |
| `user:online` | `{ userId }` | A user came online |
| `user:offline` | `{ userId, lastSeen }` | A user went offline |
| `conversation:created` | `{ conversation }` | New conversation created |
| `conversation:updated` | `{ conversation }` | Conversation updated |
| `error` | `{ message }` | Socket error |

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                                │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐                │
│  │ AuthCtx  │───>│  SocketCtx   │───>│   ChatCtx   │                │
│  │          │    │              │    │             │                │
│  │ user     │    │ socket       │    │ convos      │                │
│  │ token    │    │ isConnected  │    │ messages    │                │
│  │ login()  │    │ onlineUsers  │    │ unreadCnts  │                │
│  │ logout() │    │              │    │ typingUsers │                │
│  └──────────┘    └──────┬───────┘    └──────┬──────┘                │
│                         │                    │                       │
│                    WebSocket             REST API                    │
│                         │                    │                       │
└─────────────────────────┼────────────────────┼───────────────────────┘
                          │                    │
                          ▼                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SERVER (Express + Socket.IO)                   │
│                                                                      │
│  ┌─────────────┐    ┌───────────────┐    ┌────────────────┐         │
│  │ Socket.IO   │    │ Express API   │    │  Middleware     │         │
│  │             │    │               │    │                │         │
│  │ JWT Auth MW │    │ /api/auth     │    │ JWT Protect    │         │
│  │ Msg Handler │    │ /api/users    │    │ Rate Limiter   │         │
│  │ Presence    │    │ /api/convos   │    │ Validation     │         │
│  │ Typing      │    │ /api/messages │    │ File Upload    │         │
│  └──────┬──────┘    └───────┬───────┘    └────────────────┘         │
│         │                   │                                        │
│         └─────────┬─────────┘                                        │
│                   │ Mongoose                                         │
│                   ▼                                                  │
│         ┌─────────────────┐                                          │
│         │ MongoDB Models  │                                          │
│         │ User            │                                          │
│         │ Conversation    │                                          │
│         │ Message         │                                          │
│         └─────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────┘
```

## Room Strategy

Socket.IO rooms are used to scope message broadcasts:

- **Conversation room** (`conversation._id`): Every participant in a conversation joins this room. Messages and typing events are broadcast to the room.
- **User room** (`user._id`): Each user joins their own personal room. Used for direct notifications like "new conversation created" when another user initiates a chat.

```javascript
// On connection, join all relevant rooms
const conversations = await Conversation.find({ participants: userId });
conversations.forEach(conv => {
  socket.join(conv._id.toString());   // Join each conversation room
});
socket.join(userId.toString());        // Join personal room
```

## Scaling Considerations

The current architecture is designed for single-server deployment. For horizontal scaling:

1. **Socket.IO Adapter**: Use `@socket.io/redis-adapter` to share socket state across servers
2. **Online Users**: Move `onlineUsers` Map to Redis
3. **Session Affinity**: Configure load balancer for sticky sessions (or use Redis adapter)
4. **File Storage**: Use Cloudinary (already supported) instead of local storage
