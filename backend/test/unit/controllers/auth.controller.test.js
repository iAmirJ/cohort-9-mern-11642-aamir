const { expect } = require('chai');
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../../src/app');
const authService = require('../../../src/services/auth.service');
const jwtUtils = require('../../../src/utils/jwt');
const ApiError = require('../../../src/utils/ApiError');

describe('POST /api/auth/register', () => {
  afterEach(() => sinon.restore());

  it('returns 201 on success', async () => {
    sinon.stub(authService, 'registerUser').resolves({
      id: '1', name: 'Aamir', email: 'a@test.com',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Aamir', email: 'a@test.com', password: 'Password123' });

    expect(res.status).to.equal(201);
    expect(res.body.data.email).to.equal('a@test.com');
  });

  it('returns 422 with details when input is invalid — never reaches the service', async () => {
    const serviceSpy = sinon.spy(authService, 'registerUser');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: '123' });

    expect(res.status).to.equal(422);
    expect(res.body.details).to.be.an('array');
    expect(serviceSpy.called).to.be.false;
  });

  it('returns 409 when the service reports a duplicate email', async () => {
    sinon.stub(authService, 'registerUser')
      .rejects(new ApiError(409, 'An account with this email already exists'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Aamir', email: 'a@test.com', password: 'Password123' });

    expect(res.status).to.equal(409);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(() => sinon.restore());

  it('returns 200 and sets a refreshToken cookie on success', async () => {
    sinon.stub(authService, 'loginUser').resolves({
      user: { id: '1', email: 'a@test.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'Password123' });

    expect(res.status).to.equal(200);
    expect(res.headers['set-cookie'][0]).to.include('HttpOnly');
  });

  it('returns 401 for invalid credentials', async () => {
    sinon.stub(authService, 'loginUser').rejects(new ApiError(401, 'Invalid email or password'));
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'wrong' });
    expect(res.status).to.equal(401);
  });
});

describe('POST /api/auth/logout', () => {
  afterEach(() => sinon.restore());

  it('clears the refreshToken cookie and returns 200', async () => {
    sinon.stub(authService, 'logoutUser').resolves();
    const res = await request(app).post('/api/auth/logout').set('Cookie', ['refreshToken=some-token']);

    expect(res.status).to.equal(200);
    expect(res.headers['set-cookie'][0]).to.match(/refreshToken=;/);
  });
});

describe('POST /api/auth/refresh', () => {
  afterEach(() => sinon.restore());

  it('returns a new accessToken and rotates the cookie', async () => {
    sinon.stub(authService, 'refreshAccessToken').resolves({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    const res = await request(app).post('/api/auth/refresh').set('Cookie', ['refreshToken=old-token']);

    expect(res.status).to.equal(200);
    expect(res.headers['set-cookie'][0]).to.include('refreshToken=new-refresh');
  });

  it('returns 401 when the refresh token is invalid', async () => {
    sinon.stub(authService, 'refreshAccessToken').rejects(new ApiError(401, 'Invalid or expired refresh token'));
    const res = await request(app).post('/api/auth/refresh').set('Cookie', ['refreshToken=bad-token']);
    expect(res.status).to.equal(401);
  });
});

describe('GET /api/auth/me', () => {
  afterEach(() => sinon.restore());

  it('returns 401 with no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).to.equal(401);
  });

  it('returns 200 with the user when a valid token is provided', async () => {
    sinon.stub(jwtUtils, 'verifyAccessToken').returns({ sub: 'u1' });
    sinon.stub(authService, 'getCurrentUser').resolves({ id: 'u1', name: 'Aamir', email: 'a@test.com' });

    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake-but-stubbed-token');
    expect(res.status).to.equal(200);
    expect(res.body.data.email).to.equal('a@test.com');
  });
});