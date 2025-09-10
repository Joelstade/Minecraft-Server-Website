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
    const res = await fetch("/api/auth/register", { // <-- correct path
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    messageEl.textContent = result.message || "Error";

    if (res.ok) {
      // SPA navigation
      setTimeout(() => {
        if (typeof loadPage === "function") {
          loadPage("register-confirmation");
        }
        history.pushState({}, "", "/register-confirmation");
      }, 1500);
    }
  } catch (err) {
    console.error("Registration error:", err);
    messageEl.textContent = "Registration failed. Please try again.";
  }
}

function attachRegisterButton() {
  const button = document.getElementById("confirm-registration");
  const form = document.getElementById("registerForm");

  if (!button || !form) return;
  if (button._listenerAttached) return;
  button._listenerAttached = true;

  form.addEventListener("submit", (e) => e.preventDefault());
  button.addEventListener("click", () => handleRegisterSubmit(form));
}

function initRegisterButton() {
  attachRegisterButton();

  const observer = new MutationObserver(() => {
    const form = document.getElementById("registerForm");
    const button = document.getElementById("confirm-registration");
    if (form && button && !button._listenerAttached) attachRegisterButton();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

window.initRegisterButton = initRegisterButton;