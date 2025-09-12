// --- register.js ---
// Handles SPA registration form submission

async function handleRegisterSubmit(form) {
  if (!form) return;

  const data = new FormData(form);
  const payload = {
    username: data.get("username"),
    email: data.get("email"),
    password: data.get("password"),
  };

  const messageEl = document.getElementById("message");
  if (!messageEl) return;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    messageEl.textContent = result.message || "Error";

    if (res.ok) {
      setTimeout(() => {
        if (typeof loadPage === "function") loadPage("register-confirmation");
        history.pushState({}, "", "/register-confirmation");
      }, 1500);
    }
  } catch (err) {
    console.error("Registration error:", err);
    messageEl.textContent = "Registration failed. Please try again.";
  }
}

// Attach form + button listeners
function setupRegisterForm() {
  const form = document.getElementById("registerForm");
  const button = document.getElementById("confirm-registration");
  if (!form || !button) return;

  form.onsubmit = null;
  button.onclick = null;

  form.addEventListener("submit", e => {
    e.preventDefault();
    handleRegisterSubmit(form);
  });

  button.addEventListener("click", e => {
    e.preventDefault();
    handleRegisterSubmit(form);
  });
}

// Load registration form partial into container
async function loadRegister() {
  const container = document.getElementById("registerForm");
  if (!container) return;

  try {
    const res = await fetch("/partials/register.html");
    if (!res.ok) throw new Error(`Failed to fetch register.html (status ${res.status})`);
    const html = await res.text();
    container.innerHTML = html;

    if (typeof setupRegisterForm === "function") setupRegisterForm();
  } catch (err) {
    console.error("Register load failed:", err);
    container.innerHTML = "<p>Register failed to load</p>";
  }
}

window.loadRegister = loadRegister;
window.setupRegisterForm = setupRegisterForm;
