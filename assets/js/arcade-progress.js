(() => {
  'use strict';
  function read(mode) {
    try {
      const saved = JSON.parse(localStorage.getItem('star-arcade.grid.' + mode));
      const stage = saved?.stage;
      const best = Object.fromEntries(Object.entries(saved?.best ?? {}).filter(([level, turns]) =>
        /^(0|[1-9]\d{0,2})$/.test(level) && Number(level) < 500 && Number.isInteger(turns) && turns > 0));
      return {stage: Number.isInteger(stage) && stage >= 0 && stage < 500 ? stage : 0, best};
    } catch {
      return {stage: 0, best: {}};
    }
  }
  function save(mode, progress) {
    try { localStorage.setItem('star-arcade.grid.' + mode, JSON.stringify(progress)); } catch {}
  }
  globalThis.StarArcadeProgress = {read, save};
  const filters = document.querySelector('.arcade-filters');
  if (filters) {
    const cards = [...document.querySelectorAll('[data-game-kind]')];
    const buttons = [...filters.querySelectorAll('button')];
    for (const button of buttons) {
      button.addEventListener('click', () => {
        const kind = button.dataset.gameFilter;
        for (const card of cards) card.hidden = kind !== 'all' && card.dataset.gameKind !== kind;
        for (const option of buttons) option.setAttribute('aria-pressed', String(option === button));
      });
    }
    filters.hidden = false;
  }
  for (const card of document.querySelectorAll('[data-arcade-progress]')) {
    const {stage, best} = read(card.dataset.arcadeProgress);
    const completed = Object.keys(best).length;
    if (completed || stage) {
      card.querySelector('.arcade-play-label').textContent = 'Open Stage ' + (stage + 1) + ' →';
      card.querySelector('.arcade-record').textContent = completed + ' / 500 cleared';
    }
  }
})();
