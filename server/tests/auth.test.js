import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth API', () => {
  const testUser = {
    name: 'test_user',
    email: 'test@example.com',
    password: 'password123'
  };

  it('should create user and return token on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('_id');
    expect(res.body.user).toHaveProperty('name', testUser.name);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user.connectionCode).toHaveLength(6);
  });

  it('should reject duplicate email on signup', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const res = await request(app).post('/api/auth/signup').send({ ...testUser, name: 'someone_else' });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toBe('Email is already registered');
  });

  it('should reject a username that only differs in case', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, name: 'TEST_USER', email: 'other@example.com' });

    expect(res.statusCode).toEqual(409);
    expect(res.body.message).toBe('Username is already taken');
  });

  it('should reject a username with spaces', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, name: 'Test User' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Username can only contain letters, numbers, _ and .');
  });

  it('should accept emails with long domain endings', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, email: 'me@example.store' });

    expect(res.statusCode).toEqual(201);
  });

  it('should reject weak password on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, password: '123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Password must be at least 6 characters');
  });

  it('should login with correct credentials (username is not case-sensitive)', async () => {
    await request(app).post('/api/auth/signup').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'Test_User', password: testUser.password });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.name).toBe(testUser.name);
  });

  it('should reject wrong password on login', async () => {
    await request(app).post('/api/auth/signup').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.name, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid username or password');
  });

  it('should return user profile on getMe with valid token', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(testUser);
    const token = signupRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.user).toHaveProperty('email', testUser.email);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('should still log in with the same password after renaming', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(testUser);

    const update = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${signupRes.body.token}`)
      .send({ name: 'renamed_user', avatarUrl: '' });
    expect(update.statusCode).toEqual(200);
    expect(update.body.user.name).toBe('renamed_user');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'renamed_user', password: testUser.password });
    expect(res.statusCode).toEqual(200);
  });

  it('should reject getMe without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
  });
});
