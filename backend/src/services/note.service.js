const noteRepository = require('../repositories/note.repository');
const { extractPlainText } = require('../utils/richText');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

async function createNote({ userId, title, content }) {
  const noteContent = content !== undefined ? content : {};
  const contentText = extractPlainText(noteContent);

  const note = await noteRepository.create({
    userId,
    title: title || '',
    content: noteContent,
    contentText,
  });

  logger.info({ userId, noteId: note.id }, 'Note created');
  return note;
}

async function listNotes({ userId, page, limit, search }) {
  const safePage = Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = (safePage - 1) * safeLimit;

  const { notes, total } = await noteRepository.findAllForUser({
    userId,
    limit: safeLimit,
    offset,
    search,
  });

  return {
    notes,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: safeLimit > 0 ? Math.ceil(total / safeLimit) : 0,
    },
  };
}

async function getNoteById({ userId, noteId }) {
  const note = await noteRepository.findByIdForUser(noteId, userId);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return note;
}

async function updateNote({ userId, noteId, title, content }) {
  const existing = await noteRepository.findByIdForUser(noteId, userId);
  if (!existing) {
    throw new ApiError(404, 'Note not found');
  }

  const fields = {};
  if (title !== undefined) fields.title = title;
  if (content !== undefined) {
    fields.content = content;
    fields.contentText = extractPlainText(content);
  }

  const updated = await noteRepository.update(noteId, userId, fields);

  logger.info({ userId, noteId }, 'Note updated');
  return updated;
}

async function deleteNote({ userId, noteId }) {
  const deleted = await noteRepository.softDelete(noteId, userId);
  if (!deleted) {
    throw new ApiError(404, 'Note not found');
  }

  logger.info({ userId, noteId }, 'Note deleted');
}

module.exports = { createNote, listNotes, getNoteById, updateNote, deleteNote };