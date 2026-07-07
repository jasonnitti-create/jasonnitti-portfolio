// ============================================================
// DECODE — easter-egg "see the code underneath" mode.
// Flips the whole page into a monospace signal-readout and renders
// every image/video as live ASCII (canvas brightness -> character ramp).
// No dependencies, no external API. All assets are same-origin so the
// canvas never taints. The book's whole premise, as an interaction:
// strip the human layer, show the machine reading it.
// ============================================================
(function () {
  const toggle = document.querySelector('.decode-toggle');
  if (!toggle) return;

  // light -> dense. A space is "no signal", @ is "full signal".
  const RAMP = ' .:-=+*oO#%@';

  // Every visual we want to transcode. Videos are handled via their poster
  // (reliable) unless a live frame is available.
  const MEDIA_SELECTOR = [
    '.hero-media img',
    '.plate img',
    '.g-wide img',
    '.g-pair img',
    '.author-photo img',
    '.video-frame video',
    '.glitch-vid'
  ].join(',');

  let decoded = false;
  let resizeTimer = null;

  function luminanceToAscii(source, w, h, cols) {
    if (!w || !h) return '';
    const rows = Math.max(1, Math.round(cols * (h / w) * 0.55)); // ~char aspect (w/h of a mono cell)
    const c = document.createElement('canvas');
    c.width = cols; c.height = rows;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    try { ctx.drawImage(source, 0, 0, cols, rows); } catch (e) { return ''; }
    let data;
    try { data = ctx.getImageData(0, 0, cols, rows).data; } catch (e) { return ''; }
    let out = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        let lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        lum = Math.pow(lum, 0.6); // lift shadows so dark frames still render with texture
        out += RAMP[Math.min(RAMP.length - 1, Math.floor(lum * RAMP.length))];
      }
      out += '\n';
    }
    return out;
  }

  function preFor(el) {
    let pre = el.nextElementSibling;
    if (!(pre && pre.classList && pre.classList.contains('ascii-art'))) {
      pre = document.createElement('pre');
      pre.className = 'ascii-art';
      pre.setAttribute('aria-hidden', 'true');
      el.after(pre);
    }
    return pre;
  }

  function render(el) {
    // Videos always seed from their POSTER (content-rich), never the live t=0
    // frame — which is often black. Live frames take over via videoTick once
    // the clip is actually playing. This is what kills the "black box".
    if (el.tagName === 'VIDEO') { renderVideoPoster(el); return; }

    const w = el.naturalWidth, h = el.naturalHeight;
    if (!w || !h) { // lazy image below the fold — render once it loads
      el.addEventListener('load', () => { if (decoded) render(el); }, { once: true });
      return;
    }
    const box = el.getBoundingClientRect();
    const boxW = box.width || w, boxH = box.height || h;
    if (!boxW) return;
    paint(el, el, w, h, boxW, boxH);
  }

  function renderVideoPoster(v) {
    if (!v.poster) return;
    const img = new Image();
    img.onload = () => {
      if (!decoded) return;
      const box = v.getBoundingClientRect();
      if (!box.width) return;
      paint(v, img, img.naturalWidth, img.naturalHeight, box.width, box.height);
    };
    img.src = v.poster;
  }

  function paint(el, source, w, h, boxW, boxH) {
    const cols = Math.max(48, Math.min(200, Math.round(boxW / 6)));
    const art = luminanceToAscii(source, w, h, cols);
    if (!art) return;
    const pre = preFor(el);
    pre.textContent = art;
    // Overlay the pre exactly on the media element's box within its (relative) parent.
    // Width is filled by font-size; height is filled by forcing line-height to
    // boxH / rows, so the ASCII always covers the box with no black gap.
    const nRows = (art.match(/\n/g) || []).length || 1;
    pre.style.fontSize = (boxW / (cols * 0.6)) + 'px';
    pre.style.lineHeight = (boxH / nRows) + 'px';
    pre.style.top = el.offsetTop + 'px';
    pre.style.left = el.offsetLeft + 'px';
    pre.style.width = boxW + 'px';
    pre.style.height = boxH + 'px';
    if (el.tagName === 'VIDEO') {
      pre.classList.add('ascii-video');
      pre.classList.toggle('paused', el.paused);
      bindVideoToggle(el, pre);
    }
  }

  function renderAll() {
    document.querySelectorAll(MEDIA_SELECTOR).forEach(render);
  }

  // ---- text scramble: every readable word becomes illegible "code" ----
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_/\\[]{}=+*#%&$?:;'.split('');
  const rndGlyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cells = [];            // { node, orig, chars[], mutable[] }
  let trickleTimer = null;

  function collectText() {
    cells = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        // Leave the ASCII art, the toggle (so RESTORE stays findable), and code out.
        if (!p || p.closest('.ascii-art, .decode-toggle, script, style, noscript')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      const chars = n.nodeValue.split('');
      const mutable = [];
      for (let i = 0; i < chars.length; i++) if (/\S/.test(chars[i])) mutable.push(i);
      if (mutable.length) cells.push({ node: n, orig: n.nodeValue, chars, mutable });
    }
  }

  function scrambleAll() {
    for (const c of cells) {
      for (const i of c.mutable) c.chars[i] = rndGlyph();
      c.node.nodeValue = c.chars.join('');
    }
  }

  function restoreText() {
    for (const c of cells) c.node.nodeValue = c.orig;
    cells = [];
  }

  // Trickle: each tick, re-randomize a small slice of characters so the code
  // shimmers/streams without ever resolving into words.
  function trickleStep() {
    const total = cells.length;
    if (!total) return;
    const dirty = new Set();
    const flips = Math.min(80, Math.max(12, (total * 0.4) | 0));
    for (let k = 0; k < flips; k++) {
      const c = cells[(Math.random() * total) | 0];
      const idx = c.mutable[(Math.random() * c.mutable.length) | 0];
      c.chars[idx] = rndGlyph();
      dirty.add(c);
    }
    dirty.forEach((c) => { c.node.nodeValue = c.chars.join(''); });
  }

  function startTrickle() {
    stopTrickle();
    // DECODE is an explicit opt-in (a tap/click), so we honor the intent to
    // SEE the effect even under prefers-reduced-motion — just at a calmer
    // cadence there. (Previously reduced-motion killed the shimmer entirely,
    // which on iOS — where many people leave Reduce Motion on — made the text
    // scramble once and then sit dead still.)
    trickleTimer = setInterval(trickleStep, reduceMotion() ? 160 : 75);
  }
  function stopTrickle() {
    if (trickleTimer) { clearInterval(trickleTimer); trickleTimer = null; }
  }

  // ---- live video -> ASCII: transcode each playing frame in real time ----
  const boundVideos = new WeakSet();
  function bindVideoToggle(video, pre) {
    if (boundVideos.has(pre)) return;
    boundVideos.add(pre);
    pre.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {}); else video.pause();
    });
    video.addEventListener('play', () => pre.classList.remove('paused'));
    video.addEventListener('pause', () => pre.classList.add('paused'));
  }

  let videoRAF = null, lastVideoTs = 0;
  function videoTick(ts) {
    if (!decoded) { videoRAF = null; return; }
    videoRAF = requestAnimationFrame(videoTick);
    if (ts - lastVideoTs < 42) return; // ~24fps
    lastVideoTs = ts;
    document.querySelectorAll('.video-frame video, .glitch-vid').forEach((v) => {
      if (v.readyState < 2 || v.paused || v.ended) return;
      const box = v.getBoundingClientRect();
      if (!box.width || box.bottom < 0 || box.top > window.innerHeight) return; // offscreen
      paint(v, v, v.videoWidth, v.videoHeight, box.width, box.height);
    });
  }
  function startVideoLoop() { if (!videoRAF) videoRAF = requestAnimationFrame(videoTick); }
  function stopVideoLoop() { if (videoRAF) { cancelAnimationFrame(videoRAF); videoRAF = null; } }

  // The "cheat": on decode, play everything muted so the ASCII animates on its
  // own — no black first frame, no play button to hunt for. (This runs inside
  // the toggle's click/keypress, so muted play() is allowed without a warning.)
  function playVideosMuted() {
    document.querySelectorAll('.video-frame video, .glitch-vid').forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      if (v.preload !== 'auto') v.preload = 'auto'; // ensure it buffers enough to play
      const isTrailer = !!v.closest('.video-frame');
      const kick = () => {
        // trailer fades in from black — jump past the intro so there's content
        if (isTrailer && v.duration && v.currentTime < 1) {
          try { v.currentTime = Math.min(9, v.duration * 0.15); } catch (e) {}
        }
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      };
      kick();
      // retry as the clip becomes playable (autoplay is otherwise temperamental)
      ['loadedmetadata', 'loadeddata', 'canplay'].forEach((ev) =>
        v.addEventListener(ev, kick, { once: true }));
    });
  }
  function resetTrailer() {
    const t = document.querySelector('.video-frame video');
    if (t) { t.pause(); t.muted = false; t.currentTime = 0; } // hand it back at the start, with sound
  }

  // ---- ambient loop: the sound of the machine underneath the page ----
  const ambient = document.getElementById('decodeAmbient');
  const AMBIENT_VOLUME = 0.55;
  let ambientFade = null;

  function fadeAmbient(to, ms, thenPause) {
    if (ambientFade) clearInterval(ambientFade);
    const steps = 20;
    const start = ambient.volume;
    const stepMs = ms / steps;
    let i = 0;
    ambientFade = setInterval(() => {
      i++;
      ambient.volume = Math.max(0, Math.min(1, start + (to - start) * (i / steps)));
      if (i >= steps) {
        clearInterval(ambientFade);
        ambientFade = null;
        if (thenPause) ambient.pause();
      }
    }, stepMs);
  }

  function startAmbient() {
    if (!ambient) return;
    ambient.volume = 0;
    const p = ambient.play(); // called from the toggle's click/keydown handler — a real user gesture
    if (p && p.catch) p.catch(() => {});
    fadeAmbient(AMBIENT_VOLUME, 500, false);
  }
  function stopAmbient() {
    if (!ambient) return;
    fadeAmbient(0, 350, true);
  }

  function setDecoded(on) {
    decoded = on;
    document.body.classList.toggle('decoded', on);
    toggle.setAttribute('aria-pressed', String(on));
    // RESTORE drops the brackets (CSS hides .bracket) — once inside, it's a
    // solid chip, not "code", so it must read instantly as the way out.
    toggle.innerHTML = on
      ? '<span class="bracket">[</span> RESTORE <span class="bracket">]</span>'
      : '<span class="bracket">[</span> DECODE <span class="bracket">]</span>';
    if (on) {
      renderAll();
      requestAnimationFrame(renderAll);
      collectText();
      scrambleAll();
      startTrickle();
      startVideoLoop();
      playVideosMuted();
      startAmbient();
    } else {
      stopTrickle();
      stopVideoLoop();
      resetTrailer();
      clearWarp();
      restoreText();
      stopAmbient();
    }
  }

  // ---- warp lens: a displacement that follows the pointer (mouse OR finger) ----
  // A masked, filtered clone of whatever ASCII block is under the pointer. Uses
  // `filter: url()` + `mask` (both supported on iOS Safari), so on mobile you
  // drag a finger to warp; on desktop you just hover.
  let warpClone = null, warpBase = null, warpX = 0, warpY = 0, warpQueued = false;

  function injectWarpFilter() {
    if (document.getElementById('decode-warp')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.innerHTML =
      '<defs><filter id="decode-warp" x="-60%" y="-60%" width="220%" height="220%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.022" numOctaves="2" seed="7" result="n">' +
      '<animate attributeName="baseFrequency" dur="7s" values="0.012 0.022;0.022 0.032;0.012 0.022" repeatCount="indefinite"/>' +
      '</feTurbulence>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="44" xChannelSelector="R" yChannelSelector="G">' +
      '<animate attributeName="scale" dur="4s" values="34;52;34" repeatCount="indefinite"/>' +
      '</feDisplacementMap>' +
      '</filter></defs>';
    document.body.appendChild(svg);
  }

  function asciiPreAt(x, y) {
    const pres = document.querySelectorAll('.ascii-art');
    for (const p of pres) {
      const r = p.getBoundingClientRect();
      if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return p;
    }
    return null;
  }
  function clearWarp() {
    if (warpClone) warpClone.remove();
    warpClone = null; warpBase = null;
  }
  function updateWarp() {
    warpQueued = false;
    if (!decoded) return clearWarp();
    const base = asciiPreAt(warpX, warpY);
    if (!base) return clearWarp();
    if (base !== warpBase) {
      clearWarp();
      warpBase = base;
      warpClone = document.createElement('pre');
      warpClone.className = 'warp-clone';
      warpClone.setAttribute('aria-hidden', 'true');
      warpClone.style.cssText = base.style.cssText; // inherit top/left/size/font
      base.parentElement.appendChild(warpClone);
    }
    warpClone.textContent = base.textContent; // keep in sync with live/trickling ASCII
    const r = base.getBoundingClientRect();
    warpClone.style.setProperty('--mx', (warpX - r.left) + 'px');
    warpClone.style.setProperty('--my', (warpY - r.top) + 'px');
  }
  function onPointerMove(e) {
    if (!decoded) return;
    warpX = e.clientX; warpY = e.clientY;
    if (!warpQueued) { warpQueued = true; requestAnimationFrame(updateWarp); }
  }
  injectWarpFilter();
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') clearWarp(); });

  toggle.addEventListener('click', () => setDecoded(!decoded));

  window.addEventListener('resize', () => {
    if (!decoded) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 150);
  }, { passive: true });

  // Secret keyboard shortcut too: press "~"
  document.addEventListener('keydown', (e) => {
    if (e.key === '~' && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(document.activeElement.tagName)) {
      setDecoded(!decoded);
    }
  });
})();
