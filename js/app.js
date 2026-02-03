const MENU_URL = "data/menu.json";

const menuRoot = document.querySelector("#menuRoot");
const searchInput = document.querySelector("#searchInput");

// Theme
const themeToggle = document.querySelector("#themeToggle");
const themeIcon = themeToggle.querySelector(".icon");
const THEME_KEY = "menu_theme";

// Modals
const itemModal = document.querySelector("#itemModal");
const adModal = document.querySelector("#adModal");

const modalImg = document.querySelector("#modalImg");
const modalTitle = document.querySelector("#modalTitle");
const modalDesc = document.querySelector("#modalDesc");
const modalPrice = document.querySelector("#modalPrice");

const adContinue = document.querySelector("#adContinue");
const AD_KEY = "menu_ad_seen_v1";

let menuData = null;

function formatPrice(value, currency = "MXN") {
  if (value === null || value === undefined) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(n);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  themeIcon.textContent = theme === "light" ? "◐" : "◐";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    setTheme(saved);
    return;
  }
  // Si no hay preferencia guardada, usa la del sistema
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(prefersLight ? "light" : "dark");
}

function openModal(modalEl) {
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modalEl) {
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function wireModalClose(modalEl) {
  modalEl.addEventListener("click", (e) => {
    const close = e.target?.dataset?.close === "true";
    if (close) closeModal(modalEl);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.getAttribute("aria-hidden") === "false") {
      closeModal(modalEl);
    }
  });
}

function renderMenu(data, filterText = "") {
  const currency = data.currency || "MXN";
  const q = filterText.trim().toLowerCase();

  menuRoot.innerHTML = "";

  data.sections.forEach((section) => {
    // Filtrar items por búsqueda
    const items = section.items.filter((it) => {
      if (!q) return true;
      const hay = `${it.name} ${it.desc || ""} ${section.title}`.toLowerCase();
      return hay.includes(q);
    });

    if (items.length === 0) return;

    const sectionEl = document.createElement("article");
    sectionEl.className = "section";

    const head = document.createElement("div");
    head.className = "section__head";

    const title = document.createElement("h2");
    title.className = "section__title";
    title.textContent = section.title;

    const hint = document.createElement("div");
    hint.className = "section__hint";
    hint.textContent = section.hint || "";

    head.appendChild(title);
    head.appendChild(hint);

    const itemsWrap = document.createElement("div");
    itemsWrap.className = "items";

    items.forEach((it) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "item";

      const left = document.createElement("div");
      left.className = "item__left";

      const name = document.createElement("p");
      name.className = "item__name";
      name.textContent = it.name;

      const desc = document.createElement("p");
      desc.className = "item__desc";
      desc.textContent = it.desc || "";

      left.appendChild(name);
      if (it.desc) left.appendChild(desc);

      const price = document.createElement("div");
      price.className = "item__price";
      price.textContent = formatPrice(it.price, currency);

      btn.appendChild(left);
      btn.appendChild(price);

      btn.addEventListener("click", () => {
        // Foto: si no existe, cae al placeholder
        modalImg.src = it.img || "assets/img/placeholder.jpg";
        modalImg.onerror = () => { modalImg.src = "assets/img/placeholder.jpg"; };

        modalTitle.textContent = it.name;
        modalDesc.textContent = it.desc || "";
        modalPrice.textContent = formatPrice(it.price, currency);

        openModal(itemModal);
      });

      itemsWrap.appendChild(btn);
    });

    sectionEl.appendChild(head);
    sectionEl.appendChild(itemsWrap);
    menuRoot.appendChild(sectionEl);
  });
}

async function loadMenu() {
  const res = await fetch(MENU_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar el menú.");
  return await res.json();
}

function showAdEveryVisit() {
  openModal(adModal);

  const closeAd = () => closeModal(adModal);

  // Botón continuar
  adContinue.addEventListener("click", closeAd, { once: true });

  // Cerrar por backdrop / X
  adModal.addEventListener("click", (e) => {
    if (e.target?.dataset?.close === "true") closeAd();
  }, { once: true });
}

(async function init() {
  initTheme();

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });

  wireModalClose(itemModal);
  wireModalClose(adModal);

  try {
    menuData = await loadMenu();
    renderMenu(menuData, "");
    showAdEveryVisit();
  } catch (err) {
    menuRoot.innerHTML = `<div class="section"><div class="section__head">
      <h2 class="section__title">Error</h2><div class="section__hint"></div></div>
      <div style="padding:14px;color:var(--muted)">No se pudo cargar el menú. Revisa que exista <code>data/menu.json</code>.</div></div>`;
    console.error(err);
  }

  searchInput.addEventListener("input", (e) => {
    if (!menuData) return;
    renderMenu(menuData, e.target.value);
  });
})();