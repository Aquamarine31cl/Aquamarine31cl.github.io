(() => {
  'use strict';

  const manifest = document.querySelector('link[rel="manifest"]');
  if (!manifest) return;
  setupGameView();
  const zoom = document.querySelector('[data-arcade-board-zoom]');
  if (zoom) {
    const scroll = document.querySelector('[data-arcade-board-scroll]');
    const help = document.querySelector('[data-arcade-board-hint]');
    zoom.parentElement.hidden = false;
    zoom.addEventListener('click', () => {
      const enlarged = scroll.classList.toggle('arcade-board-enlarged');
      zoom.setAttribute('aria-pressed', String(enlarged));
      zoom.textContent = enlarged ? 'Fit board' : 'Zoom board';
      help.textContent = enlarged ? 'Swipe to see more sectors.' : '';
      if (!enlarged) scroll.scrollLeft = 0;
    });
  }

  function setupGameView() {
    const game = document.querySelector('[data-arcade-fullscreen]');
    if (!game) return;
    const title = game.querySelector('h1');
    const heading = document.createElement('div');
    heading.className = 'arcade-game-heading';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.dataset.fullscreenToggle = '';
    title.before(heading);
    heading.append(title, toggle);

    const outside = [...document.querySelectorAll('.arcade-skip, .arcade-bar, .arcade-back')].filter(node => !node.inert);
    let useNative = document.fullscreenEnabled && typeof game.requestFullscreen === 'function';
    let expanded = false;
    let changing = false;
    const isNative = () => document.fullscreenElement === game;
    const isExpandedView = () => game.classList.contains('arcade-focus-view');

    function refresh() {
      const active = isNative() || isExpandedView();
      toggle.textContent = active ? (isNative() ? 'Exit full screen' : 'Exit expanded view') : (useNative ? 'Full screen' : 'Expand game');
      toggle.setAttribute('aria-pressed', String(active));
      if (expanded === active) return;
      expanded = active;
      for (const node of outside) node.inert = active;
      requestAnimationFrame(() => {
        if (expanded !== active) return;
        const playfield = game.querySelector('canvas, .mission-grid [tabindex="0"], .fleet-board [tabindex="0"]');
        const target = active ? playfield || toggle : toggle;
        target.focus({preventScroll: true});
        if (active && playfield && matchMedia('(max-height: 620px)').matches) {
          playfield.scrollIntoView({block: 'nearest', inline: 'nearest'});
        }
      });
    }

    function useExpandedView(on) {
      game.classList.toggle('arcade-focus-view', on);
      document.documentElement.classList.toggle('arcade-focus-mode', on);
      refresh();
    }

    toggle.addEventListener('click', async () => {
      if (changing) return;
      if (isExpandedView()) { useExpandedView(false); return; }
      if (!useNative) { useExpandedView(true); return; }
      changing = true;
      try {
        if (isNative()) await document.exitFullscreen();
        else await game.requestFullscreen();
      } catch {
        if (!isNative()) {
          useNative = false;
          useExpandedView(true);
        }
      } finally {
        changing = false;
        refresh();
      }
    });
    document.addEventListener('fullscreenchange', refresh);
    game.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isExpandedView()) {
        event.preventDefault();
        useExpandedView(false);
      }
    });
    refresh();
  }
  const toolbar = document.querySelector('[data-arcade-app-actions]');
  const install = toolbar?.querySelector('[data-arcade-install]');
  const status = toolbar?.querySelector('[data-arcade-offline]');
  const installHelp = toolbar?.querySelector('[data-arcade-install-help]');
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let promptEvent;

  if (toolbar && !standalone) {
    installHelp.hidden = false;
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      promptEvent = event;
      installHelp.hidden = true;
      install.hidden = false;
    });
    install.addEventListener('click', async () => {
      if (!promptEvent) return;
      const event = promptEvent;
      promptEvent = undefined;
      install.hidden = true;
      try {
        await event.prompt();
        const result = await event.userChoice;
        if (result.outcome !== 'accepted') installHelp.hidden = false;
      } catch {
        installHelp.hidden = false;
      }
    });
    window.addEventListener('appinstalled', () => {
      install.hidden = true;
      installHelp.hidden = true;
    });
  }

  if (!('serviceWorker' in navigator) || !isSecureContext) return;
  const worker = new URL('sw.js', manifest.href);
  if (status) status.textContent = 'Preparing offline games…';
  function showReady() {
    if (!status || !navigator.serviceWorker.controller) return;
    status.textContent = navigator.onLine ? 'Offline play ready' : 'Playing offline';
  }
  navigator.serviceWorker.addEventListener('controllerchange', showReady);
  window.addEventListener('online', showReady);
  window.addEventListener('offline', showReady);
  showReady();
  if(navigator.serviceWorker.controller && !navigator.onLine)return;
  navigator.serviceWorker.register(worker).then(registration => {
    const track = serviceWorker => {
      serviceWorker?.addEventListener('statechange', () => {
        if (status && serviceWorker.state === 'redundant' && !navigator.serviceWorker.controller) {
          status.textContent = 'Offline download failed. Reload to retry.';
        }
        showReady();
      });
    };
    track(registration.installing);
    registration.addEventListener('updatefound', () => track(registration.installing));
    showReady();
  }).catch(() => {
    if (navigator.serviceWorker.controller) showReady();
    else if (status) status.textContent = 'Offline play unavailable on this browser.';
  });
})();
