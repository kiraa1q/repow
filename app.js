// ── Repow! — app.js ──
// All links live in links.yaml. Edit that file to add/remove entries.
// To run locally: `npx serve .` or `python3 -m http.server`

let data = { categories: [] };
let fuse = null;
let miniSearch = null;
let activeTag = 'all';
let searchQ = '';

// ── BOOT: fetch links.yaml, then init ──
fetch('links.yaml')
  .then(r => {
    if (!r.ok) throw new Error(`Could not load links.yaml (${r.status})`);
    return r.text();
  })
  .then(text => {
    data = jsyaml.load(text);
    const items = flatItems();
    buildFuse(items);
    buildStats(items);
    buildSidebar(items);
    render();
    document.getElementById('yaml-viewer-content').textContent = text.trim();
    document.getElementById('content').querySelector('.loading')?.remove();
  })
  .catch(err => {
    document.getElementById('content').innerHTML =
      `<div class="empty"><div class="ei">⚠️</div><p>${err.message}<br><small>Are you running a local server?<br><code>npx serve .</code> or <code>python3 -m http.server</code></small></p></div>`;
  });

// ── HELPERS ──
function flatItems() {
  return data.categories.flatMap(c => (c.links || []).map(l => ({ ...l, _cat: c.name, _icon: c.icon })));
}

function buildFuse(items) {
  miniSearch = new MiniSearch({
    fields: ['title', 'description', 'tagsStr', 'badgesStr', '_cat', 'url'],
    storeFields: ['title', 'description', 'tags', 'badges', '_cat', '_icon', 'url'],
    searchOptions: {
      boost: { title: 3, description: 2, tagsStr: 2, badgesStr: 1.5, _cat: 1 },
      fuzzy: 0.2,
      prefix: true,
    }
  });
  // MiniSearch needs an id field and flat strings (no arrays)
  const docs = items.map((item, i) => ({
    ...item,
    id: i,
    tagsStr: (item.tags || []).join(' '),
    badgesStr: (item.badges || []).join(' '),
  }));
  miniSearch.addAll(docs);
}

function buildStats(items) {
  document.getElementById('stat-total').textContent = items.length;
  document.getElementById('stat-cats').textContent = data.categories.length;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

let activeBadge = 'all';
const BADGE_LIST = ['community', 'opensource', 'official', 'free', 'paid', 'tool'];
const BADGE_DISPLAY = { community:'community', opensource:'open-source', official:'official', free:'free', paid:'paid', tool:'tool' };

function buildSidebar(items) {
  // Tags
  const tags = ['all', ...new Set(items.flatMap(i => i.tags || []).sort())];
  const tn = document.getElementById('tag-nav');
  tn.innerHTML = '';
  tags.forEach(t => {
    const b = document.createElement('button');
    b.className = 'tag-btn' + (t === activeTag ? ' active' : '');
    b.dataset.tag = t;
    b.textContent = t === 'all' ? 'All tags' : '#' + t;
    b.addEventListener('click', () => {
      activeTag = t;
      document.querySelectorAll('[data-tag]').forEach(x => x.classList.toggle('active', x.dataset.tag === t));
      render();
    });
    tn.appendChild(b);
  });

  // Badges
  const bn = document.getElementById('badge-nav');
  bn.innerHTML = '';
  ['all', ...BADGE_LIST].forEach(badge => {
    const count = badge === 'all' ? items.length : items.filter(i => (i.badges || []).includes(badge)).length;
    if (badge !== 'all' && !count) return;
    const b = document.createElement('button');
    b.className = 'tag-btn' + (badge === activeBadge ? ' active' : '');
    b.dataset.badgeFilter = badge;
    if (badge === 'all') {
      b.textContent = 'All badges';
    } else {
      b.innerHTML = `<span class="badge badge-${badge}" style="pointer-events:none">${BADGE_DISPLAY[badge]}</span><span style="margin-left:auto;font-family:'Geist Mono',monospace;font-size:10px;opacity:0.4">${count}</span>`;
      b.style.display = 'flex';
      b.style.alignItems = 'center';
    }
    b.addEventListener('click', () => {
      activeBadge = badge;
      document.querySelectorAll('[data-badge-filter]').forEach(x => x.classList.toggle('active', x.dataset.badgeFilter === badge));
      render();
    });
    bn.appendChild(b);
  });
}

// ── RENDER HELPERS ──
function hl(text, q) {
  if (!q || q.length < 2) return text;
  return text.replace(
    new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
    '<span class="hl">$1</span>'
  );
}

function favicon(url) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return null; }
}

const BADGE_LABELS = {
  community: 'community',
  opensource: 'open-source',
  official: 'official',
  free: 'free',
  paid: 'paid',
  tool: 'tool'
};

function badgeHTML(b) {
  const label = BADGE_LABELS[b] || b;
  return `<span class="badge badge-${b} clickable-chip" data-search="${label}" title="Search '${label}'">${label}</span>`;
}

function cardHTML(link, q = '') {
  const fav = favicon(link.url);
  const favEl = fav
    ? `<div class="lc-fav"><img src="${fav}" onerror="this.parentNode.innerHTML='🔗'"/></div>`
    : `<div class="lc-fav">🔗</div>`;
  let host = link.url;
  try { host = new URL(link.url).hostname; } catch {}
  const badges = (link.badges || []).map(badgeHTML).join('');
  const tags = (link.tags || []).map(t =>
    `<span class="tag-chip clickable-chip" data-search="${t}" title="Search '${t}'">#${hl(t, q)}</span>`
  ).join('');
  const descPart = link.description
    ? `<span class="lc-sep">—</span><span class="lc-desc">${hl(link.description, q)}</span>`
    : '';
  return `<a class="link-card" href="${link.url}" target="_blank" rel="noopener">
    ${favEl}
    <span class="lc-title">${hl(link.title || '', q)}</span>
    ${descPart}
    <div class="lc-right">
      <div class="lc-badges">${badges}</div>
      <div class="lc-tags">${tags}</div>
      <span class="lc-url">${host}</span>
      <span class="lc-arrow">↗</span>
    </div>
  </a>`;
}

function sectionHTML(name, icon, links, q = '') {
  return `<div class="cat-section" id="cat-${slugify(name)}">
    <div class="cat-header">
      <span class="cat-icon">${icon || '📁'}</span>
      <span class="cat-name">${name}</span>
      <span class="cat-count">${links.length}</span>
    </div>
    <div class="link-list">${links.map(l => cardHTML(l, q)).join('')}</div>
  </div>`;
}

// ── MAIN RENDER ──
function render() {
  const content = document.getElementById('content');
  const bar = document.getElementById('results-bar');
  const q = searchQ.trim();

  if (q.length >= 1) {
    let results = miniSearch.search(q).map(r => ({
      title: r.title, description: r.description, tags: r.tags,
      badges: r.badges, _cat: r._cat, _icon: r._icon, url: r.url
    }));
    if (activeTag !== 'all') results = results.filter(l => (l.tags || []).includes(activeTag));
    if (activeBadge !== 'all') results = results.filter(l => (l.badges || []).includes(activeBadge));
    bar.innerHTML = results.length
      ? `<strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for "<strong>${q}</strong>"`
      : '';
    if (!results.length) {
      content.innerHTML = `<div class="empty"><div class="ei">🔍</div><p>Nothing found for "<strong>${q}</strong>".<br>Maybe add it?</p></div>`;
      return;
    }
    const grouped = {};
    results.forEach(l => {
      if (!grouped[l._cat]) grouped[l._cat] = { icon: l._icon, links: [] };
      grouped[l._cat].links.push(l);
    });
    content.innerHTML = Object.entries(grouped)
      .map(([c, { icon, links }]) => sectionHTML(c, icon, links, q)).join('');
  } else {
    bar.textContent = '';
    content.innerHTML = data.categories.map(cat => {
      let links = cat.links || [];
      if (activeTag !== 'all') links = links.filter(l => (l.tags || []).includes(activeTag));
      if (activeBadge !== 'all') links = links.filter(l => (l.badges || []).includes(activeBadge));
      return links.length ? sectionHTML(cat.name, cat.icon, links) : '';
    }).join('');
  }
}

// ── EVENTS: search + keyboard ──
document.getElementById('search').addEventListener('input', e => {
  searchQ = e.target.value;
  render();
});

document.addEventListener('keydown', e => {
  const inS = document.activeElement === document.getElementById('search');
  const addOpen = document.getElementById('add-modal').classList.contains('open');
  const yamlOpen = document.getElementById('yaml-modal').classList.contains('open');
  if (e.key === '/' && !inS && !addOpen) { e.preventDefault(); document.getElementById('search').focus(); }
  if (e.key === 'Escape') {
    if (addOpen) { closeAdd(); return; }
    if (yamlOpen) { document.getElementById('yaml-modal').classList.remove('open'); return; }
    document.getElementById('search').value = '';
    searchQ = '';
    activeTag = 'all';
    activeBadge = 'all';
    document.querySelectorAll('[data-tag]').forEach(x => x.classList.toggle('active', x.dataset.tag === 'all'));
    document.querySelectorAll('[data-badge-filter]').forEach(x => x.classList.toggle('active', x.dataset.badgeFilter === 'all'));
    render();
    document.getElementById('search').blur();
  }
  if (e.key === '+' && !inS && !addOpen) openAdd();
});

// ── CLICKABLE CHIPS: click badge/tag → search it ──
document.addEventListener('click', e => {
  const chip = e.target.closest('.clickable-chip');
  if (!chip) return;
  e.preventDefault();
  e.stopPropagation();
  const term = chip.dataset.search;
  if (!term) return;
  const el = document.getElementById('search');
  el.value = term;
  searchQ = term;
  el.focus();
  render();
});

// ── ADD LINK MODAL ──
function openAdd() {
  document.getElementById('add-modal').classList.add('open');
  setTimeout(() => document.getElementById('f-url').focus(), 80);
}

function closeAdd() {
  document.getElementById('add-modal').classList.remove('open');
  ['f-url', 'f-title', 'f-desc', 'f-cat', 'f-tags'].forEach(id => document.getElementById(id).value = '');
  document.querySelectorAll('.bp-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('yaml-out').classList.remove('show');
  document.getElementById('copy-note').classList.remove('show');
}

document.getElementById('fab-btn').addEventListener('click', openAdd);
document.getElementById('add-cancel').addEventListener('click', closeAdd);
document.getElementById('add-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('add-modal')) closeAdd();
});
document.getElementById('badge-picker').addEventListener('click', e => {
  if (e.target.classList.contains('bp-btn')) e.target.classList.toggle('active');
});
document.getElementById('add-generate').addEventListener('click', () => {
  const url = document.getElementById('f-url').value.trim();
  const title = document.getElementById('f-title').value.trim();
  if (!url || !title) { alert('URL and title are required.'); return; }
  const desc = document.getElementById('f-desc').value.trim();
  const cat = document.getElementById('f-cat').value.trim() || 'Uncategorized';
  const tags = document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const badges = [...document.querySelectorAll('.bp-btn.active')].map(b => b.dataset.badge);
  let yaml = `  # add under category: ${cat}\n  - title: "${title}"\n    url: "${url}"`;
  if (desc)          yaml += `\n    description: "${desc}"`;
  if (tags.length)   yaml += `\n    tags: [${tags.join(', ')}]`;
  if (badges.length) yaml += `\n    badges: [${badges.join(', ')}]`;
  const out = document.getElementById('yaml-out');
  out.textContent = yaml;
  out.classList.add('show');
  navigator.clipboard.writeText(yaml)
    .then(() => document.getElementById('copy-note').classList.add('show'))
    .catch(() => {});
});

// ── YAML VIEWER MODAL ──
document.getElementById('view-yaml-link').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('yaml-modal').classList.add('open');
});
document.getElementById('yaml-close').addEventListener('click', () => {
  document.getElementById('yaml-modal').classList.remove('open');
});
document.getElementById('yaml-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('yaml-modal'))
    document.getElementById('yaml-modal').classList.remove('open');
});
document.getElementById('yaml-copy-all').addEventListener('click', () => {
  fetch('links.yaml').then(r => r.text()).then(text => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById('yaml-copy-all');
    btn.textContent = '✓ copied!';
    setTimeout(() => btn.textContent = 'copy all', 2000);
  });
});
