import { showPopup } from "./popup.js";

async function requestReset(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const button = document.getElementById("submit");

  if (!email) {
    showPopup("Email is required", 1);
    return;
  }

  button.disabled = true;

  const res = await fetch("/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  button.disabled = false;

  if (res.ok) {
    showPopup("Reset link sent! Check your email.");
  } else {
    const msg = await res.text();
    showPopup(msg || "Failed to send reset link", 1);
  }
}

document.querySelector("form").addEventListener("submit", requestReset);
