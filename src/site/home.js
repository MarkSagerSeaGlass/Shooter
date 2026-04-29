import { setActiveNav } from "./nav.js";

setActiveNav("home");

for (const btn of document.querySelectorAll("[data-scroll-to]")) {
  btn.addEventListener("click", () => {
    const sel = btn.getAttribute("data-scroll-to");
    const target = sel ? document.querySelector(sel) : null;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

