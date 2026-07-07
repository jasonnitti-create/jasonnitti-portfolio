/* iOS Safari: nudge the muted masthead into autoplay. The HTML attributes
   (autoplay/muted/playsinline) are correct, but iOS is unreliable about
   honoring them — it wants muted set as a *property* and often a scripted
   play() call. Harmless everywhere autoplay already works. (Low Power Mode
   still blocks it — nothing in code can override that.) */
(function () {
  const v = document.querySelector(".masthead video");
  if (!v) return;
  v.muted = true;
  const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  play();
  const kick = () => { play(); };
  document.addEventListener("touchstart", kick, { once: true, passive: true });
  document.addEventListener("click", kick, { once: true });
})();

/* Index page: load projects.json, render filterable grid. */
(function () {
  const grid = document.getElementById("grid");
  const filters = document.getElementById("filters");
  const searchBox = document.getElementById("search");
  const countLine = document.getElementById("countLine");
  document.getElementById("yr").textContent = new Date().getFullYear();

  // theme toggle (shared behavior with all pages)
  document.getElementById("themeToggle").addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
  });

  let DATA = null;
  let activeCat = "all";
  let query = "";

  // cache-buster: always load the latest content after edits
  fetch("data/projects.json?v=" + Date.now())
    .then((r) => r.json())
    .then((d) => {
      DATA = d;
      buildFilters();
      render();
    })
    .catch(() => {
      grid.innerHTML = '<div class="empty">Could not load data/projects.json</div>';
    });

  function countFor(key) {
    if (key === "all") return DATA.projects.length;
    return DATA.projects.filter((p) => p.categories.includes(key)).length;
  }

  function buildFilters() {
    const search = filters.querySelector(".searchbox");
    DATA.categories.forEach((c) => {
      const b = document.createElement("button");
      b.className = "fbtn" + (c.key === activeCat ? " active" : "");
      b.dataset.key = c.key;
      b.innerHTML = `${c.label}<span class="n">${countFor(c.key)}</span>`;
      b.addEventListener("click", () => {
        activeCat = c.key;
        filters.querySelectorAll(".fbtn").forEach((x) =>
          x.classList.toggle("active", x.dataset.key === activeCat));
        render();
      });
      filters.insertBefore(b, search);
    });
    searchBox.addEventListener("input", () => {
      query = searchBox.value.trim().toLowerCase();
      render();
    });
  }

  function matches(p) {
    if (activeCat !== "all" && !p.categories.includes(activeCat)) return false;
    if (!query) return true;
    const hay = [
      p.title, p.summary,
      ...p.categories,
      ...p.details.map((d) => d.label + " " + d.text),
    ].join(" ").toLowerCase();
    return query.split(/\s+/).every((w) => hay.includes(w));
  }

  function catLabel(key) {
    const c = DATA.categories.find((x) => x.key === key);
    return c ? c.label : key;
  }

  function detail(p, label) {
    const d = p.details.find((x) => x.label.toLowerCase() === label);
    return d ? d.text : "";
  }

  function render() {
    const shown = DATA.projects.filter(matches);
    countLine.textContent =
      `${shown.length} / ${DATA.projects.length} projects` +
      (activeCat !== "all" ? ` · ${catLabel(activeCat)}` : "") +
      (query ? ` · “${query}”` : "");
    grid.innerHTML = "";
    if (!shown.length) {
      grid.innerHTML = '<div class="empty">No projects match. Clear the filter or search.</div>';
      return;
    }
    shown.forEach((p) => {
      const idx = DATA.projects.indexOf(p) + 1;
      const a = document.createElement("a");
      a.className = "card";
      a.href = "project.html?p=" + encodeURIComponent(p.slug);
      a.innerHTML = `
        <div class="thumb">${p.cover ? `<img loading="lazy" src="${p.cover}" alt="${esc(p.title)}">` : ""}</div>
        <div class="body">
          <div class="id">NO_${String(idx).padStart(2, "0")}</div>
          <h3>${esc(p.title)}</h3>
          ${p.subtitle ? `<div class="meta">${esc(p.subtitle)}</div>` : ""}
          <div class="tags">${p.categories.map((c) =>
            `<span class="tag${c === activeCat ? " accent" : ""}">${esc(catLabel(c))}</span>`).join("")}</div>
        </div>`;
      grid.appendChild(a);
    });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
})();
