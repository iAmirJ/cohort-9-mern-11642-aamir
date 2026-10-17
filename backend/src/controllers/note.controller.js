const asyncHandler = require('../utils/asyncHandler');
const noteService = require('../services/note.service');
const { successResponse } = require('../utils/apiResponse');

const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await noteService.createNote({ userId: req.user.id, title, content });
  return successResponse(res, 201, 'Note created successfully', note);
});

const listNotes = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const { notes, pagination } = await noteService.listNotes({
    userId: req.user.id,
    page: page ? Number.parseInt(page, 10) : undefined,
    limit: limit ? Number.parseInt(limit, 10) : undefined,
    search,
  });
  return successResponse(res, 200, 'Notes fetched successfully', { notes, pagination });
});

const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById({ userId: req.user.id, noteId: req.params.id });
  return successResponse(res, 200, 'Note fetched successfully', note);
});

const updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await noteService.updateNote({
    userId: req.user.id,
    noteId: req.params.id,
    title,
    content,
  });
  return successResponse(res, 200, 'Note updated successfully', note);
});

const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote({ userId: req.user.id, noteId: req.params.id });
  return successResponse(res, 200, 'Note deleted successfully');
});

module.exports = { createNote, listNotes, getNote, updateNote, deleteNote };