const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noPreserveCache();

describe('init_db script', () => {
  let fsStub, poolStub, loggerStub;

  beforeEach(() => {
    fsStub = {
      readFileSync: sinon.stub().returns('CREATE TABLE test;'),
    };
    poolStub = {
      query: sinon.stub().resolves(),
      end: sinon.stub().resolves(),
    };
    loggerStub = {
      info: sinon.stub(),
      error: sinon.stub(),
    };
  });

  afterEach(() => {
    sinon.restore();
    process.exitCode = 0; // reset
  });

  it('should initialize DB successfully', async () => {
    // We require the script, which automatically runs it. 
    // We can't await it easily since it runs asynchronously at module load, 
    // so we can wait a tick.
    proxyquire('../../src/db/init_db', {
      'node:fs': fsStub,
      '../config/db': poolStub,
      '../utils/logger': loggerStub,
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(fsStub.readFileSync.calledOnce).to.be.true;
    expect(poolStub.query.calledOnce).to.be.true;
    expect(poolStub.end.calledOnce).to.be.true;
    expect(loggerStub.info.called).to.be.true;
  });

  it('should handle pool.query error and set exitCode', async () => {
    poolStub.query.rejects(new Error('DB Query Failed'));
    
    proxyquire('../../src/db/init_db', {
      'node:fs': fsStub,
      '../config/db': poolStub,
      '../utils/logger': loggerStub,
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(loggerStub.error.calledWithMatch(sinon.match({ err: sinon.match.has('message', 'DB Query Failed') }))).to.be.true;
    expect(process.exitCode).to.equal(1);
  });

  it('should handle pool.end error and set exitCode', async () => {
    poolStub.end.rejects(new Error('Pool End Failed'));
    
    proxyquire('../../src/db/init_db', {
      'node:fs': fsStub,
      '../config/db': poolStub,
      '../utils/logger': loggerStub,
    });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(loggerStub.error.calledWithMatch(sinon.match({ err: sinon.match.has('message', 'Pool End Failed') }))).to.be.true;
    expect(process.exitCode).to.equal(1);
  });
});
