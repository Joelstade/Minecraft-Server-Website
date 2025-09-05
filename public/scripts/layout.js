document.addEventListener('DOMContentLoaded', async () => {
  // 1️⃣ Load navbar first
  await loadNavbar();

  // 2️⃣ Load current page based on URL
  const path = window.location.pathname;
  const page = path === '/' ? 'home' : path.replace(/^\//, '');
  loadPage(page);

  // 3️⃣ Set up SPA-style link handling
  document.addEventListener('click', e => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    e.preventDefault();

    const targetPage = link.dataset.page || link.getAttribute('href').replace(/^\//, '');
    history.pushState({}, "", link.getAttribute('href'));
    loadPage(targetPage);
  });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
  const path = window.location.pathname;
  const page = path === '/' ? 'home' : path.replace(/^\//, '');
  loadPage(page);
});

async function loadNavbar() {
  const navbarContainer = document.getElementById('navbar');
  if (!navbarContainer) return;

  try {
    console.log("Fetching /partials/navbar.html...");
    const res = await fetch('/partials/navbar.html');
    if (!res.ok) throw new Error(`Navbar not found, status: ${res.status}`);

    const html = await res.text();
    navbarContainer.innerHTML = html;
    console.log("Navbar HTML injected");

    // Automatically execute any inline <script> in navbar.html
    navbarContainer.querySelectorAll('script').forEach(oldScript => {
      const script = document.createElement('script');
      if (oldScript.src) {
        script.src = oldScript.src; // external script
      } else {
        script.textContent = oldScript.textContent; // inline script
      }
      document.body.appendChild(script);
      oldScript.remove();
    });

  } catch (err) {
    console.error("Failed to load navbar:", err);
    navbarContainer.innerHTML = "<p>Navbar failed to load</p>";
  }
}

async function loadPage(page) {
  const contentContainer = document.getElementById('content');
  if (!contentContainer) return;

  try {
    console.log(`Fetching /partials/${page}.html...`);
    const res = await fetch(`/partials/${page}.html`);
    if (!res.ok) throw new Error(`Page not found: ${page}`);

    const html = await res.text();
    contentContainer.innerHTML = html;

    // Execute inline <script> in the loaded HTML
    contentContainer.querySelectorAll('script').forEach(oldScript => {
      const script = document.createElement('script');
      if (oldScript.src) {
        script.src = oldScript.src;
      } else {
        script.textContent = oldScript.textContent;
      }
      document.body.appendChild(script);
      oldScript.remove();
    });

    // Load page-specific JS (optional external file)
    const script = document.createElement('script');
    script.src = `/scripts/${page}.js`;
    script.setAttribute('data-page-script', 'true');
    script.onload = () => {
      console.log(`${page}.js loaded`);
      if (page === 'downloads' && typeof loadFiles === 'function') loadFiles();
    };
    script.onerror = () => console.warn(`${page}.js failed to load`);
    document.body.appendChild(script);

  } catch (err) {
    console.error(`Failed to load page ${page}:`, err);
    contentContainer.innerHTML = "<h2>Page not found</h2>";
  }
}