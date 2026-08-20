import { showPopup } from "./popup.js";

async function login() {
  const loginId = document.getElementById("loginId").value;
  const password = document.getElementById("loginPassword").value;
  const button = document.getElementById("submit");
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!loginId) {
    showPopup("Login ID is required", 1);
    return;
  }
  if (!password) {
    showPopup("Password is required", 1);
    return;
  }
  if (!passwordRegex.test(password)) {
    showPopup("Invalid password", 1);
    return;
  }
  button.disabled = true;

  const res = await fetch("/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, password }),
  });

  button.disabled = false;

  if (res.ok) {
    showPopup("Logged in successfully!");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } else {
    const msg = await res.text();
    showPopup(msg || "Login failed.", 1);
  }
}

document.getElementById("submit").addEventListener("click", login);
