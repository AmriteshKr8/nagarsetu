import { showPopup } from "./popup.js";
const departmentSelect = document.getElementById("department");

// ------------------------------------------
// Load departments
// ------------------------------------------

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

// ------------------------------------------
// Login
// ------------------------------------------

async function login() {
  const loginId = document.getElementById("loginId").value.trim();

  const password = document.getElementById("loginPassword").value;

  const department = departmentSelect.value;

  const button = document.getElementById("submit");

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!loginId) {
    showPopup("Login ID is required", 1);
    return;
  }

  if (!department) {
    showPopup("Please select a department", 1);
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

  try {
    const res = await fetch("/login", {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        loginId,
        password,
        department,
      }),
    });

    if (res.ok) {
      showPopup("Logged in successfully!");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);

      return;
    }

    const msg = await res.text();

    showPopup(msg || "Login failed.", 1);
  } catch (error) {
    console.error("Login error:", error);

    showPopup("Unable to connect to the server.", 1);
  } finally {
    button.disabled = false;
  }
}

// ------------------------------------------
// Events
// ------------------------------------------

document.getElementById("submit").addEventListener("click", login);

// ------------------------------------------
// Initialisation
// ------------------------------------------

loadDepartments();
