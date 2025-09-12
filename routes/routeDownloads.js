// routes/downloads.js
// Routes for downloading files, using user-based file access
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const filesController = require('../controllers/filesController');
const downloadsController = require('../controllers/downloadsController');

// GET /downloads — list user files
router.get('/', authenticateToken, filesController.getFiles);

// GET /downloads/:folder/:name — download specific file
router.get('/:folder/:name', authenticateToken, downloadsController.downloadFile);

module.exports = router;