import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';
import Message from '../src/models/Message.js';

let mongoServer;
let token1, token2, user1, user2, conversationId;

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
  await Conversation.deleteMany({});
  await Message.deleteMany({});
});

describe('Message API', () => {
  const setup = async () => {
    const u1 = await request(app).post('/api/auth/signup').send({ name: 'User 1', email: 'u1@test.com', password: 'password' });
    const u2 = await request(app).post('/api/auth/signup').send({ name: 'User 2', email: 'u2@test.com', password: 'password' });
    
    token1 = u1.body.token;
    token2 = u2.body.token;
    user1 = u1.body.user;
    user2 = u2.body.user;

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token1}`)
      .send({ type: 'direct', participants: [user1.id, user2.id] });

    conversationId = conv.body._id;
  };

  it('should create message in conversation', async () => {
    await setup();
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${token1}`)
      .send({ conversationId, text: 'Hello world' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toBe('Hello world');
    expect(res.body.senderId._id).toBe(user1.id);
  });

  it('should return paginated messages', async () => {
    await setup();
    await request(app).post('/api/messages').set('Authorization', `Bearer ${token1}`).send({ conversationId, text: 'Msg 1' });
    await request(app).post('/api/messages').set('Authorization', `Bearer ${token1}`).send({ conversationId, text: 'Msg 2' });

    const res = await request(app)
      .get(`/api/messages/${conversationId}?limit=1`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('should mark messages as read', async () => {
    await setup();
    await request(app).post('/api/messages').set('Authorization', `Bearer ${token1}`).send({ conversationId, text: 'Hello' });

    const res = await request(app)
      .put(`/api/messages/read/${conversationId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.modifiedCount).toBe(1);
  });

  it('should reject message from non-participant', async () => {
    await setup();
    const u3 = await request(app).post('/api/auth/signup').send({ name: 'User 3', email: 'u3@test.com', password: 'password' });
    
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${u3.body.token}`)
      .send({ conversationId, text: 'Hacking in' });

    expect(res.statusCode).toEqual(403);
  });
});
