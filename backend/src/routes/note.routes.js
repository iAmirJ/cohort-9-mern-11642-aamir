const express = require('express');
const { createNote, listNotes, getNote, updateNote, deleteNote } = require('../controllers/note.controller');
const {
  createNoteValidator,
  updateNoteValidator,
  noteIdValidator,
  listNotesValidator,
} = require('../validators/note.validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', createNoteValidator, validate, createNote);
router.get('/', listNotesValidator, validate, listNotes);
router.get('/:id', noteIdValidator, validate, getNote);
router.put('/:id', updateNoteValidator, validate, updateNote);
router.delete('/:id', noteIdValidator, validate, deleteNote);

module.exports = router;