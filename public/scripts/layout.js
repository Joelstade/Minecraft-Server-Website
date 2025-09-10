// =====================
// SPA Layout Loader
// =====================

let navbarLoaded = false;
let loginLoaded = false;

// ---------------------
// Load Navbar (left links)
// ---------------------
async function loadNavbar() {
  if (navbarLoaded) return;
  navbarLoaded = true;

  const container = document.getElementById('nav-left-container');
  if (!container) return;

  try {
    const res = await fetch('/partials/navbar.html');
    if (!res.ok) throw new Error(`Failed to fetch navbar.html (status ${res.status})`);
    const html = await res.text();
    container.innerHTML = html;

    setupNavbar();
    console.log('[INFO] Navbar loaded');
  } catch (err) {
    console.error('Navbar load failed:', err);
    container.innerHTML = '<p>Navbar failed to load</p>';
  }
}

// ---------------------
// Setup SPA links in navbar
// ---------------------
function setupNavbar() {
  if (window._navbarInitialized) return;
  window._navbarInitialized = true;

  document.querySelectorAll('#nav-left-container a[data-page]').forEach(link => {
    if (!link._listenerAttached) {
      link.addEventListener('click', e => {
        e.preventDefault();
        loadPage(link.dataset.page);
        history.pushState({}, '', link.getAttribute('href'));
      });
      link._listenerAttached = true;
    }
  });

  console.log('[INFO] setupNavbar() initialized');
}

// ---------------------
// Load Login (right part)
// ---------------------
async function loadLogin() {
  if (loginLoaded) return;
  loginLoaded = true;

  const container = document.getElementById('login-container');
  if (!container) return;

  try {
    const res = await fetch('/partials/login.html');
    if (!res.ok) throw new Error(`Failed to fetch login.html (status ${res.status})`);
    const html = await res.text();
    container.innerHTML = html;

    // Only call setupLoginForm() from login.js
    if (typeof setupLoginForm === 'function') {
      setupLoginForm();
    }

    console.log('[INFO] Login form loaded');
  } catch (err) {
    console.error('Login load failed:', err);
    container.innerHTML = '<p>Login failed to load</p>';
  }
}

// ---------------------
// SPA Page Loader
// ---------------------
async function loadPage(page) {
  const container = document.getElementById('content');
  if (!container) return;

  try {
    const res = await fetch(`/partials/${page}.html`);
    if (!res.ok) throw new Error(`Failed to load page: ${page} (status ${res.status})`);
    const html = await res.text();
    container.innerHTML = html;

    // Load page-specific JS dynamically
    const existingScript = document.querySelector(`script[data-page="${page}"]`);
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.src = `/scripts/${page}.js`;
    script.dataset.page = page;
    document.body.appendChild(script);

    console.log(`[INFO] Page loaded: ${page}`);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<h2>Page not found</h2>';
  }
}

// ---------------------
// SPA Link Handling
// ---------------------
function setupSPALinks() {
  if (window._spaNavAttached) return;
  window._spaNavAttached = true;

  document.addEventListener('click', e => {
    const link = e.target.closest('.nav-link, .register-link');
    if (!link) return;
    e.preventDefault();

    const page = link.dataset.page || link.getAttribute('href').replace(/^\//, '');
    history.pushState({}, '', link.getAttribute('href'));
    loadPage(page);
  });
}

// ---------------------
// Browser Back/Forward
// ---------------------
window.addEventListener('popstate', () => {
  const page = window.location.pathname.replace(/^\//, '') || 'home';
  loadPage(page);
});

// ---------------------
// Initialize SPA
// ---------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await loadLogin();
  setupSPALinks();

  // Load initial page
  const page = window.location.pathname.replace(/^\//, '') || 'home';
  loadPage(page);
});