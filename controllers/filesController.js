// controllers/filesController

require('dotenv').config();
const jwt = require('jsonwebtoken');

// controllers/filesController.js
const { pool } = require('../config/db'); // your PG pool

// GET /api/files
exports.getFiles = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ token: 'Unauthorized' });

  try {
    const sql = `
      SELECT f.id, f.name, f.folder, f.uploaded_at
      FROM files f
      WHERE f.user_id = $1
      ORDER BY f.uploaded_at DESC
    `;
    const result = await pool.query(sql, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[FILES] getFiles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/* POST /api/files
exports.addFile = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { name, folder } = req.body;
  if (!name || !folder) return res.status(400).json({ message: 'Missing name or folder' });

  try {
    await pool.query(
      'INSERT INTO files(name, folder, user_id) VALUES($1, $2, $3)',
      [name, folder, userId]
    );
    res.json({ message: 'File added' });
  } catch (err) {
    console.error('[FILES] addFile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
*/