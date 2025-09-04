// downloads.js
async function loadFiles() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('/api/files?token=' + token);
    if (!res.ok) throw new Error("Failed to fetch files");
    const data = await res.json();

    const container = document.getElementById('downloadsList');
    if (!container) return;
    container.innerHTML = '';

    for (const folder in data) {
      const folderDiv = document.createElement('div');
      folderDiv.className = 'folder';

      const h2 = document.createElement('h2');
      h2.textContent = folder;
      folderDiv.appendChild(h2);

      data[folder].forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file';

        const img = document.createElement('img');
        img.src = file.picture ? `/${file.picture}` : '/images/default-file.png';
        fileDiv.appendChild(img);

        const a = document.createElement('a');
        a.href = `/download/${folder}/${file.filename}?token=${token}`;
        a.textContent = `/public/${file.displayName} (${(file.size / 1024).toFixed(1)} KB)`;
        fileDiv.appendChild(a);

        folderDiv.appendChild(fileDiv);
      });

      container.appendChild(folderDiv);
    }
  } catch (err) {
    console.error(err);
    const container = document.getElementById('downloadsList');
    if (container) container.textContent = "Failed to load files.";
  }
}
