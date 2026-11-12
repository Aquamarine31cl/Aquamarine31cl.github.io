(() => {
  'use strict';

  const workspace = document.querySelector('.personal-workspace');
  const form = workspace.querySelector('[data-shop-form]');
  const fields = ['name', 'area', 'type', 'notes'];
  const name = form.elements.namedItem('name');
  const heading = document.getElementById('shop-editor-heading');
  const save = workspace.querySelector('[data-shop-save]');
  const cancel = workspace.querySelector('[data-shop-cancel]');
  const status = workspace.querySelector('[data-shop-form-status]');
  const search = document.getElementById('shop-search');
  const random = workspace.querySelector('[data-shop-random]');
  const result = workspace.querySelector('[data-shop-pick]');
  const count = workspace.querySelector('[data-shop-count]');
  const list = workspace.querySelector('[data-shop-list]');
  const template = workspace.querySelector('[data-shop-item]');
  const storageKey = 'aquamarine.personal.shops.v1';
  let shops = [];
  let filtered = [];
  let editing = null;
  let lastPick = null;

  function readShops() {
    const records = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(records) || !records.every(shop =>
      shop && typeof shop.id === 'string' && fields.every(field => typeof shop[field] === 'string')
    )) {
      throw new Error('Invalid saved shop list');
    }
    return records;
  }

  function details(shop) {
    return [shop.area, shop.type].filter(Boolean).join(' · ');
  }

  function clearPick() {
    result.textContent = '';
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    filtered = shops.filter(shop => fields.some(field => shop[field].toLocaleLowerCase().includes(query)));
    random.disabled = filtered.length === 0;
    count.textContent = shops.length === 0 ? 'Your list is empty.'
      : filtered.length === 0 ? 'No shops match your search.'
      : query ? `${filtered.length} of ${shops.length} shops`
      : `${shops.length} ${shops.length === 1 ? 'shop' : 'shops'}`;

    const items = document.createDocumentFragment();
    for (const shop of filtered) {
      const item = template.content.firstElementChild.cloneNode(true);
      item.dataset.shopId = shop.id;
      item.querySelector('[data-shop-name]').textContent = shop.name;
      const info = item.querySelector('[data-shop-info]');
      info.textContent = details(shop);
      info.hidden = !info.textContent;
      const notes = item.querySelector('[data-shop-notes]');
      notes.textContent = shop.notes;
      notes.hidden = !shop.notes;
      for (const button of item.querySelectorAll('[data-shop-action]')) {
        button.setAttribute('aria-label', `${button.textContent} ${shop.name}`);
      }
      items.append(item);
    }
    list.replaceChildren(items);
  }

  function refresh() {
    clearPick();
    try {
      shops = readShops();
      render();
    } catch {
      shops = [];
      render();
      count.textContent = 'The saved list could not be read from this browser.';
    }
  }

  function resetEditor() {
    editing = null;
    form.reset();
    heading.textContent = 'Add a shop';
    save.textContent = 'Save shop';
    cancel.hidden = true;
  }

  function persist(records) {
    localStorage.setItem(storageKey, JSON.stringify(records));
    shops = records;
    clearPick();
    render();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (workspace.hidden) return;

    const values = Object.fromEntries(fields.map(field => [field, form.elements.namedItem(field).value.trim()]));
    if (!values.name) {
      status.textContent = 'Enter a shop name.';
      name.focus();
      return;
    }

    try {
      const latest = readShops();
      if (editing) {
        const index = latest.findIndex(shop => shop.id === editing);
        if (index < 0) {
          status.textContent = 'This shop was removed. Cancel the edit to add a new shop.';
          refresh();
          return;
        }
        latest[index] = { id: editing, ...values };
      } else {
        latest.unshift({ id: crypto.randomUUID(), ...values });
      }
      persist(latest);
      resetEditor();
      status.textContent = `Saved ${values.name}.`;
      name.focus();
    } catch {
      status.textContent = 'The shop could not be saved. Check that browser storage is available and try again.';
    }
  });

  cancel.addEventListener('click', () => {
    resetEditor();
    status.textContent = '';
    name.focus();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-shop-action]');
    if (!button || workspace.hidden) return;
    const shop = shops.find(record => record.id === button.closest('[data-shop-id]').dataset.shopId);
    if (!shop) return;

    if (button.dataset.shopAction === 'edit') {
      editing = shop.id;
      for (const field of fields) form.elements.namedItem(field).value = shop[field];
      heading.textContent = 'Edit shop';
      save.textContent = 'Save changes';
      cancel.hidden = false;
      status.textContent = '';
      name.focus();
      return;
    }

    if (!window.confirm(`Delete “${shop.name}” from your saved shops?`)) return;
    try {
      persist(readShops().filter(record => record.id !== shop.id));
      if (editing === shop.id) resetEditor();
      count.textContent = `Deleted ${shop.name}. ${count.textContent}`;
      search.focus();
    } catch {
      count.textContent = 'The shop could not be deleted. Please try again.';
    }
  });

  search.addEventListener('input', () => {
    clearPick();
    render();
  });

  random.addEventListener('click', () => {
    if (workspace.hidden || !filtered.length) return;
    const options = filtered.length > 1 ? filtered.filter(shop => shop.id !== lastPick) : filtered;
    const pick = options[Math.floor(Math.random() * options.length)];
    const info = details(pick);
    lastPick = pick.id;
    result.textContent = `Try ${pick.name}${info ? ` · ${info}` : ''}`;
  });

  function syncAccess() {
    if (!workspace.hidden) {
      refresh();
      return;
    }
    shops = [];
    filtered = [];
    lastPick = null;
    resetEditor();
    search.value = '';
    status.textContent = '';
    count.textContent = '';
    random.disabled = true;
    clearPick();
    list.replaceChildren();
  }

  document.addEventListener('site-access-changed', syncAccess);
  window.addEventListener('storage', event => {
    if (!workspace.hidden && (event.key === storageKey || event.key === null)) refresh();
  });
  save.disabled = false;
  syncAccess();
})();
