const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:supersecret@localhost:5432/app_db';

const pool = new Pool({ connectionString: DATABASE_URL });

async function printFilesTree() {
  try {
    const res = await pool.query('SELECT name, folder, user_id FROM files ORDER BY folder, name');
    if (!res.rows.length) {
      console.log('No files found in database.');
      return;
    }

    const tree = {};
    res.rows.forEach(file => {
      if (!tree[file.folder]) tree[file.folder] = [];
      tree[file.folder].push(file.name);
    });

    console.log('Files Tree from DB:');
    for (const folder in tree) {
      console.log(`📁 ${folder}`);
      tree[folder].forEach(fileName => console.log(`   └─ ${fileName}`));
    }
  } catch (err) {
    console.error('[FILES TREE] Error:', err);
  }
}

module.exports = { pool, printFilesTree };