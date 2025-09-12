// =====================
// layout.js
// SPA Layout Loader
// =====================

let navbarLoaded = false;
let loginLoaded = false;

// Load a partial page into #content
async function loadPage(page) {
  const main = document.getElementById('content');
  if (!main) return;

  main.innerHTML = "Loading...";

  try {
    const res = await fetch(`/partials/${page}.html`);
    if (!res.ok) throw new Error("Page not found");
    const html = await res.text();
    main.innerHTML = html;

    // Page-specific initialization
    if (page === 'downloads' && typeof setupDownloadsSPA === 'function') {
      setupDownloadsSPA();
    }
    if (page === 'register' && typeof setupRegisterForm === 'function') {
      setupRegisterForm();
    }

  } catch (err) {
    console.error('Failed to load page:', err);
    main.textContent = "Failed to load page.";
  }
}

// Setup SPA navigation links
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

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const page = window.location.pathname.replace(/^\//, '') || 'home';
  loadPage(page);
});

// Initialize SPA: load navbar, login, register forms and setup links
document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await loadLogin();
  await loadRegister();
  setupSPALinks();

  const page = window.location.pathname.replace(/^\//, '') || 'home';
  loadPage(page);
});
