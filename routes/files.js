// routes/files.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const filesController = require('../controllers/filesController');

router.get('/', authenticateToken, filesController.getFiles);
// router.post('/', authenticateToken, filesController.addFile);

module.exports = router;