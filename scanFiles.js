// scanFiles.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // File watcher
const { pool } = require('./config/db'); // Your PG pool

const DOWNLOADS_DIR = path.join(__dirname, 'downloads'); // Adjust if mounted elsewhere

console.log(DOWNLOADS_DIR);

// Helper: insert file into DB if not exists
async function addFileToDB(name, folder) {
  try {
    const res = await pool.query(
      'SELECT * FROM files WHERE name=$1 AND folder=$2',
      [name, folder]
    );

    if (res.rows.length === 0) {
      await pool.query(
        'INSERT INTO files(name, folder, user_id) VALUES($1, $2, $3)',
        [name, folder, 1] // Replace '1' with actual admin user_id or config
      );
      console.log(`Added file to DB: ${folder}/${name}`);
    }
  } catch (err) {
    console.error('[SCANFILES] DB error:', err);
  }
}

// Scan folder recursively
async function scanFolder(folderPath, baseFolder = '') {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      await scanFolder(fullPath, path.join(baseFolder, entry.name));
    } else if (entry.isFile()) {
      await addFileToDB(entry.name, baseFolder || 'root');
    }
  }
}

// Initial scan
async function initialScan() {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    console.warn(`[SCANFILES] Downloads folder does not exist: ${DOWNLOADS_DIR}`);
    return;
  }
  await scanFolder(DOWNLOADS_DIR);
  console.log('[SCANFILES] Initial scan complete');
}

// Watch for changes
function watchDownloads() {
  const watcher = chokidar.watch(DOWNLOADS_DIR, {
    persistent: true,
    ignoreInitial: true,
    depth: 10,
  });

  watcher.on('add', async (filePath) => {
    const relative = path.relative(DOWNLOADS_DIR, filePath);
    const folder = path.dirname(relative);
    const name = path.basename(filePath);
    await addFileToDB(name, folder === '.' ? 'root' : folder);
    console.log(`[SCANFILES] New file detected: ${folder}/${name}`);
  });

  watcher.on('unlink', async (filePath) => {
    const relative = path.relative(DOWNLOADS_DIR, filePath);
    const folder = path.dirname(relative);
    const name = path.basename(filePath);
    try {
      await pool.query('DELETE FROM files WHERE name=$1 AND folder=$2', [name, folder === '.' ? 'root' : folder]);
      console.log(`[SCANFILES] File removed from DB: ${folder}/${name}`);
    } catch (err) {
      console.error('[SCANFILES] Failed to remove file from DB:', err);
    }
  });

  console.log('[SCANFILES] Watching for changes in downloads folder...');
}

// Run
(async () => {
  await initialScan();
  watchDownloads();
})();