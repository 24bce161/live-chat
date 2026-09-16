# 🚀 Nexus Chat (LiveChat)

> **Live Demo:** [Nexus Chat on Render](https://live-chat-frontend-m4fy.onrender.com)

## 📖 Project Overview

Nexus Chat is a highly secure, full-stack real-time messaging platform built from the ground up to provide a premium, uninterrupted communication experience. Unlike traditional social media platforms or chat applications that rely on open, searchable user directories, Nexus Chat takes a privacy-first approach. It replaces public profiles with a strict **"Connection Code"** architecture. 

When a user registers on the platform, they are assigned a cryptographically random, unique 6-character identifier. To initiate a conversation, users must explicitly share their Connection Code with one another. This completely eliminates the possibility of spam, unwanted direct messages, and data scraping, ensuring that your chat environment remains a safe, private sanctuary for you and your trusted contacts.

Under the hood, the application leverages the robust **MERN stack** (MongoDB, Express, React, Node.js) and integrates **Socket.IO** to handle bi-directional, low-latency WebSocket connections. This allows for instantaneous message delivery, real-time typing indicators, and reliable read receipts without ever needing to refresh the page. The user interface is meticulously crafted using **TailwindCSS**, employing modern glassmorphism design principles, dynamic CSS variables, custom scrollbars, and fluid micro-animations to deliver a breathtaking, responsive experience across all devices.

Whether you are sharing large media files or maintaining context in a busy chat with threaded replies, Nexus Chat handles it all seamlessly in the cloud.

## ✨ Core Features

- **Strict Privacy (Connection Codes):** Users cannot be searched by name or email. You must possess a user's exact 6-character Connection Code to add them, granting you total control over who can contact you.
- **Real-Time Communication:** Lightning-fast instant messaging powered by persistent Socket.IO WebSocket connections.
- **Threaded Replies:** WhatsApp-style message replies. Hover over any message to reply directly to it, generating a visually nested thread context within the chat stream.
- **Rich Media Sharing:** Seamlessly upload and share images and files in your conversations. The UI dynamically renders image previews and provides one-click download widgets for other file types.
- **Read Receipts & Typing Indicators:** See exactly when someone is typing in real-time, and know when they've read your messages with visual checkmarks (`✓` for sent, `✓✓` for read).
- **Premium UI/UX:** A stunning, fully responsive interface featuring glassmorphism aesthetics, cohesive dark-mode themes, and butter-smooth transitions.

## 🛠️ Technology Stack

- **Responsive Design:** TailwindCSS
- **Frontend Framework:** React.js (via Vite)
- **Backend Framework:** Node.js with Express.js
- **Real-time Engine:** Socket.IO
- **Database:** MongoDB (Mongoose)

## 🚀 Local Development Setup

If you wish to run the project locally, follow these steps:

### Prerequisites
Make sure you have Node.js and MongoDB installed on your system.

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd livechat
```

### 2. Install Dependencies
This project uses a monorepo structure. You need to install dependencies for both the frontend and backend.
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
UPLOAD_PROVIDER=local
CLIENT_URL=http://localhost:5173
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Run the Application
Open two separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

## 🤝 Project Group
Developed by Group **24bce161**.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
