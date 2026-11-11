/* Strategy shortcuts are scoped to the active game's controls. */
(() => {
  'use strict';
  const profiles = [
    ['[data-relay-siege]', 'Use the arrow keys to select a tile. 1–3 select a tower, B builds, U upgrades, S salvages, N launches a wave, and P pauses or resumes.', {
      '1': '[data-siege-mode="laser"]', '2': '[data-siege-mode="stasis"]', '3': '[data-siege-mode="rail"]',
      b: '[data-siege-action="build"]', u: '[data-siege-action="upgrade"]',
      s: '[data-siege-action="sell"]', n: '[data-siege-launch]', p: '[data-siege-pause]'
    }],
    ['[data-helios]', 'Use the arrow keys to select a hex. 1–6 build modules in button order, U upgrades, R repairs, L launches a beacon, and N advances the cycle.', {
      '1': '[data-helios-build="solar"]', '2': '[data-helios-build="mine"]',
      '3': '[data-helios-build="lab"]', '4': '[data-helios-build="shield"]',
      '5': '[data-helios-build="radiator"]', '6': '[data-helios-build="relay"]',
      u: '[data-helios-order="upgrade"]', r: '[data-helios-order="repair"]',
      l: '[data-helios-order="launch"]', n: '[data-helios-next]'
    }],
    ['[data-meridian]', 'Use the arrow keys to navigate and Enter to select a ship or target. M moves, F fires, T launches a missile, B braces, O sets overwatch, Z undoes an order, and E ends the turn.', {
      m: '[data-fleet-action="move"]', f: '[data-fleet-action="shoot"]',
      t: '[data-fleet-action="missile"]', b: '[data-fleet-action="brace"]',
      o: '[data-fleet-action="overwatch"]', z: '[data-fleet-undo]', e: '[data-fleet-action="end"]'
    }]
  ];

  for (const [selector, instructions, commands] of profiles) {
    const game = document.querySelector(selector);
    if (!game) continue;
    const help = document.createElement('p');
    help.className = 'campaign-key-help';
    help.textContent = instructions;
    const manual = game.querySelector('.helios-help');
    if (manual) manual.append(help);
    else game.querySelector('h1').after(help);
    game.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
          event.target.isContentEditable || event.target.closest('input, select, textarea, a, summary')) return;
      const action = commands[event.key.toLowerCase()];
      const button = action && game.querySelector(action);
      if (!button || button.disabled) return;
      event.preventDefault();
      button.click();
    });
  }
})();
