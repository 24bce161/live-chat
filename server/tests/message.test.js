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

const signup = (name) => {
  return request(app).post('/api/auth/signup').send({ name, email: `${name}@test.com`, password: 'password' });
};

const send = (token, body) => {
  return request(app).post('/api/messages').set('Authorization', `Bearer ${token}`).send(body);
};

describe('Message API', () => {
  const setup = async () => {
    const u1 = await signup('user1');
    const u2 = await signup('user2');

    token1 = u1.body.token;
    token2 = u2.body.token;
    user1 = u1.body.user;
    user2 = u2.body.user;

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token1}`)
      .send({ type: 'direct', participants: [user2._id] });

    conversationId = conv.body._id;
  };

  it('should create message in conversation', async () => {
    await setup();
    const res = await send(token1, { conversationId, text: 'Hello world' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.text).toBe('Hello world');
    expect(res.body.senderId._id).toBe(user1._id);
  });

  it('should reject an empty message', async () => {
    await setup();
    const res = await send(token1, { conversationId, text: '   ' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Message cannot be empty');
  });

  it('should reject a javascript: attachment URL', async () => {
    await setup();
    const res = await send(token1, { conversationId, attachmentUrl: 'javascript:alert(1)', attachmentType: 'file' });

    expect(res.statusCode).toEqual(400);
  });

  it('should return paginated messages', async () => {
    await setup();
    await send(token1, { conversationId, text: 'Msg 1' });
    await send(token1, { conversationId, text: 'Msg 2' });

    const res = await request(app)
      .get(`/api/messages/${conversationId}?limit=1`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.messages.length).toBe(1);
    expect(res.body.hasMore).toBe(true);
  });

  it('should count unread messages and clear them when read', async () => {
    await setup();
    await send(token1, { conversationId, text: 'Hello' });
    await send(token1, { conversationId, text: 'Are you there?' });

    const getUnread = async (token) => {
      const res = await request(app).get('/api/conversations').set('Authorization', `Bearer ${token}`);
      return res.body[0].unreadCount;
    };

    expect(await getUnread(token2)).toBe(2);
    expect(await getUnread(token1)).toBe(0); // your own messages are never unread

    const res = await request(app)
      .put(`/api/messages/read/${conversationId}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.statusCode).toEqual(200);
    expect(await getUnread(token2)).toBe(0);
  });

  it('should reject message from non-participant', async () => {
    await setup();
    const u3 = await signup('user3');

    const res = await send(u3.body.token, { conversationId, text: 'Hacking in' });

    expect(res.statusCode).toEqual(403);
  });

  it('should not let a non-participant mark a chat as read', async () => {
    await setup();
    const u3 = await signup('user3');

    const res = await request(app)
      .put(`/api/messages/read/${conversationId}`)
      .set('Authorization', `Bearer ${u3.body.token}`);

    expect(res.statusCode).toEqual(403);
  });

  it('should return 400 (not 500) for an invalid conversation id', async () => {
    await setup();
    const res = await request(app)
      .get('/api/messages/not-an-id')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toEqual(400);
  });
});
