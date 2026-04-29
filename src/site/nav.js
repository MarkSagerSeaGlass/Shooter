export function setActiveNav(active) {
  for (const el of document.querySelectorAll("[data-nav]")) {
    const isActive = el.getAttribute("data-nav") === active;
    el.classList.toggle("active", isActive);
    if (isActive) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  }
}

