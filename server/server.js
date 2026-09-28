// Must be the first import: ES module imports run before the rest of this file,
// so calling dotenv.config() after the imports would be too late for app.js.
import 'dotenv/config';

import http from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initializeSocket } from './src/socket/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    // Start listening
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
