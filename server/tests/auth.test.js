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
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  it('should create user and return token on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('name', testUser.name);
    expect(res.body.user).toHaveProperty('email', testUser.email);
  });

  it('should reject duplicate email on signup', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const res = await request(app).post('/api/auth/signup').send(testUser);

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('User already exists');
  });

  it('should reject weak password on signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...testUser, password: '123' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('Password must be at least 6 characters');
  });

  it('should login with correct credentials', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.status).toBe('online');
  });

  it('should reject wrong password on login', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return user profile on getMe with valid token', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send(testUser);
    const token = signupRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('email', testUser.email);
  });

  it('should reject getMe without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
  });
});
