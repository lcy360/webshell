const form = document.getElementById("loginForm");
const error = document.getElementById("loginError");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    error.textContent = body.error || "Login failed";
    error.hidden = false;
    return;
  }

  window.location.href = "/";
});
