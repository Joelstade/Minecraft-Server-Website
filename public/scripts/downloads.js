// =====================
// downloads.js
// SPA File Listing and Download using Cookie-Based Auth
// =====================

// Load files for the logged-in user and render them
async function loadFiles() {
  const container = document.getElementById('downloadsList');
  if (!container) return;

  try {
    const res = await fetch(`/api/files`, { credentials: 'include' });
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

  // Group files by folder
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
      img.className = 'file-icon';
      fileDiv.appendChild(img);

      const a = document.createElement('a');
      a.href = `/routeDownloads/${encodeURIComponent(file.folder)}/${encodeURIComponent(file.name)}`;
      a.textContent = file.name;
      a.className = 'file-link';
      fileDiv.appendChild(a);

      // Progress bar container
      const progressContainer = document.createElement('div');
      progressContainer.className = 'progress-bar-container';
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      progressContainer.appendChild(progressBar);
      fileDiv.appendChild(progressContainer);

      // Click to download
	  a.addEventListener('click', async e => {
	    e.preventDefault();
	    progressBar.style.width = '0%';
	    progressBar.textContent = '';

	    try {
	      const res = await fetch(a.href, { credentials: 'include' });
	      if (!res.ok) throw new Error(`Download failed: ${res.status}`);

	      const reader = res.body.getReader();
	      const contentLength = +res.headers.get('Content-Length') || 0;
	      let receivedLength = 0;
	      const chunks = [];

		  let displayedPercent = 0;

		  while (true) {
		    const { done, value } = await reader.read();
		    if (done) break;
		    chunks.push(value);
		    receivedLength += value.byteLength;

		    if (contentLength) {
		      const targetPercent = Math.floor((receivedLength / contentLength) * 100);
		      // Smooth: move displayedPercent halfway to target
		      displayedPercent += (targetPercent - displayedPercent) * 0.3;
		      progressBar.style.width = displayedPercent.toFixed(1) + '%';
		      progressBar.textContent = Math.floor(displayedPercent) + '%';
		    }
		  }

	      const blob = new Blob(chunks);
	      const url = URL.createObjectURL(blob);
	      const link = document.createElement('a');
	      link.href = url;
	      link.download = file.name;
	      link.click();
	      URL.revokeObjectURL(url);

	      progressBar.style.width = '0%';
	      progressBar.textContent = '';
	    } catch (err) {
	      console.error('Download error:', err);
	      alert('Failed to download file.');
	      progressBar.style.width = '0%';
	      progressBar.textContent = '';
	    }
	  });

      folderDiv.appendChild(fileDiv);
    });

    container.appendChild(folderDiv);
  }
}

// Setup Downloads SPA page behavior
async function setupDownloadsSPA() {
  await waitForContainer('#downloadsList');
  await loadFiles();
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

// Expose functions globally
window.loadFiles = loadFiles;
window.setupDownloadsSPA = setupDownloadsSPA;
