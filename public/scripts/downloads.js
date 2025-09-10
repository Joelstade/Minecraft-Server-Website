// downloads.js
async function loadFiles() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/files?token=' + encodeURIComponent(token));
    if (!res.ok) throw new Error("Failed to fetch files");
    const files = await res.json();

    const container = document.getElementById('downloadsList');
    if (!container) return;
    container.innerHTML = '';

    // Group files by folder
    const grouped = {};
    files.forEach(file => {
      if (!file.folder || !file.name) {
        console.warn('Skipping invalid file entry:', file);
        return;
      }
      if (!grouped[file.folder]) grouped[file.folder] = [];
      grouped[file.folder].push(file);
    });

    // Render folders and files
    for (const folder in grouped) {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder';

      const h2 = document.createElement('h2');
      h2.textContent = folder;
      folderDiv.appendChild(h2);

      grouped[folder].forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file';

        // Default icon
        const img = document.createElement('img');
        img.src = '/images/default-file.png';
        fileDiv.appendChild(img);

        const a = document.createElement('a');
        a.href = `/download/${encodeURIComponent(file.folder)}/${encodeURIComponent(file.name)}?token=${encodeURIComponent(token)}`;
        a.textContent = file.name;
        fileDiv.appendChild(a);

        folderDiv.appendChild(fileDiv);
      });

      container.appendChild(folderDiv);
    }
  } catch (err) {
    console.error('Error loading files:', err);
    const container = document.getElementById('downloadsList');
    if (container) container.textContent = "Failed to load files.";
  }
}
