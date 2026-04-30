(() => {
  const STORAGE_KEY = 'banana-airlines-status-v1';
  const cycle = ['status-pending', 'status-progress', 'status-done'];

  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveState = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

  const getStatus = (el) => cycle.find(c => el.classList.contains(c)) || 'status-pending';
  const setStatus = (el, s) => {
    cycle.forEach(c => el.classList.remove(c));
    el.classList.add(s);
  };
  const nextStatus = (s) => cycle[(cycle.indexOf(s) + 1) % cycle.length];

  const aggregatePass = (pass) => {
    const items = pass.querySelectorAll('.deliverable');
    if (!items.length) return;
    const statuses = Array.from(items).map(getStatus);
    let agg = 'status-pending';
    if (statuses.every(s => s === 'status-done')) agg = 'status-done';
    else if (statuses.some(s => s === 'status-progress' || s === 'status-done')) agg = 'status-progress';
    setStatus(pass, agg);
  };

  const state = loadState();

  // Restore item-level state (deliverables and manifest items)
  document.querySelectorAll('.deliverable[data-id], .manifest-item[data-id]').forEach(el => {
    if (state[el.dataset.id]) setStatus(el, state[el.dataset.id]);
  });

  // Recompute pass status from children
  document.querySelectorAll('.pass').forEach(aggregatePass);

  // Item click → cycle status
  document.querySelectorAll('.deliverable[data-toggle], .manifest-item[data-toggle]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = nextStatus(getStatus(item));
      setStatus(item, next);
      if (item.dataset.id) {
        state[item.dataset.id] = next;
        saveState(state);
      }
      const pass = item.closest('.pass');
      if (pass) aggregatePass(pass);
    });
  });

  // === OWNER ASSIGNMENT (V / J / F toggle buttons per deliverable) ===
  // Lu (L) está en el equipo pero coordina, no se asigna a tareas.
  const OWNERS_KEY = 'banana-airlines-owners-v1';
  const ALL_OWNERS = ['v', 'j', 'f'];

  const loadOwners = () => {
    try { return JSON.parse(localStorage.getItem(OWNERS_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveOwners = (s) => localStorage.setItem(OWNERS_KEY, JSON.stringify(s));

  const ownerStore = loadOwners();

  document.querySelectorAll('.deliv__owners').forEach(container => {
    const item = container.closest('.deliverable');
    const itemId = item ? item.dataset.id : null;

    // Defaults from existing static markup
    const defaults = new Set();
    Array.from(container.children).forEach(child => {
      const m = (child.className || '').match(/ow--([vjf])/);
      if (m) defaults.add(m[1]);
    });

    const stored = itemId ? ownerStore[itemId] : null;

    container.innerHTML = '';
    ALL_OWNERS.forEach(owner => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ow ow--${owner}`;
      btn.textContent = owner.toUpperCase();
      btn.dataset.owner = owner;
      if (itemId) btn.dataset.itemId = itemId;
      btn.setAttribute('aria-label', `Asignar ${owner.toUpperCase()}`);

      const isOn = stored
        ? !!stored[owner]
        : defaults.has(owner);
      btn.classList.add(isOn ? 'is-on' : 'is-off');
      btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nowOn = btn.classList.contains('is-off');
        btn.classList.toggle('is-on', nowOn);
        btn.classList.toggle('is-off', !nowOn);
        btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false');

        if (itemId) {
          const all = loadOwners();
          if (!all[itemId]) all[itemId] = {};
          all[itemId][owner] = nowOn;
          saveOwners(all);
        }
      });

      container.appendChild(btn);
    });
  });

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section, .pass').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.section, .pass').forEach(el => el.classList.add('is-visible'));
  }

  // Tiny easter egg: console boarding announcement
  console.log('%c BANANA AIRLINES ', 'background:#F5C518;color:#1A1A1F;font-weight:700;letter-spacing:2px;padding:4px 10px;');
  console.log('%c Vuelo BA·2026 · destino STEAM · despegue 01 JUL 2026 (página interna 01 JUN) ', 'color:#D94B3E;font-style:italic;');
})();
