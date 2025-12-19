// ========== FADE IN ON LOAD ==========
requestAnimationFrame(() => {
  document.body.classList.add("visible");
});

// ========== SECRET CLICK SYSTEM ==========
let clickCount = 0;
let clickTimer;

function toggleView() {
  document.body.classList.add("fade-out");

  setTimeout(() => {
    const user = document.getElementById("userView");
    const admin = document.getElementById("adminView");
    const title = document.getElementById("left-title");

    user.classList.toggle("show");
    user.classList.toggle("hide");

    admin.classList.toggle("show");
    admin.classList.toggle("hide");

    title.innerHTML = admin.classList.contains("show")
      ? "CTO<br>-<br>Welcome Admin"
      : "CTO<br>-<br>COMPENSATORY TIME OFF";

    document.body.classList.remove("fade-out");
    document.body.classList.add("visible");
  }, 600);
}

function setupSecret(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.addEventListener("click", () => {
    clickCount++;
    clearTimeout(clickTimer);

    if (clickCount >= 7) {
      toggleView();
      clickCount = 0;
    }

    clickTimer = setTimeout(() => clickCount = 0, 3000);
  });
}

// Apply to all secret triggers
setupSecret("secret-logo");
setupSecret("secret-nav");
setupSecret("secret-nav2");

  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      }
    });
  });
