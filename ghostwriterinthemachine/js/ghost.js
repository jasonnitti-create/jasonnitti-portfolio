/* GHOSTWRITER IN THE MACHINE — page behavior.
   Everything is progressive enhancement: with JS off the page
   is fully readable, the title just doesn't type itself. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reading progress ---------- */
  var fill = document.getElementById("progressFill");
  var ticking = false;
  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    fill.style.transform = "scaleX(" + p + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---------- chapter rail active state ---------- */
  var railLinks = {};
  document.querySelectorAll(".rail a[data-rail]").forEach(function (a) {
    railLinks[a.dataset.rail] = a;
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        Object.keys(railLinks).forEach(function (k) {
          railLinks[k].classList.toggle("active", k === entry.target.id);
        });
      }
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  document.querySelectorAll("article.chapter").forEach(function (ch) {
    observer.observe(ch);
  });

  /* ---------- hero title: types itself once ---------- */
  var target = document.getElementById("typeTarget");
  if (target && !reduceMotion) {
    var h1 = target.closest("h1");
    // Reserve the final height so nothing reflows while typing.
    h1.style.minHeight = h1.getBoundingClientRect().height + "px";

    // Sequence of things to append: characters, or a line break.
    var seq = [];
    target.childNodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split("").forEach(function (c) { seq.push(c); });
      } else if (node.nodeName === "BR") {
        seq.push("<br>");
      }
    });

    target.innerHTML = "";
    var i = 0;
    (function typeNext() {
      if (i >= seq.length) return;
      var item = seq[i++];
      if (item === "<br>") {
        target.appendChild(document.createElement("br"));
        setTimeout(typeNext, 240);
      } else {
        target.appendChild(document.createTextNode(item));
        setTimeout(typeNext, 34 + Math.random() * 26);
      }
    })();
  }

  /* ---------- year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- for the ones who look under the hood ---------- */
  if (window.console && console.log) {
    console.log("%c▌ GHOSTWRITER IN THE MACHINE", "color:#34f5b2;font-family:monospace;font-size:14px;");
    console.log("%cWritten by a human. Haunted accordingly. — jasonnitti.com", "color:#71807a;font-family:monospace;");
  }
})();
