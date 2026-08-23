const API_URL = "/api/complaints/list";

let currentPage = 1;
let totalPages = 1;

// ------------------------------------------
// Elements
// ------------------------------------------

const complaintsContainer = document.getElementById("complaints");

const loading = document.getElementById("loading");

const empty = document.getElementById("empty");

const pageInfo = document.getElementById("pageInfo");

const previousButton = document.getElementById("previousButton");

const nextButton = document.getElementById("nextButton");

const filterButton = document.getElementById("filterButton");

const department = document.getElementById("department");

const startDate = document.getElementById("startDate");

const endDate = document.getElementById("endDate");

const sort = document.getElementById("sort");

const count = document.getElementById("count");

// ------------------------------------------
// Popup
// ------------------------------------------

function showLoginPopup() {
  if (typeof showPopup === "function") {
    showPopup(
      "Login required",
      "You must be logged in to view complaints.",
      "warning",
    );
  } else {
    alert("You must be logged in to view complaints.");
  }

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}

// ------------------------------------------
// Load complaints
// ------------------------------------------

async function loadComplaints() {
  loading.hidden = false;
  empty.hidden = true;

  complaintsContainer.innerHTML = "";

  previousButton.disabled = true;
  nextButton.disabled = true;

  const body = {
    page: currentPage,
    count: Number(count.value),
    sort: sort.value,
  };

  if (department.value) {
    body.department = department.value;
  }

  if (startDate.value) {
    body.startDate = startDate.value;
  }

  if (endDate.value) {
    body.endDate = endDate.value;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    });

    // ------------------------------------------
    // Authentication failure
    // ------------------------------------------

    if (response.status === 401 || response.status === 403) {
      showLoginPopup();
      return;
    }

    if (!response.ok) {
      let errorMessage = "Failed to load complaints.";

      try {
        const error = await response.json();

        if (error.error) {
          errorMessage = error.error;
        }
      } catch {
        // Ignore invalid JSON
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to load complaints.");
    }

    // ------------------------------------------
    // Update pagination
    // ------------------------------------------

    currentPage = result.pagination.page;

    totalPages = result.pagination.totalPages;

    pageInfo.textContent = `Page ${currentPage} of ${Math.max(totalPages, 1)}`;

    previousButton.disabled = !result.pagination.hasPreviousPage;

    nextButton.disabled = !result.pagination.hasNextPage;

    // ------------------------------------------
    // Render
    // ------------------------------------------

    renderComplaints(result.data);
  } catch (error) {
    console.error("Complaint loading error:", error);

    complaintsContainer.innerHTML = `
      <div style="
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px;
        color: #a00000;
      ">
        ${escapeHtml(error.message)}
      </div>
    `;
  } finally {
    loading.hidden = true;
  }
}

// ------------------------------------------
// Render complaints
// ------------------------------------------

function renderComplaints(complaints) {
  if (!Array.isArray(complaints) || complaints.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  complaintsContainer.innerHTML = complaints.map(renderComplaint).join("");
}

// ------------------------------------------
// Render single complaint
// ------------------------------------------

function renderComplaint(complaint) {
  const images = Array.isArray(complaint.images) ? complaint.images : [];

  const imageHtml = images
    .map(
      (image) => `
        <img
          src="${escapeAttribute(image)}"
          alt="Complaint image"
          loading="lazy"
        >
      `,
    )
    .join("");

  const reviewBadge = complaint.humanreview
    ? `
        <span class="badge review">
          Human review required
        </span>
      `
    : "";

  const solvedBadge = complaint.solved
    ? `
        <span class="badge solved">
          Solved
        </span>
      `
    : "";

  const matched = complaint.aiValidation?.matched;

  const confidence = complaint.aiValidation?.confidence;

  let aiHtml = "";

  if (matched !== null && matched !== undefined) {
    const confidenceText =
      typeof confidence === "number"
        ? `${Math.round(confidence * 100)}%`
        : "N/A";

    aiHtml = `
      <div class="meta">
        AI match:
        <strong>
          ${matched ? "Yes" : "No"}
        </strong>
        (${confidenceText})
      </div>
    `;
  }

  const date = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleString()
    : "Unknown";

  return `
    <article class="complaint">

      <div class="complaint-images">
        ${imageHtml}
      </div>

      <div class="complaint-content">

        <div>
          <span class="badge">
            ${escapeHtml(complaint.department || "Unassigned")}
          </span>

          ${reviewBadge}
          ${solvedBadge}
        </div>

        <h3>
          ${escapeHtml(complaint.issueDescription || "No description")}
        </h3>

        <div class="meta">
          Submitted: ${escapeHtml(date)}
        </div>

        ${
          complaint.location
            ? `
              <div class="meta">
                Location:
                ${escapeHtml(complaint.location)}
              </div>
            `
            : ""
        }

        <div class="meta">
          GPS:
          ${escapeHtml(String(complaint.latitude))},
          ${escapeHtml(String(complaint.longitude))}
        </div>

        ${aiHtml}

      </div>

    </article>
  `;
}

// ------------------------------------------
// Pagination
// ------------------------------------------

previousButton.addEventListener("click", () => {
  if (currentPage <= 1) {
    return;
  }

  currentPage--;

  loadComplaints();
});

nextButton.addEventListener("click", () => {
  if (currentPage >= totalPages) {
    return;
  }

  currentPage++;

  loadComplaints();
});

// ------------------------------------------
// Filters
// ------------------------------------------

filterButton.addEventListener("click", () => {
  currentPage = 1;
  loadComplaints();
});

count.addEventListener("change", () => {
  currentPage = 1;
  loadComplaints();
});

sort.addEventListener("change", () => {
  currentPage = 1;
  loadComplaints();
});

// ------------------------------------------
// HTML escaping
// ------------------------------------------

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

// ------------------------------------------
// Initial load
// ------------------------------------------

loadComplaints();
