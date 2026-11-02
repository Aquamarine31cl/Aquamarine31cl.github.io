/* Homepage interactions: no libraries, static content remains available without JS. */
(() => {
  const root = document.querySelector('.home-honors');
  if (!root) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = [...root.querySelectorAll('[data-honor-count]')];
  const complete = () => counters.forEach(el => { el.textContent = el.dataset.honorCount; });
  const count = el => {
    const target = Number(el.dataset.honorCount);
    if (!Number.isFinite(target) || target < 0) return;
    if (reducedMotion) { el.textContent = String(target); return; }
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / 1250, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0'; requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (entry.target.matches('[data-honor-count]')) count(entry.target);
        else entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18 });
    [...counters, ...root.querySelectorAll('.honors-reveal')].forEach(el => observer.observe(el));
  } else complete();
  const controls = root.querySelector('.honors-filters');
  const groups = [...root.querySelectorAll('[data-honor-group]')];
  const buttons = [...root.querySelectorAll('[data-honor-filter]')];
  const status = root.querySelector('[data-honors-status]');
  const filter = selected => {
    let visibleCount = 0;
    groups.forEach(group => {
      group.hidden = selected !== 'all' && group.dataset.honorGroup !== selected;
      if (!group.hidden) visibleCount += group.querySelectorAll('.honor-record').length;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.honorFilter === selected)));
    if (status) status.textContent = visibleCount + ' awards shown.';
  };
  if (controls) {
    controls.hidden = false;
    buttons.forEach(button => button.addEventListener('click', () => filter(button.dataset.honorFilter)));
    root.querySelectorAll('.honor-stat').forEach(link => link.addEventListener('click', () => filter(link.hash.replace('#honors-', ''))));
  }
})();
