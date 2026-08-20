import { showPopup } from "./popup.js";

async function signup() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const password_confirm = document.getElementById("confirmPassword").value;
  const tos = document.getElementById("tos").checked;
  const button = document.getElementById("submit");

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!username) {
    showPopup("Username required", 1);
    return;
  }
  if (!passwordRegex.test(password)) {
    showPopup(
      "Password must contain 8+ chars, uppercase, lowercase, number, symbol",
      1
    );
    return;
  }
  if (password !== password_confirm) {
    showPopup("Passwords do NOT match", 1);
    return;
  }
  if (!tos) {
    showPopup("Please accept terms of service.", 1);
    return;
  }

  button.disabled = true;

  const res = await fetch("/signup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });

  button.disabled = false;

  if (res.ok) {
    showPopup("Account created!");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } else {
    const msg = await res.text();
    showPopup(msg || "Signup failed.", 1);
  }
}

document.getElementById("submit").addEventListener("click", signup);
