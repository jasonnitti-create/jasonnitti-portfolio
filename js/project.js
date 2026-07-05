/* Project page: renders one case study with a keyframe story carousel.
   Each keyframe (image or video) carries its own title + caption. */
(function () {
  const app = document.getElementById("app");
  document.getElementById("yr").textContent = new Date().getFullYear();
  document.getElementById("themeToggle").addEventListener("click", () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
  });

  const slug = new URLSearchParams(location.search).get("p");
  let DATA, P, i = 0;

  // cache-buster: always load the latest content after edits
  fetch("data/projects.json?v=" + Date.now())
    .then((r) => r.json())
    .then((d) => {
      DATA = d;
      P = d.projects.find((x) => x.slug === slug) || d.projects[0];
      document.title = P.title + " — Jason Nitti";
      build();
    })
    .catch(() => (app.innerHTML = '<div class="empty">Could not load project data.</div>'));

  function catLabel(key) {
    const c = DATA.categories.find((x) => x.key === key);
    return c ? c.label : key;
  }

  function build() {
    const n = DATA.projects.indexOf(P);
    const prev = DATA.projects[(n - 1 + DATA.projects.length) % DATA.projects.length];
    const next = DATA.projects[(n + 1) % DATA.projects.length];

    app.innerHTML = `
      <div class="crumbs">
        <a href="index.html">← Back to index</a>
        <span>NO_${String(n + 1).padStart(2, "0")} / ${DATA.projects.length}</span>
      </div>

      <div class="proj-head">
        <h1>${esc(P.title)}</h1>
        <div class="tags">${P.categories.map((c) => `<span class="tag accent">${esc(catLabel(c))}</span>`).join("")}</div>
        <div class="summary">${esc(P.summary).split(/\n\s*\n/).map((par) =>
          `<p>${par}</p>`).join("")}</div>
        ${(P.links || []).length ? `<div class="proj-links">${P.links.map((l) =>
          `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>` : ""}
      </div>

      ${P.details.length ? `<div class="details">${P.details.map((d) =>
        `<div class="d"><div class="label">${esc(d.label)}</div><div class="text">${esc(d.text)}</div></div>`).join("")}</div>` : ""}

      ${P.items.length ? `
      <section class="story">
        <div class="head">
          <span class="t">${P.items.length > 1 ? "Story // use arrows or keys to step through" : "Feature"}</span>
          ${P.items.length > 1 ? `<span class="counter"><b id="cNow">01</b> / ${pad(P.items.length)}</span>` : ""}
        </div>
        <div class="story-grid">
          <div class="stage">
            ${P.items.length > 1 ? `
            <button class="navbtn prev" id="btnPrev" aria-label="Previous">‹</button>` : ""}
            <div class="media" id="media"></div>
            ${P.items.length > 1 ? `
            <button class="navbtn next" id="btnNext" aria-label="Next">›</button>` : ""}
          </div>
          <div class="caption">
            <p class="ct" id="capTitle"></p>
            <p class="cd" id="capText"></p>
          </div>
        </div>
        ${P.items.length > 1 ? `<div class="thumbs" id="thumbs"></div>` : ""}
      </section>` : ""}

      <div class="proj-footer">
        <a href="project.html?p=${prev.slug}">← ${esc(prev.title)}</a>
        <a href="project.html?p=${next.slug}" style="text-align:right">${esc(next.title)} →</a>
      </div>`;

    if (!P.items.length) return;
    if (P.items.length === 1) { show(0); return; }

    const thumbs = document.getElementById("thumbs");
    P.items.forEach((it, k) => {
      const b = document.createElement("button");
      if (it.type !== "image") b.classList.add("vbadge");
      b.innerHTML = `<img loading="lazy" src="${it.type === "image" ? it.src : (it.poster || "")}" alt="">`;
      b.addEventListener("click", () => show(k));
      thumbs.appendChild(b);
    });
    document.getElementById("btnPrev").addEventListener("click", () => show(i - 1));
    document.getElementById("btnNext").addEventListener("click", () => show(i + 1));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
    show(0);
  }

  function show(k) {
    i = (k + P.items.length) % P.items.length;
    const it = P.items[i];
    const media = document.getElementById("media");
    media.innerHTML =
      it.type === "video"
        ? `<video src="${it.src}" ${it.poster ? `poster="${it.poster}"` : ""} controls preload="none" playsinline></video>`
        : it.type === "embed"
        ? `<iframe src="${it.src}" title="${esc(it.title || P.title)}" style="width:100%;height:100%;border:0"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowfullscreen></iframe>`
        : `<img src="${it.src}" alt="${esc(it.title || P.title)}">`;
    // keyframes with no copy get the full stage width — no empty panel
    const hasCopy = !!((it.title || "").trim() || (it.caption || "").trim());
    document.querySelector(".story-grid").classList.toggle("nocap", !hasCopy);
    document.getElementById("capTitle").textContent = it.title || "";
    document.getElementById("capText").textContent = it.caption || "";
    const cNow = document.getElementById("cNow");
    if (cNow) cNow.textContent = pad(i + 1);
    // last keyframe: the next-arrow becomes a restart cue (↺ back to start)
    const nextBtn = document.getElementById("btnNext");
    if (nextBtn) {
      const last = i === P.items.length - 1;
      nextBtn.classList.toggle("restart", last);
      nextBtn.textContent = last ? "↺" : "›";
      nextBtn.title = last ? "Back to start" : "Next";
    }
    document.querySelectorAll("#thumbs button").forEach((b, k2) =>
      b.classList.toggle("active", k2 === i));
  }

  function pad(x) { return String(x).padStart(2, "0"); }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
})();
