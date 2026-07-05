// WE ARE LIVING IN A STIMULATION — book microsite
// No frameworks. Two small behaviors: scroll-reveal, sticky mobile buy bar.

document.getElementById('year').textContent = new Date().getFullYear();

// Reveal-on-scroll
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in-view'));
}

// Glitch motion panel autoplays natively (autoplay muted loop playsinline in the HTML).
// If a browser blocks muted autoplay, nudge it once — keeps it automatic, no play button.
const glitchVid = document.querySelector('.glitch-vid');
if (glitchVid) {
  const kick = () => glitchVid.play().catch(() => {});
  kick();
  glitchVid.addEventListener('canplay', kick, { once: true });
}

// Sticky mobile buy bar — show once the hero has scrolled past, hide once
// the final CTA section comes into view (buttons are already on screen there).
const stickyCta = document.getElementById('stickyCta');
const heroEl = document.querySelector('.hero');
const finalCtaEl = document.getElementById('buy');

if (stickyCta && heroEl && finalCtaEl) {
  let ticking = false;
  const updateSticky = () => {
    const heroPast = heroEl.getBoundingClientRect().bottom < 0;
    const finalCtaShowing = finalCtaEl.getBoundingClientRect().top < window.innerHeight;
    stickyCta.classList.toggle('is-visible', heroPast && !finalCtaShowing);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateSticky);
      ticking = true;
    }
  }, { passive: true });
  updateSticky();
}
