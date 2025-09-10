// --- Setup login form ---
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!form || !logoutBtn) return;

  // Restore token if present
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      showLoggedIn(payload.username);
    } catch {
      localStorage.removeItem('token');
    }
  }

  // Remove old listeners to prevent duplicates
  form.onsubmit = null;
  logoutBtn.onclick = null;

  form.addEventListener('submit', e => {
    e.preventDefault();
    handleLoginSubmit(form);
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    document.getElementById('loggedInInfo').style.display = 'none';
    document.getElementById('userArea').style.display = 'flex';
  });
}

// --- Handle login submit ---
async function handleLoginSubmit(form) {
  const data = new FormData(form);
  const payload = {
    username: data.get('username'),
    password: data.get('password')
  };

  try {
	const res = await fetch("/api/login", { // relative URL, same host/port
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify(payload)
	});

    const result = await res.json();
    if (res.ok && result.token) {
      localStorage.setItem('token', result.token);
      const payloadDecoded = JSON.parse(atob(result.token.split('.')[1]));
      showLoggedIn(payloadDecoded.username);
      form.reset();
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login error');
  }
}

// --- Show logged-in user ---
function showLoggedIn(username) {
  document.getElementById('currentUser').textContent = username;
  document.getElementById('loggedInInfo').style.display = 'flex';
  document.getElementById('userArea').style.display = 'none';
}
