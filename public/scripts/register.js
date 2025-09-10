// --- Handle registration submission ---
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

  console.log("Register button clicked, payload:", payload);

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    console.log("Server response:", result);

    messageEl.textContent = result.message || "Error";

    if (res.ok) {
      // Navigate SPA-style to confirmation page
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

// --- Attach click listener to button ---
function attachRegisterButton() {
  const button = document.getElementById("confirm-registration");
  const form = document.getElementById("registerForm");

  if (!button || !form) {
    console.warn("Register elements not found yet:", { button, form });
    return;
  }

  if (button._listenerAttached) return;
  button._listenerAttached = true;

  // Prevent default form submission
  form.addEventListener("submit", (e) => e.preventDefault());

  // Click listener
  button.addEventListener("click", () => handleRegisterSubmit(form));
  console.log("[INFO] Register button listener attached");
}

// --- Initialize SPA-safe register button ---
function initRegisterButton() {
  attachRegisterButton();

  // Observe DOM changes for SPA re-renders
  const observer = new MutationObserver(() => {
    const form = document.getElementById("registerForm");
    const button = document.getElementById("confirm-registration");
    if (form && button && !button._listenerAttached) {
      console.log("[INFO] Re-attaching listener due to SPA render");
      attachRegisterButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("[INFO] MutationObserver started for register page");
}

// --- SPA-safe delegation as a backup ---
document.body.addEventListener("click", (e) => {
  if (!e.target.closest("#confirm-registration")) return;
  e.preventDefault();
  const form = document.getElementById("registerForm");
  handleRegisterSubmit(form);
});

// --- Export for SPA load ---
window.initRegisterButton = initRegisterButton;