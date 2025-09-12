// scanFiles.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db'); // PG pool

const DOWNLOADS_DIR = path.join(__dirname, 'downloads'); // mounted folder
const RESCAN_INTERVAL = 60 * 1000; // 1 minute

// Recursively scan folder, returning array of {name, folder}
async function scanFolder(folderPath, baseFolder = '') {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await scanFolder(fullPath, path.join(baseFolder, entry.name));
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push({ name: entry.name, folder: baseFolder || 'root' });
    }
  }

  return files;
}

// Sync filesystem with database
async function syncDB() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.warn(`[SCANFILES] Downloads folder does not exist: ${DOWNLOADS_DIR}`);
    return;
  }

  try {
    const fsFiles = await scanFolder(DOWNLOADS_DIR);
    const dbRes = await pool.query('SELECT name, folder FROM files');
    const dbFiles = dbRes.rows;

    // Add new files
    for (const f of fsFiles) {
      if (!dbFiles.some(d => d.name === f.name && d.folder === f.folder)) {
        await pool.query(
          'INSERT INTO files(name, folder, user_id) VALUES($1, $2, $3)',
          [f.name, f.folder, 1] // replace 1 with your admin user_id
        );
        console.log(`[SCANFILES] Added file to DB: ${f.folder}/${f.name}`);
      }
    }

    // Remove deleted files
    for (const d of dbFiles) {
      if (!fsFiles.some(f => f.name === d.name && f.folder === d.folder)) {
        await pool.query('DELETE FROM files WHERE name=$1 AND folder=$2', [d.name, d.folder]);
        console.log(`[SCANFILES] Removed file from DB: ${d.folder}/${d.name}`);
      }
    }
  } catch (err) {
    console.error('[SCANFILES] Sync error:', err);
  }
}

// Run initial sync and start periodic rescan
(async () => {
  await syncDB();
  console.log('[SCANFILES] Initial scan complete.');

  setInterval(async () => {
    await syncDB();
  }, RESCAN_INTERVAL);
})();
