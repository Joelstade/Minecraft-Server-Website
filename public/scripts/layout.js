// --- SPA Layout Loader ---
async function loadNavbar() {
  try {
    const res = await fetch('/partials/navbar.html');
    if (!res.ok) throw new Error("Navbar not found");
    document.getElementById('navbar').innerHTML = await res.text();
    // Load navbar.js
    await new Promise(resolve => {
      const script = document.createElement('script');
      script.src = '/scripts/navbar.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('navbar').innerHTML = "<p>Navbar failed to load</p>";
  }
}

async function loadPage(page) {
  try {
    const res = await fetch(`/partials/${page}.html`);
    if (!res.ok) throw new Error("Page not found");
    const html = await res.text();
    const content = document.getElementById('content');
    content.innerHTML = html;

    document.querySelectorAll('script[data-page-script]').forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = `/scripts/${page}.js`;
    script.setAttribute('data-page-script', 'true');
    script.onload = () => {
      if (page === 'downloads' && typeof loadFiles === 'function') loadFiles();
    };
    document.body.appendChild(script);
  } catch (err) {
    console.error(err);
    document.getElementById('content').innerHTML = "<h2>Page not found</h2>";
  }
}

function getCurrentPage() {
  const path = window.location.pathname;
  return path === "/" || path === "" ? "home" : path.replace(/^\//, "");
}

function setupSpaLinks() {
  document.addEventListener('click', e => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();
    const page = link.dataset.page || link.getAttribute('href').replace(/^\//, '');
    history.pushState({}, "", link.getAttribute('href'));
    loadPage(page);
  });
}

window.addEventListener('popstate', () => loadPage(getCurrentPage()));

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  loadPage(getCurrentPage());
  setupSpaLinks();
});