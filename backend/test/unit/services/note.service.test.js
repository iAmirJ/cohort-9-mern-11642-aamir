const { expect } = require('chai');
const sinon = require('sinon');
const noteService = require('../../../src/services/note.service');
const noteRepository = require('../../../src/repositories/note.repository');
const ApiError = require('../../../src/utils/ApiError');
const socket = require('../../../src/sockets/socket');

describe('note.service', () => {
  afterEach(() => sinon.restore());

  describe('createNote', () => {
    it('defaults content to {} and title to "" when not provided', async () => {
      const createStub = sinon.stub(noteRepository, 'create').resolves({ id: 'n1' });
      sinon.stub(socket, 'broadcastToUser');

      await noteService.createNote({ userId: 'u1' });

      expect(createStub.calledWith({
        userId: 'u1', title: '', content: {}, contentText: '',
      })).to.be.true;
    });

    it('derives contentText from the given content', async () => {
      const createStub = sinon.stub(noteRepository, 'create').resolves({ id: 'n1' });
      sinon.stub(socket, 'broadcastToUser');

      await noteService.createNote({
        userId: 'u1',
        title: 'My note',
        content: [{ text: 'hello world' }],
      });

      expect(createStub.firstCall.args[0].contentText).to.equal('hello world');
    });

    it('broadcasts note:created to the owning user and returns the created note', async () => {
      const fakeNote = { id: 'n1', user_id: 'u1', title: 'Hi' };
      sinon.stub(noteRepository, 'create').resolves(fakeNote);
      const broadcastStub = sinon.stub(socket, 'broadcastToUser');

      const result = await noteService.createNote({ userId: 'u1', title: 'Hi' });

      expect(result).to.deep.equal(fakeNote);
      expect(broadcastStub.calledWith('u1', 'note:created', fakeNote)).to.be.true;
    });
  });

  describe('listNotes', () => {
    it('uses default page 1 and limit 20 when not provided', async () => {
      const findStub = sinon.stub(noteRepository, 'findAllForUser').resolves({ notes: [], total: 0 });

      await noteService.listNotes({ userId: 'u1' });

      expect(findStub.firstCall.args[0]).to.include({ userId: 'u1', limit: 20, offset: 0 });
    });

    it('clamps limit to the max of 100', async () => {
      const findStub = sinon.stub(noteRepository, 'findAllForUser').resolves({ notes: [], total: 0 });

      await noteService.listNotes({ userId: 'u1', limit: 500 });

      expect(findStub.firstCall.args[0].limit).to.equal(100);
    });

    it('computes offset from page and limit', async () => {
      const findStub = sinon.stub(noteRepository, 'findAllForUser').resolves({ notes: [], total: 0 });

      await noteService.listNotes({ userId: 'u1', page: 3, limit: 10 });

      expect(findStub.firstCall.args[0].offset).to.equal(20);
    });

    it('returns notes with a computed pagination summary', async () => {
      sinon.stub(noteRepository, 'findAllForUser').resolves({ notes: [{ id: 'n1' }], total: 45 });

      const result = await noteService.listNotes({ userId: 'u1', page: 2, limit: 20 });

      expect(result.notes).to.deep.equal([{ id: 'n1' }]);
      expect(result.pagination).to.deep.equal({
        page: 2, limit: 20, total: 45, totalPages: 3,
      });
    });
  });

  describe('getNoteById', () => {
    it('throws 404 when the note does not exist or is not owned by the user', async () => {
      sinon.stub(noteRepository, 'findByIdForUser').resolves(null);

      try {
        await noteService.getNoteById({ userId: 'u1', noteId: 'n1' });
        expect.fail('expected getNoteById to throw');
      } catch (err) {
        expect(err).to.be.instanceOf(ApiError);
        expect(err.statusCode).to.equal(404);
      }
    });

    it('returns the note when found', async () => {
      const fakeNote = { id: 'n1', title: 'Hi' };
      sinon.stub(noteRepository, 'findByIdForUser').resolves(fakeNote);
      expect(await noteService.getNoteById({ userId: 'u1', noteId: 'n1' })).to.deep.equal(fakeNote);
    });
  });

  describe('updateNote', () => {
    it('throws 404 before touching the repository update when the note is not found', async () => {
      sinon.stub(noteRepository, 'findByIdForUser').resolves(null);
      const updateSpy = sinon.spy(noteRepository, 'update');

      try {
        await noteService.updateNote({ userId: 'u1', noteId: 'n1', title: 'X' });
        expect.fail('expected updateNote to throw');
      } catch (err) {
        expect(err.statusCode).to.equal(404);
      }
      expect(updateSpy.called).to.be.false;
    });

    it('only passes the fields that were provided', async () => {
      sinon.stub(noteRepository, 'findByIdForUser').resolves({ id: 'n1' });
      const updateStub = sinon.stub(noteRepository, 'update').resolves({ id: 'n1', title: 'New' });
      sinon.stub(socket, 'broadcastToUser');

      await noteService.updateNote({ userId: 'u1', noteId: 'n1', title: 'New' });

      const fields = updateStub.firstCall.args[2];
      expect(fields).to.have.property('title', 'New');
      expect(fields).to.not.have.property('content');
    });

    it('recomputes contentText when content is provided', async () => {
      sinon.stub(noteRepository, 'findByIdForUser').resolves({ id: 'n1' });
      const updateStub = sinon.stub(noteRepository, 'update').resolves({ id: 'n1' });
      sinon.stub(socket, 'broadcastToUser');

      await noteService.updateNote({
        userId: 'u1', noteId: 'n1', content: [{ text: 'updated body' }],
      });

      expect(updateStub.firstCall.args[2].contentText).to.equal('updated body');
    });

    it('broadcasts note:updated and returns the updated note', async () => {
      sinon.stub(noteRepository, 'findByIdForUser').resolves({ id: 'n1' });
      const updatedNote = { id: 'n1', title: 'New' };
      sinon.stub(noteRepository, 'update').resolves(updatedNote);
      const broadcastStub = sinon.stub(socket, 'broadcastToUser');

      const result = await noteService.updateNote({ userId: 'u1', noteId: 'n1', title: 'New' });

      expect(result).to.deep.equal(updatedNote);
      expect(broadcastStub.calledWith('u1', 'note:updated', updatedNote)).to.be.true;
    });
  });

  describe('deleteNote', () => {
    it('throws 404 when nothing was deleted (not found or not owned)', async () => {
      sinon.stub(noteRepository, 'softDelete').resolves(null);

      try {
        await noteService.deleteNote({ userId: 'u1', noteId: 'n1' });
        expect.fail('expected deleteNote to throw');
      } catch (err) {
        expect(err.statusCode).to.equal(404);
      }
    });

    it('broadcasts note:deleted with the note id on success', async () => {
      sinon.stub(noteRepository, 'softDelete').resolves({ id: 'n1' });
      const broadcastStub = sinon.stub(socket, 'broadcastToUser');

      await noteService.deleteNote({ userId: 'u1', noteId: 'n1' });

      expect(broadcastStub.calledWith('u1', 'note:deleted', { id: 'n1' })).to.be.true;
    });
  });
});