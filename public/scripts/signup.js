import { showPopup } from "./popup.js";
const departmentSelect = document.getElementById("department");

async function loadDepartments() {
  try {
    const res = await fetch("/api/departments", {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error("Failed to load departments");
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.departments)) {
      throw new Error("Invalid department response");
    }

    departmentSelect.innerHTML = "";

    // Placeholder
    const placeholder = document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select your department";
    placeholder.disabled = true;
    placeholder.selected = true;

    departmentSelect.appendChild(placeholder);

    // Departments
    for (const department of data.departments) {
      const option = document.createElement("option");

      option.value = department;
      option.textContent = formatDepartmentName(department);

      departmentSelect.appendChild(option);
    }
  } catch (error) {
    console.error("Department loading error:", error);

    departmentSelect.innerHTML = "";

    const option = document.createElement("option");

    option.value = "";
    option.textContent = "Unable to load departments";
    option.disabled = true;
    option.selected = true;

    departmentSelect.appendChild(option);

    showPopup("Unable to load departments", 1);
  }
}

// ------------------------------------------
// Format department name
// ------------------------------------------

function formatDepartmentName(value) {
  const names = {
    firestation: "Fire Station",
    policestation: "Police Station",
    roads: "Roads",
    sanitation: "Sanitation",
    water: "Water",
    electricity: "Electricity",
    streetlights: "Street Lights",
    parks: "Parks",
    drainage: "Drainage",
    publichealth: "Public Health",
    other: "Other",
  };

  return (
    names[value] ||
    value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

async function signup() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const password_confirm = document.getElementById("confirmPassword").value;
  const tos = document.getElementById("tos").checked;
  const button = document.getElementById("submit");
  const department = departmentSelect.value;

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!username) {
    showPopup("Username required", 1);
    return;
  }
  /*
  if (!passwordRegex.test(password)) {
    showPopup(
      "Password must contain 8+ chars, uppercase, lowercase, number, symbol",
      1,
    );
    return;
  }
  */
  if (password !== password_confirm) {
    showPopup("Passwords do NOT match", 1);
    return;
  }
  if (!tos) {
    showPopup("Please accept terms of service.", 1);
    return;
  }
  if (!department) {
    showPopup("Please select a department", 1);
    return;
  }

  button.disabled = true;

  const res = await fetch("/signup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email, department }),
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

loadDepartments();
