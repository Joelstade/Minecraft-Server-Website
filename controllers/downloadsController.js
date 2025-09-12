const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);
const { pool } = require('../config/db');
const BASE_DIR = path.join(__dirname, '..', 'downloads');

exports.downloadFile = async (req, res) => {
  const { folder, name } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE folder=$1 AND name=$2 AND user_id=$3',
      [folder, name, userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: 'File not found or access denied' });

    const filePath = path.join(BASE_DIR, folder, name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    const stats = fs.statSync(filePath);

    // Set headers including Content-Length for progress bar
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);

    const readStream = fs.createReadStream(filePath);

    // Stream the file to response
    await pipe(readStream, res);
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};