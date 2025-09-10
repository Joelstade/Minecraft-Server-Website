const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const downloadsController = require('../controllers/downloadsController');

router.get('/downloads', authenticateToken, downloadsController.downloadFile);

module.exports = router;