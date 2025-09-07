document.addEventListener('DOMContentLoaded', async () => {
  // 1️⃣ Load navbar first (only once)
  await loadNavbar();

  // 2️⃣ Load current page based on URL
  const path = window.location.pathname;
  const page = path === '/' ? 'home' : path.replace(/^\//, '');
  loadPage(page);

  // 3️⃣ SPA-style link handling (attach once)
  if (!window._spaNavAttached) {
    document.addEventListener('click', e => {
      const link = e.target.closest('.nav-link');
      if (!link) return;
      e.preventDefault();

      const targetPage =
        link.dataset.page || link.getAttribute('href').replace(/^\//, '');
      history.pushState({}, '', link.getAttribute('href'));
      loadPage(targetPage);
    });
    window._spaNavAttached = true;
  }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const path = window.location.pathname;
  const page = path === '/' ? 'home' : path.replace(/^\//, '');
  loadPage(page);
});

let navbarLoaded = false;
async function loadNavbar() {
  if (navbarLoaded) return;
  navbarLoaded = true;

  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  try {
    console.log('Fetching /partials/navbar.html...');
    const res = await fetch('/partials/navbar.html');
    if (!res.ok) throw new Error(`Navbar not found, status: ${res.status}`);

    const html = await res.text();
    navbarContainer.innerHTML = html;
    console.log('Navbar HTML injected');

    // Call setupNavbar() only once
    if (typeof window.setupNavbar === 'function') {
      window.setupNavbar();
    }
  } catch (err) {
    console.error('Failed to load navbar:', err);
    navbarContainer.innerHTML = '<p>Navbar failed to load</p>';
  }
}

async function loadPage(page) {
  const contentContainer = document.getElementById('content');
  if (!contentContainer) {
    console.error("Content container not found");
    return;
  }

  try {
    console.log(`Fetching /partials/${page}.html...`);
    const res = await fetch(`/partials/${page}.html`);
    if (!res.ok) throw new Error(`Page not found: ${page}`);

    const html = await res.text();
    contentContainer.innerHTML = html;
    console.log(`Page ${page} loaded`);

    // Always load page-specific JS to ensure listeners are attached
    const existingScript = document.querySelector(`script[data-page="${page}"]`);
    if (existingScript) {
      existingScript.remove(); // Remove old script to avoid conflicts
    }

    const script = document.createElement('script');
    script.src = `/scripts/${page}.js`;
    script.dataset.page = page;
    script.onload = () => {
      console.log(`${page}.js loaded`);
      if (page === 'downloads' && typeof loadFiles === 'function') {
        loadFiles();
      }
    };
    script.onerror = () => console.warn(`${page}.js failed to load`);
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Failed to load page ${page}:`, err);
    contentContainer.innerHTML = '<h2>Page not found</h2>';
  }
}
