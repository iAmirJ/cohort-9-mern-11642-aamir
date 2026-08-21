const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../src/app');
const noteService = require('../../../src/services/note.service');
const jwtUtils = require('../../../src/utils/jwt');
const ApiError = require('../../../src/utils/ApiError');

const VALID_UUID = '6fd281b8-be8f-42a3-9648-908226a733da';

function authAs(userId) {
  sinon.stub(jwtUtils, 'verifyAccessToken').returns({ sub: userId });
  return `Bearer fake-but-stubbed-token`;
}

describe('POST /api/notes', () => {
  afterEach(() => sinon.restore());

  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).post('/api/notes').send({ title: 'Hi' });
    expect(res.status).to.equal(401);
  });

  it('returns 201 and the created note on success', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'createNote').resolves({ id: 'n1', title: 'Hi' });

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', token)
      .send({ title: 'Hi', content: { type: 'doc' } });

    expect(res.status).to.equal(201);
    expect(res.body.data.title).to.equal('Hi');
  });

  it('passes the authenticated user id to the service, never a client-supplied one', async () => {
    const token = authAs('u1');
    const serviceStub = sinon.stub(noteService, 'createNote').resolves({ id: 'n1' });

    await request(app)
      .post('/api/notes')
      .set('Authorization', token)
      .send({ title: 'Hi', userId: 'someone-elses-id' });

    expect(serviceStub.firstCall.args[0].userId).to.equal('u1');
  });

  it('returns 422 when content is not an object — never reaches the service', async () => {
    const token = authAs('u1');
    const serviceSpy = sinon.spy(noteService, 'createNote');

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', token)
      .send({ title: 'Hi', content: 'plain string' });

    expect(res.status).to.equal(422);
    expect(serviceSpy.called).to.be.false;
  });
});

describe('GET /api/notes', () => {
  afterEach(() => sinon.restore());

  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/notes');
    expect(res.status).to.equal(401);
  });

  it('returns notes and pagination on success', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'listNotes').resolves({
      notes: [{ id: 'n1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app).get('/api/notes').set('Authorization', token);

    expect(res.status).to.equal(200);
    expect(res.body.data.notes).to.have.lengthOf(1);
    expect(res.body.data.pagination.total).to.equal(1);
  });

  it('returns 422 when limit exceeds the max of 100', async () => {
    const token = authAs('u1');
    const res = await request(app)
      .get('/api/notes?limit=500')
      .set('Authorization', token);
    expect(res.status).to.equal(422);
  });
});

describe('GET /api/notes/:id', () => {
  afterEach(() => sinon.restore());

  it('returns 422 for a non-UUID id — never reaches the service', async () => {
    const token = authAs('u1');
    const serviceSpy = sinon.spy(noteService, 'getNoteById');

    const res = await request(app).get('/api/notes/not-a-uuid').set('Authorization', token);

    expect(res.status).to.equal(422);
    expect(serviceSpy.called).to.be.false;
  });

  it('returns 200 with the note on success', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'getNoteById').resolves({ id: VALID_UUID, title: 'Hi' });

    const res = await request(app).get(`/api/notes/${VALID_UUID}`).set('Authorization', token);
    expect(res.status).to.equal(200);
    expect(res.body.data.id).to.equal(VALID_UUID);
  });

  it('returns 404 when the note does not exist or belongs to another user', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'getNoteById').rejects(new ApiError(404, 'Note not found'));

    const res = await request(app).get(`/api/notes/${VALID_UUID}`).set('Authorization', token);
    expect(res.status).to.equal(404);
  });
});

describe('PUT /api/notes/:id', () => {
  afterEach(() => sinon.restore());

  it('returns 422 when neither title nor content is provided', async () => {
    const token = authAs('u1');
    const serviceSpy = sinon.spy(noteService, 'updateNote');

    const res = await request(app)
      .put(`/api/notes/${VALID_UUID}`)
      .set('Authorization', token)
      .send({});

    expect(res.status).to.equal(422);
    expect(serviceSpy.called).to.be.false;
  });

  it('returns 200 with the updated note on success', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'updateNote').resolves({ id: VALID_UUID, title: 'Updated' });

    const res = await request(app)
      .put(`/api/notes/${VALID_UUID}`)
      .set('Authorization', token)
      .send({ title: 'Updated' });

    expect(res.status).to.equal(200);
    expect(res.body.data.title).to.equal('Updated');
  });

  it('returns 404 when the note does not exist or belongs to another user', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'updateNote').rejects(new ApiError(404, 'Note not found'));

    const res = await request(app)
      .put(`/api/notes/${VALID_UUID}`)
      .set('Authorization', token)
      .send({ title: 'X' });

    expect(res.status).to.equal(404);
  });
});

describe('DELETE /api/notes/:id', () => {
  afterEach(() => sinon.restore());

  it('returns 200 on success', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'deleteNote').resolves();

    const res = await request(app).delete(`/api/notes/${VALID_UUID}`).set('Authorization', token);
    expect(res.status).to.equal(200);
  });

  it('returns 404 when the note does not exist or belongs to another user', async () => {
    const token = authAs('u1');
    sinon.stub(noteService, 'deleteNote').rejects(new ApiError(404, 'Note not found'));

    const res = await request(app).delete(`/api/notes/${VALID_UUID}`).set('Authorization', token);
    expect(res.status).to.equal(404);
  });
});