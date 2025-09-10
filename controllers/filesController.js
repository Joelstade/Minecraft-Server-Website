const pool = require('../config/db');

exports.getFiles = async (req, res) => {
  console.log('[API FILES] Fetching files for user:', req.user?.username);

  try {
    const result = await pool.query("SELECT id, folder, name, uploaded_at FROM files ORDER BY id DESC");
    console.log('[API FILES] Retrieved rows:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('[API FILES] Failed to fetch files:', err);
    res.status(500).json({ message: 'Failed to fetch files' });
  }
};

exports.addFile = async (req, res) => {
  const { name, folder } = req.body;

  if (!name || !folder) {
    console.warn('[API FILES] Missing name or folder:', { name, folder });
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO files (name, folder) VALUES ($1, $2) RETURNING *",
      [name, folder]
    );
    console.log('[API FILES] Added new file:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[API FILES] Failed to insert file:', err);
    res.status(500).json({ message: "Failed to insert file" });
  }
};