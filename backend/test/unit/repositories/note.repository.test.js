const { expect } = require('chai');
const sinon = require('sinon');
const pool = require('../../../src/config/db');
const noteRepository = require('../../../src/repositories/note.repository');

describe('note.repository', () => {
  afterEach(() => sinon.restore());

  describe('create', () => {
    it('inserts and returns the created row', async () => {
      const fakeRow = { id: 'n1', user_id: 'u1', title: 'Hi', content: {} };
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [fakeRow] });

      const result = await noteRepository.create({
        userId: 'u1', title: 'Hi', content: {}, contentText: '',
      });

      expect(result).to.deep.equal(fakeRow);
      expect(queryStub.firstCall.args[1]).to.deep.equal(['u1', 'Hi', {}, '']);
    });
  });

  describe('findByIdForUser', () => {
    it('returns the row when found', async () => {
      const fakeRow = { id: 'n1', user_id: 'u1' };
      sinon.stub(pool, 'query').resolves({ rows: [fakeRow] });
      expect(await noteRepository.findByIdForUser('n1', 'u1')).to.deep.equal(fakeRow);
    });

    it('returns null when no note matches', async () => {
      sinon.stub(pool, 'query').resolves({ rows: [] });
      expect(await noteRepository.findByIdForUser('missing', 'u1')).to.be.null;
    });

    it('filters by both note id and owning user id in the query', async () => {
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [] });
      await noteRepository.findByIdForUser('n1', 'u1');

      const [sql, params] = queryStub.firstCall.args;
      expect(sql).to.include('user_id = $2');
      expect(sql).to.include('deleted_at IS NULL');
      expect(params).to.deep.equal(['n1', 'u1']);
    });
  });

  describe('findAllForUser', () => {
    it('strips total_count from each row and returns the total separately', async () => {
      sinon.stub(pool, 'query').resolves({
        rows: [
          { id: 'n1', title: 'A', total_count: '2' },
          { id: 'n2', title: 'B', total_count: '2' },
        ],
      });

      const { notes, total } = await noteRepository.findAllForUser({
        userId: 'u1', limit: 20, offset: 0,
      });

      expect(total).to.equal(2);
      expect(notes).to.deep.equal([{ id: 'n1', title: 'A' }, { id: 'n2', title: 'B' }]);
    });

    it('returns total 0 when there are no rows', async () => {
      sinon.stub(pool, 'query').resolves({ rows: [] });
      const { notes, total } = await noteRepository.findAllForUser({
        userId: 'u1', limit: 20, offset: 0,
      });
      expect(notes).to.deep.equal([]);
      expect(total).to.equal(0);
    });

    it('adds the search_vector clause only when a search term is given', async () => {
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [] });

      await noteRepository.findAllForUser({ userId: 'u1', limit: 20, offset: 0 });
      expect(queryStub.firstCall.args[0]).to.not.include('search_vector');

      await noteRepository.findAllForUser({
        userId: 'u1', limit: 20, offset: 0, search: 'meeting notes',
      });
      const [sql, params] = queryStub.secondCall.args;
      expect(sql).to.include('websearch_to_tsquery');
      expect(params).to.include('meeting notes');
    });
  });

  describe('update', () => {
    it('builds a SET clause only for the fields provided', async () => {
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [{ id: 'n1', title: 'New title' }] });

      await noteRepository.update('n1', 'u1', { title: 'New title' });

      const [sql, params] = queryStub.firstCall.args;
      expect(sql).to.include('title = $1');
      expect(sql).to.not.include('content =');
      expect(params).to.deep.equal(['New title', 'n1', 'u1']);
    });

    it('includes content and content_text in the SET clause when both are given', async () => {
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [{ id: 'n1' }] });

      await noteRepository.update('n1', 'u1', {
        content: { type: 'doc' }, contentText: 'plain text',
      });

      const [sql, params] = queryStub.firstCall.args;
      expect(sql).to.include('content = $1');
      expect(sql).to.include('content_text = $2');
      expect(params).to.deep.equal([{ type: 'doc' }, 'plain text', 'n1', 'u1']);
    });

    it('falls back to findByIdForUser when no fields are given', async () => {
      const fakeRow = { id: 'n1', title: 'Unchanged' };
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [fakeRow] });

      const result = await noteRepository.update('n1', 'u1', {});

      expect(result).to.deep.equal(fakeRow);
      // only the SELECT (findByIdForUser) ran, not an UPDATE
      expect(queryStub.firstCall.args[0]).to.include('SELECT');
    });

    it('returns null when the note does not exist or is not owned by the user', async () => {
      sinon.stub(pool, 'query').resolves({ rows: [] });
      const result = await noteRepository.update('n1', 'u1', { title: 'X' });
      expect(result).to.be.null;
    });
  });

  describe('softDelete', () => {
    it('returns the id when a matching, non-deleted note is updated', async () => {
      sinon.stub(pool, 'query').resolves({ rows: [{ id: 'n1' }] });
      expect(await noteRepository.softDelete('n1', 'u1')).to.deep.equal({ id: 'n1' });
    });

    it('returns null when nothing matched (already deleted, wrong owner, or missing)', async () => {
      sinon.stub(pool, 'query').resolves({ rows: [] });
      expect(await noteRepository.softDelete('n1', 'u1')).to.be.null;
    });

    it('only sets deleted_at, never removes the row', async () => {
      const queryStub = sinon.stub(pool, 'query').resolves({ rows: [{ id: 'n1' }] });
      await noteRepository.softDelete('n1', 'u1');
      expect(queryStub.firstCall.args[0]).to.include('SET deleted_at = now()');
      expect(queryStub.firstCall.args[0]).to.not.include('DELETE FROM');
    });
  });
});