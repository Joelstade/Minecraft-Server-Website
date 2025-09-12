// --- login.js ---
// Handles SPA login form, logout, and session restoration using cookies

window.loginLoaded = window.loginLoaded || false;

// Attach login + logout listeners
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!form || !logoutBtn) return;

  form.onsubmit = null;
  logoutBtn.onclick = null;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    await handleLoginSubmit(form);
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    showLoggedOut();
  });
}

// Handle login submission; token is now in HttpOnly cookie
async function handleLoginSubmit(form) {
  const data = new FormData(form);
  const payload = {
    username: data.get('username'),
    password: data.get('password')
  };

  try {
    const res = await fetch("/api/auth/login", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include' // ensures cookies are sent/received
    });

    const result = await res.json();

    if (res.ok) {
      showLoggedIn(result.user.username);
      form.reset();
      window.dispatchEvent(new Event('loginSuccess'));
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login error');
  }
}

// Display logged-in state
function showLoggedIn(username) {
  const loggedInInfo = document.getElementById('loggedInInfo');
  const userArea = document.getElementById('userArea');
  const currentUser = document.getElementById('currentUser');

  if (!loggedInInfo || !userArea || !currentUser) return;

  currentUser.textContent = username;
  loggedInInfo.style.display = 'flex';
  userArea.style.display = 'none';
}

// Display logged-out state
function showLoggedOut() {
  const loggedInInfo = document.getElementById('loggedInInfo');
  const userArea = document.getElementById('userArea');

  if (!loggedInInfo || !userArea) return;

  loggedInInfo.style.display = 'none';
  userArea.style.display = 'flex';
}

// Load login partial and attach listeners
async function loadLogin() {
  if (window.loginLoaded) return;
  window.loginLoaded = true;

  const container = document.getElementById('login-container');
  if (!container) return;

  try {
    const res = await fetch('/partials/login.html');
    if (!res.ok) throw new Error(`Failed to fetch login.html (status ${res.status})`);
    const html = await res.text();
    container.innerHTML = html;

    setupLoginForm();
    console.log('[INFO] Login form loaded');
  } catch (err) {
    console.error('Login load failed:', err);
    container.innerHTML = '<p>Login failed to load</p>';
  }
}

async function restoreSession() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) throw new Error('No active session');

    const data = await res.json();
    showLoggedIn(data.user.username);
    window.dispatchEvent(new Event('loginSuccess'));
  } catch {
    showLoggedOut();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadNavbar();
  await loadLogin();
  await loadRegister();
  setupSPALinks();

  await restoreSession(); // <- restore login before loading page

  const page = window.location.pathname.replace(/^\//, '') || 'home';
  await loadPage(page);
});

window.setupLoginForm = setupLoginForm;
window.loadLogin = loadLogin;
