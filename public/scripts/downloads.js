// =====================
// downloads.js
// SPA File Listing and Download using Cookie-Based Auth
// =====================

// Load files for the logged-in user and render them
async function loadFiles() {
  const container = document.getElementById('downloadsList');
  if (!container) return;

  try {
    const res = await fetch(`/downloads`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to load files (status ${res.status})`);

    const files = await res.json();
    renderFiles(files, container);
  } catch (err) {
    console.error('Error loading files:', err);
    container.textContent = "Failed to load files.";
  }
}

// Render files grouped by folder
function renderFiles(files, container) {
  container.innerHTML = '';

  const grouped = {};
  files.forEach(file => {
    if (!file.folder || !file.name) return;
    if (!grouped[file.folder]) grouped[file.folder] = [];
    grouped[file.folder].push(file);
  });

  for (const folder in grouped) {
    const folderDiv = document.createElement('div');
    folderDiv.className = 'folder';

    const h2 = document.createElement('h2');
    h2.textContent = folder;
    folderDiv.appendChild(h2);

    grouped[folder].forEach(file => {
      const fileDiv = document.createElement('div');
      fileDiv.className = 'file';

      const img = document.createElement('img');
      img.src = '/images/default-file.png';
      fileDiv.appendChild(img);

      const a = document.createElement('a');
      a.href = `/downloads/${encodeURIComponent(file.folder)}/${encodeURIComponent(file.name)}`;
      a.textContent = file.name;

      // Click to download using cookie-based auth
      a.addEventListener('click', async e => {
        e.preventDefault();
        try {
          const res = await fetch(a.href, { credentials: 'include' });
          if (!res.ok) throw new Error(`Download failed: ${res.status}`);

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Download error:', err);
          alert('Failed to download file.');
        }
      });

      fileDiv.appendChild(a);
      folderDiv.appendChild(fileDiv);
    });

    container.appendChild(folderDiv);
  }
}

// Setup Downloads SPA page behavior
async function setupDownloadsSPA() {
  await waitForContainer('#downloadsList');
  loadFiles();
  window.addEventListener('loginSuccess', loadFiles);
}

// Wait for a DOM element to exist
function waitForContainer(selector) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

// Expose functions to SPA
window.loadFiles = loadFiles;
window.setupDownloadsSPA = setupDownloadsSPA;
