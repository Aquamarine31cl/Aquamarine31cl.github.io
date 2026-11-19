(() => {
  'use strict';

  function alignGallery(journal) {
    const grid = journal.querySelector('.travel-city-grid');
    if (!grid || journal.dataset.alignmentReady === '99') return;
    journal.dataset.alignmentReady = '99';
    let pending = null;
    let measuredWidth = -1;

    function schedule() {
      if (pending === null) pending = requestAnimationFrame(measure);
    }

    function measure() {
      pending = null;
      if (!journal.isConnected) return;
      const cards = [...grid.children].filter(card => card.matches('.city-journey'));
      const visibleCard = cards.find(card => card.getBoundingClientRect().width > 0);
      if (!visibleCard) return;
      const cardWidth = visibleCard.getBoundingClientRect().width;
      if (!Number.isFinite(cardWidth) || cardWidth < 1) return;

      const host = document.createElement('div');
      host.className = 'travel-journal--manga travel-layout-measure';
      host.setAttribute('aria-hidden', 'true');
      host.setAttribute('inert', '');
      host.style.width = cardWidth + 'px';
      const copies = document.createElement('div');
      copies.className = 'travel-city-grid';
      for (const card of cards) {
        const copy = document.createElement('article');
        copy.className = card.className;
        const heading = card.querySelector('.city-heading-copy');
        if (heading) copy.append(heading.cloneNode(true));
        const gallery = document.createElement('div');
        gallery.className = 'city-photo-gallery';
        const stage = document.createElement('div');
        stage.className = 'city-photo-stage';
        for (const caption of card.querySelectorAll('figcaption')) {
          const figure = document.createElement('figure');
          figure.className = 'city-photo-card';
          figure.append(caption.cloneNode(true));
          stage.append(figure);
        }
        gallery.append(stage);
        copy.append(gallery);
        copies.append(copy);
      }
      host.append(copies);
      for (const node of host.querySelectorAll('[id]')) node.removeAttribute('id');
      // Keep the copies in the same typography/theme context as the real cards.
      journal.append(host);
      let headingHeight = 0;
      let captionHeight = 0;
      try {
        for (const heading of host.querySelectorAll('.city-heading-copy')) {
          headingHeight = Math.max(headingHeight, heading.getBoundingClientRect().height);
        }
        for (const caption of host.querySelectorAll('figcaption')) {
          captionHeight = Math.max(captionHeight, caption.getBoundingClientRect().height);
        }
      } finally {
        host.remove();
      }
      if (headingHeight > 0 && captionHeight > 0) {
        journal.style.setProperty('--travel-heading-height', Math.ceil(headingHeight) + 'px');
        journal.style.setProperty('--travel-caption-height', Math.ceil(captionHeight) + 'px');
        journal.dataset.alignmentMeasured = 'true';
        journal.dataset.alignmentWidth = grid.getBoundingClientRect().width.toFixed(2);
      }
    }

    if (typeof ResizeObserver === 'function') {
      const widthObserver = new ResizeObserver(entries => {
        const width = entries[0].contentRect.width;
        if (Math.abs(width - measuredWidth) > .25) {
          measuredWidth = width;
          schedule();
        }
      });
      widthObserver.observe(grid);
      // Text can reflow after webfonts, accessibility scaling or a theme change.
      const textObserver = new ResizeObserver(schedule);
      for (const text of grid.querySelectorAll('h4,.city-photo-caption-text')) textObserver.observe(text);
    }
    if (typeof MutationObserver === 'function') {
      const contentObserver = new MutationObserver(schedule);
      contentObserver.observe(grid, { childList: true, characterData: true, subtree: true });
    }
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) schedule();
    });
    journal.addEventListener('travel:content-updated', schedule);
    if (document.fonts) {
      document.fonts.ready.then(schedule);
      if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', schedule);
    }
    measure();
  }

  function init() {
    document.querySelectorAll('.travel-journal--manga').forEach(alignGallery);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
