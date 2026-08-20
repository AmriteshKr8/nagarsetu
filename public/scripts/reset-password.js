import { showPopup } from "./popup.js";

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");
const userId = urlParams.get("id");

document.querySelector("input[name='resetToken']").value = token || "";
document.querySelector("input[name='userId']").value = userId || "";

async function resetPassword(e) {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const resetToken = document.querySelector("input[name='resetToken']").value;
  const userId = document.querySelector("input[name='userId']").value;

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    showPopup(
      "Password must contain 8+ chars, uppercase, lowercase, number, symbol",
      1
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    showPopup("Passwords do NOT match", 1);
    return;
  }

  if (!resetToken || !userId) {
    showPopup("Invalid reset link", 1);
    return;
  }

  const button = e.target.querySelector("button[type='submit']");
  button.disabled = true;

  const res = await fetch("/reset-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token:resetToken , id:userId, newPassword }),
  });

  button.disabled = false;

  if (res.ok) {
    showPopup("Password updated successfully!");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } else {
    const msg = await res.text();
    showPopup(msg || "Failed to reset password", 1);
  }
}

document.getElementById("resetForm").addEventListener("submit", resetPassword);
