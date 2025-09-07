attachRegisterButton() 
initRegisterButton()

function attachRegisterButton() {
  const button = document.getElementById("confirm-registration");
  const form = document.getElementById("registerForm");
  const messageEl = document.getElementById("message");

  console.log("attachRegisterButton called", { button, form, messageEl });

  if (!button || !form || !messageEl) {
    console.error("Missing elements:", { button, form, messageEl });
    return;
  }

  if (button._listenerAttached) {
    console.log("Listener already attached");
    return;
  }
  button._listenerAttached = true;

  // Prevent default form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form submission prevented");
  });

  button.addEventListener("click", async () => {
    console.log("Register button clicked");
    const data = new FormData(form);
    console.log("Form data:", Object.fromEntries(data));

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.get("username"),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });

      const result = await res.json();
      console.log("Server response:", result);
      messageEl.textContent = result.message || "Error";

      if (res.ok) {
        setTimeout(() => {
          if (typeof loadPage === "function") {
            console.log("Navigating to register-confirmation");
            loadPage("register-confirmation");
          } else {
            console.warn("loadPage function not found");
          }
          history.pushState({}, "", "/register-confirmation");
        }, 1500);
      } else {
        messageEl.textContent = result.message || "Registration failed.";
      }
    } catch (err) {
      console.error("Registration error:", err.message, err.stack);
      messageEl.textContent = "Registration failed. Please try again.";
    }
  });
}

function initRegisterButton() {
  const form = document.getElementById("registerForm");
  const button = document.getElementById("confirm-registration");

  console.log("initRegisterButton called", { form, button });

  if (form && button) {
    attachRegisterButton();
  }

  // Keep observing for SPA re-renders
  console.log("Starting MutationObserver");
  const observer = new MutationObserver(() => {
    const form = document.getElementById("registerForm");
    const button = document.getElementById("confirm-registration");
    if (form && button && !button._listenerAttached) {
      console.log("Elements found, re-attaching listener");
      attachRegisterButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("DOMContentLoaded", initRegisterButton);