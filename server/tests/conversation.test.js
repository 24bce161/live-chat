import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Conversation from '../src/models/Conversation.js';

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
  await Conversation.deleteMany({});
});

const signup = async (name) => {
  const res = await request(app).post('/api/auth/signup').send({ name, email: `${name}@test.com`, password: 'password' });
  return { token: res.body.token, user: res.body.user };
};

const createGroup = (admin, members) => {
  return request(app)
    .post('/api/conversations')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ type: 'group', name: 'Study group', participants: members.map(m => m.user._id) });
};

describe('Conversation API', () => {
  it('should reuse an existing direct chat', async () => {
    const a = await signup('alice');
    const b = await signup('bob');

    const first = await request(app).post('/api/conversations').set('Authorization', `Bearer ${a.token}`)
      .send({ type: 'direct', participants: [b.user._id] });
    const second = await request(app).post('/api/conversations').set('Authorization', `Bearer ${b.token}`)
      .send({ type: 'direct', participants: [a.user._id] });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.body._id).toBe(first.body._id);
  });

  it('should reject a request without participants (400, not 500)', async () => {
    const a = await signup('alice');
    const res = await request(app).post('/api/conversations').set('Authorization', `Bearer ${a.token}`)
      .send({ type: 'direct' });

    expect(res.statusCode).toBe(400);
  });

  it('should not expose participant emails', async () => {
    const a = await signup('alice');
    const b = await signup('bob');

    const res = await request(app).post('/api/conversations').set('Authorization', `Bearer ${a.token}`)
      .send({ type: 'direct', participants: [b.user._id] });

    expect(res.body.participants[0]).not.toHaveProperty('email');
  });

  it('should only let the admin add members', async () => {
    const admin = await signup('admin');
    const member = await signup('member');
    const outsider = await signup('outsider');

    const group = await createGroup(admin, [member]);

    // An outsider can't add themselves to someone else's group
    const sneaky = await request(app)
      .put(`/api/conversations/${group.body._id}/participants`)
      .set('Authorization', `Bearer ${outsider.token}`)
      .send({ userId: outsider.user._id });
    expect(sneaky.statusCode).toBe(403);

    const ok = await request(app)
      .put(`/api/conversations/${group.body._id}/participants`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ userId: outsider.user._id });
    expect(ok.statusCode).toBe(200);
    expect(ok.body.participants).toHaveLength(3);
  });

  it('should only let the admin remove others, but anyone can leave', async () => {
    const admin = await signup('admin');
    const m1 = await signup('member1');
    const m2 = await signup('member2');

    const group = await createGroup(admin, [m1, m2]);
    const groupId = group.body._id;

    const notAllowed = await request(app)
      .delete(`/api/conversations/${groupId}/participants/${m2.user._id}`)
      .set('Authorization', `Bearer ${m1.token}`);
    expect(notAllowed.statusCode).toBe(403);

    const leave = await request(app)
      .delete(`/api/conversations/${groupId}/participants/${m1.user._id}`)
      .set('Authorization', `Bearer ${m1.token}`);
    expect(leave.statusCode).toBe(200);
    expect(leave.body.participants).toHaveLength(2);
  });
});
