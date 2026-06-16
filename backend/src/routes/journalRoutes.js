const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

// Get all journal entries
router.get('/', journalController.getAllJournals);

// Get journal entry by ID
router.get('/:id', journalController.getJournalById);

// Create new journal entry
router.post('/', journalController.createJournal);

// Update journal entry
router.put('/:id', journalController.updateJournal);

// Delete journal entry
router.delete('/:id', journalController.deleteJournal);

// Approve journal entry
router.post('/:id/approve', journalController.approveJournal);

// Reject journal entry
router.post('/:id/reject', journalController.rejectJournal);

module.exports = router;
