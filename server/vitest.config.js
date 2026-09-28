import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests don't read server/.env, so give them their own settings
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret',
      JWT_EXPIRE: '1h'
    },
    // Each file starts its own in-memory MongoDB, so run files one at a time
    fileParallelism: false,
    hookTimeout: 60000
  }
});
