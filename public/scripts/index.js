const DOM = {
  mainSidebar: document.getElementById("mainSidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  filterToggle: document.getElementById("filterToggle"),
  sidebarClose: document.getElementById("sidebarClose"),
  productGrid: document.getElementById("productGrid"),
  spinner: document.getElementById("loadingSpinner"),
  sentinel: document.getElementById("sentinel"),
  chatToggleBtn: document.getElementById("chatToggleBtn"),
  chatBox: document.getElementById("chatbox"),
  closeChatBtn: document.getElementById("closeChatBtn"),
  dropBox: document.getElementById("dropBox"),
  chatMessages: document.getElementById("chatMessages"),
  chatInput: document.getElementById("chatInput"),
  sendBtn: document.getElementById("sendBtn"),
};

const state = {
  isLoading: false,
  hasMore: true,
  draggedProduct: null,
  chatHistory: [],
  sessionId: sessionStorage.getItem("invman_session") || crypto.randomUUID()
};

if (!sessionStorage.getItem("invman_session")) {
  sessionStorage.setItem("invman_session", state.sessionId);
}

async function fetchProducts() {
  if (state.isLoading || !state.hasMore) return;

  state.isLoading = true;
  DOM.spinner.classList.add("active");

  const currentProducts = document.querySelectorAll(".product");
  const seenIds = Array.from(currentProducts).map((el) => el.dataset.id);

  try {
    const res = await fetch("/products/api/homepage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seenIds }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const products = await res.json();

    if (products.length > 0) {
      renderProducts(products);

      if (products.length < 20) {
        state.hasMore = false;
        if (DOM.sentinel) DOM.sentinel.remove();
        DOM.spinner.innerText = "End of results";
      }
    } else {
      state.hasMore = false;
      if (DOM.sentinel) DOM.sentinel.remove();
      if (seenIds.length === 0) {
        DOM.productGrid.innerHTML =
          '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--muted)">No in-stock products found.</div>';
      } else {
        DOM.spinner.innerText = "End of results";
      }
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  } finally {
    state.isLoading = false;
    if (state.hasMore) DOM.spinner.classList.remove("active");
  }
}

function renderProducts(products) {
  const fragment = document.createDocumentFragment();

  products.forEach((p) => {
    const imagePath =
      p.images && p.images.length > 0
        ? p.images[0].startsWith("http")
          ? p.images[0]
          : `/uploads/productImages/${p.images[0]}`
        : "";

    const el = document.createElement("div");
    el.className = "product";
    el.draggable = true;

    el.dataset.id = p._id;
    el.dataset.title = p.title;
    el.dataset.img = imagePath;

    el.innerHTML = `
        <span class="badge">Stock: ${p.stock}</span>
        <img src="${imagePath}" loading="lazy" alt="${p.title}" />
        <div class="info">
            <h4>${p.title}</h4>
            <p>${p.description.substring(0, 60)}...</p>
            <div class="price">₹${p.price.toLocaleString()}</div>
        </div>
    `;

    el.addEventListener("dragstart", handleDragStart);
    fragment.appendChild(el);
  });

  DOM.productGrid.appendChild(fragment);
}

function handleDragStart(e) {
  state.draggedProduct = this.dataset;
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("text/plain", JSON.stringify(this.dataset));
}

function setupDragAndDrop() {
  DOM.dropBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    DOM.dropBox.style.borderColor = "var(--accent)";
  });

  DOM.dropBox.addEventListener("dragleave", () => {
    DOM.dropBox.style.borderColor = "var(--border)";
  });

  DOM.dropBox.addEventListener("drop", (e) => {
    e.preventDefault();
    DOM.dropBox.style.borderColor = "var(--border)";

    if (!state.draggedProduct) return;

    const existing = Array.from(DOM.dropBox.querySelectorAll(".dragged-item"));
    if (existing.find((item) => item.dataset.id === state.draggedProduct.id)) return;
    if (existing.length >= 5) return;

    addDroppedItem(state.draggedProduct);
    state.draggedProduct = null;
  });
}

function addDroppedItem(data) {
  const placeholder = DOM.dropBox.querySelector(".placeholder");
  if (placeholder) placeholder.remove();

  const item = document.createElement("div");
  item.className = "dragged-item";
  item.dataset.id = data.id;
  item.title = data.title;
  item.innerHTML = `<img src="${data.img}" alt="item" />`;

  item.addEventListener("click", () => {
    item.remove();
    if (DOM.dropBox.children.length === 0) {
      DOM.dropBox.innerHTML = '<span class="placeholder">Drag products here</span>';
    }
  });

  DOM.dropBox.appendChild(item);
}


async function sendMessage() {
  const text = DOM.chatInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  DOM.chatInput.value = "";

  let messageToArchive = null;
  if (state.chatHistory.length >= 5) {
    messageToArchive = state.chatHistory[0]; 
  }

  const loadingMsg = document.createElement("div");
  loadingMsg.className = "msg bot";
  loadingMsg.innerText = "Thinking...";
  DOM.chatMessages.appendChild(loadingMsg);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;

  const draggedItems = Array.from(DOM.dropBox.querySelectorAll(".dragged-item"));
  const productIds = draggedItems.map((el) => el.dataset.id);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: text,
        history: state.chatHistory,
        productIds,
        sessionId: state.sessionId,
        messageToArchive
      }),
    });

    const data = await res.json();

    if (messageToArchive) {
      state.chatHistory.shift(); 
    }
    
    state.chatHistory.push({ role: "user", content: text });
    state.chatHistory.push({ role: "assistant", content: data.reply });

    const formattedReply = data.reply
      .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
      .replace(/\n/g, "<br>");

    loadingMsg.innerHTML = formattedReply;

  } catch (err) {
    console.error(err);
    loadingMsg.innerText = "Connection error.";
  }
  
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = `msg ${sender}`;
  msg.innerHTML = text;
  DOM.chatMessages.appendChild(msg);
  DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function setupChat() {
  DOM.chatToggleBtn.addEventListener("click", () => {
    const isFlex = DOM.chatBox.style.display === "flex";
    DOM.chatBox.style.display = isFlex ? "none" : "flex";
  });

  DOM.closeChatBtn.addEventListener("click", () => {
    DOM.chatBox.style.display = "none";
  });

  DOM.sendBtn.addEventListener("click", sendMessage);

  DOM.chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

function toggleSidebar() {
  DOM.mainSidebar.classList.toggle("open");
  DOM.sidebarOverlay.classList.toggle("active");
}

function setupSidebar() {
  if (DOM.filterToggle) DOM.filterToggle.addEventListener("click", toggleSidebar);
  if (DOM.sidebarClose) DOM.sidebarClose.addEventListener("click", toggleSidebar);
  if (DOM.sidebarOverlay) DOM.sidebarOverlay.addEventListener("click", toggleSidebar);
}


function init() {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        fetchProducts();
      }
    },
    { rootMargin: "100px" }
  );
  
  if (DOM.sentinel) observer.observe(DOM.sentinel);

  setupDragAndDrop();
  setupChat();
  setupSidebar();
}

init();