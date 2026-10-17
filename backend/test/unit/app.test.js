const { expect } = require('chai');
const sinon = require('sinon');

describe('App configuration', () => {
  let originalEnv;

  before(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete require.cache[require.resolve('../../src/app')];
  });

  after(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should initialize express app successfully in test environment', () => {
    process.env.NODE_ENV = 'test';
    const app = require('../../src/app');
    expect(app).to.be.a('function');
  });

  it('should not throw in production if not multi-process', () => {
    process.env.NODE_ENV = 'production';
    const app = require('../../src/app');
    expect(app).to.be.a('function');
  });

  it('should throw in production if multi-process (NODE_APP_INSTANCE is set)', () => {
    process.env.NODE_ENV = 'production';
    process.env.NODE_APP_INSTANCE = '1';
    
    expect(() => {
      require('../../src/app');
    }).to.throw('A shared rate-limit store must be configured for multi-instance deployments.');
    
    delete process.env.NODE_APP_INSTANCE;
  });
});
