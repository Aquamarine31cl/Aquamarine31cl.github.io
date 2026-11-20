/* Quick photo transitions keep the image layout fixed and never delay loading. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.getElementById('site-nav');
  if (nav) {
    let navFrame = 0;
    const measureNav = () => {
      if (navFrame) return;
      navFrame = requestAnimationFrame(() => { navFrame = 0; dispatchEvent(new Event('resize')); });
    };
    new MutationObserver(measureNav).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.fonts) document.fonts.ready.then(measureNav);
    measureNav();
  }
  const animations = new Set();
  const byPhoto = new WeakMap();
  const hudText = new WeakMap();
  const huds = [...document.querySelectorAll('.mission-status,.helios-hud,[data-flight-hud],[data-kepler-hud]')];
  let scheduled = 0;
  const formatHud = () => {
    scheduled = 0;
    for (const hud of huds) {
      const text = hud.textContent;
      if (hudText.get(hud) === text) continue;
      hudText.set(hud, text);
      const parts = text.split(' · ');
      if (parts.length < 2) continue;
      const content = document.createDocumentFragment();
      parts.forEach((part, index) => {
        if (index) content.append(document.createTextNode(' · '));
        const unit = document.createElement('span');
        if (part.length <= 32) unit.className = 'hud-unit106';
        unit.textContent = part; content.append(unit);
      });
      if (hud.replaceChildren) hud.replaceChildren(content);
      else { while (hud.firstChild) hud.removeChild(hud.firstChild); hud.append(content); }
    }
  };
  if (huds.length) {
    const observer = new MutationObserver(() => { if (!scheduled) scheduled = requestAnimationFrame(formatHud); });
    huds.forEach(hud => observer.observe(hud, { childList: true, characterData: true, subtree: true }));
    formatHud();
  }
  const stop = () => { for (const animation of animations) animation.cancel(); animations.clear(); };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-photo-select]');
    if (!button || reduce.matches) return;
    const gallery = button.closest('[data-photo-gallery]');
    const photo = gallery?.querySelector('[data-photo-panel]:not([hidden]) img');
    if (!photo || !photo.complete || !photo.naturalWidth || !photo.animate) return;
    byPhoto.get(photo)?.cancel();
    const animation = photo.animate([{ opacity: .84 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
    byPhoto.set(photo, animation); animations.add(animation);
    const done = () => animations.delete(animation);
    animation.onfinish = done; animation.oncancel = done;
  });
  if (reduce.addEventListener) reduce.addEventListener('change', stop);
  else if (reduce.addListener) reduce.addListener(stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  addEventListener('pagehide', stop);
})();
