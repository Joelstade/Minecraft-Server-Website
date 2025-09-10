async function loadNavbar() {
  const container = document.getElementById('nav-left-container');
  if (!container) return;

  try {
    const res = await fetch('/partials/navbar.html');
    if (!res.ok) throw new Error('Failed to fetch navbar.html');
    container.innerHTML = await res.text();

    // SPA link handling
    setupNavbar();
  } catch (err) {
    console.error('Navbar load failed:', err);
    container.innerHTML = '<p>Navbar failed to load</p>';
  }
}

function setupNavbar() {
  if (window._navbarInitialized) return;
  window._navbarInitialized = true;

  document.querySelectorAll('#nav-left-container a[data-page]').forEach(link => {
    if (!link._listenerAttached) {
      link.addEventListener('click', e => {
        e.preventDefault();
        const page = link.dataset.page;
        loadPage(page);
        history.pushState({}, '', link.getAttribute('href'));
      });
      link._listenerAttached = true;
    }
  });

  console.log('[INFO] setupNavbar() initialized');
}

window.loadNavbar = loadNavbar;
window.setupNavbar = setupNavbar;
