const path = require('path');
const fs = require('fs');

const DOWNLOADS_DIR = path.resolve(__dirname, '../public/downloads');

exports.downloadFile = (req, res) => {
  const folder = req.query.folder;
  const name = req.query.name;

  console.log('[DOWNLOAD] Requested folder:', folder, 'name:', name);

  if (!folder || !name) {
    console.error('[DOWNLOAD] Missing folder or name parameter!');
    return res.status(400).json({ message: 'Missing folder or filename' });
  }

  const filePath = path.join(DOWNLOADS_DIR, folder, name);
  console.log('[DOWNLOAD] Resolved filePath:', filePath);

  if (fs.existsSync(filePath)) {
    console.log('[DOWNLOAD] File exists, sending download...');
    return res.download(filePath);
  }

  console.warn('[DOWNLOAD] File not found at path:', filePath);
  res.status(404).json({ message: 'File not found' });
};