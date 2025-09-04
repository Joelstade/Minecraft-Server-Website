function setupNavbar() {
  const token = localStorage.getItem('token');
  const loginForm = document.getElementById('loginForm');
  const registerBtn = document.getElementById('registerBtn');
  const loggedInInfo = document.getElementById('loggedInInfo');
  const currentUser = document.getElementById('currentUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const userArea = document.getElementById('userArea');

  function showLoggedIn(username) {
    currentUser.textContent = username;
    loggedInInfo.style.display = 'flex';
    userArea.style.display = 'none';
  }

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      showLoggedIn(payload.username);
    } catch {
      localStorage.removeItem('token');
    }
  }

  // --- LOGIN ---
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault(); // prevents page reload / URL leak
    const data = new FormData(loginForm);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.get('username'),
          password: data.get('password')
        })
      });
      const result = await res.json();
      if (res.ok) {
        localStorage.setItem('token', result.token);
        const payload = JSON.parse(atob(result.token.split('.')[1]));
        showLoggedIn(payload.username);
        loginForm.reset();
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  });

  // --- LOGOUT ---
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    loggedInInfo.style.display = 'none';
    userArea.style.display = 'flex';
  });

  // --- REGISTER ---
  registerBtn?.addEventListener('click', e => {
    e.preventDefault();
    loadPage('register');
    history.pushState({}, "", '/register');
  });

  // --- SPA links in navbar ---
  document.querySelectorAll('#navbar a[data-page]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const page = link.dataset.page;
      loadPage(page);
      history.pushState({}, "", link.getAttribute('href'));
    });
  });
}

window.setupNavbar = setupNavbar;