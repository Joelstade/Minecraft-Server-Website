const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const filesController = require('../controllers/filesController');

router.get('/files', authenticateToken, filesController.getFiles);
router.post('/files', authenticateToken, filesController.addFile);

module.exports = router;