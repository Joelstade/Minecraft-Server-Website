// controllers/downloadsController.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db'); // database pool
const BASE_DIR = path.join(__dirname, '..', 'downloads');

// Stream a single file if the user owns it
exports.downloadFile = async (req, res) => {
  const { folder, name } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Check if this file belongs to the user
    const result = await pool.query(
      'SELECT * FROM files WHERE folder=$1 AND name=$2 AND user_id=$3',
      [folder, name, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const filePath = path.join(BASE_DIR, folder, name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, name, err => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Failed to download file' });
      }
    });

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};