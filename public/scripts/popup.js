export function showPopup(message, isError = false) {
    const container = document.getElementById("popup-container");

    if (!container) {
        console.error("Popup container not found: #popup-container");
        return;
    }
    const div = document.createElement("div");
    div.className = isError ? "popup-error" : "popup";
    div.textContent = message;
    container.appendChild(div);
    requestAnimationFrame(() => {
        div.style.opacity = "1";
    });
    setTimeout(() => {
        div.style.opacity = "0";
        div.style.transition = "opacity 0.5s";
        setTimeout(() => div.remove(), 500);
    }, 4000);
}
