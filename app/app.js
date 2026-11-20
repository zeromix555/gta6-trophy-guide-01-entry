// app.js — Vice City Platinum: renders the checklist, roadmap, missables and
// Next-up planner for the 55 GTA 6 trophies, and keeps progress in the browser.
import { loadState, saveState, isEarned, setEarned, setNote, exportFile, importFile, SAMPLE_EARNED } from './progress.js';
import { ROADMAP_STAGES, nextUpOrder } from './roadmap.js';

const state = loadState();
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const $ = (id) => document.getElementById(id);
const listEl = $('trophy-list');
const detailEl = $('detail');
let selectedId = null;

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const btn = $('theme-toggle');
  btn.textContent = state.theme === 'dark' ? 'Light theme' : 'Dark theme';
  btn.setAttribute('aria-pressed', String(state.theme === 'dark'));
}

function applySpoiler() {
  const btn = $('spoiler-toggle');
  btn.textContent = `Hide story spoilers: ${state.spoiler ? 'on' : 'off'}`;
  btn.setAttribute('aria-pressed', String(state.spoiler));
}

function spoilerHidden(t) {
  return state.spoiler && t.kind === 'story' && !isEarned(state, t.id);
}

function gradeLabel(g) {
  return g[0].toUpperCase() + g.slice(1);
}

function filters() {
  return {
    q: $('search').value.trim().toLowerCase(),
    kind: $('kind-filter').value,
    grade: $('grade-filter').value,
    hideEarned: $('hide-earned').checked,
  };
}

function visibleTrophies() {
  const f = filters();
  return trophies.filter((t) => {
    if (f.hideEarned && isEarned(state, t.id)) return false;
    if (f.grade !== 'all' && t.grade !== f.grade) return false;
    if (f.kind === 'missable' && !t.missable) return false;
    if (f.kind === 'online') return false; // No online trophies: the list is all offline.
    if (f.kind !== 'all' && f.kind !== 'missable' && t.kind !== f.kind) return false;
    if (f.q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(f.q)) return false;
    return true;
  });
}

function renderProgress() {
  const earned = state.earned.length;
  const total = trophies.length;
  $('earned-count').textContent = earned;
  $('total-count').textContent = total;
  $('earned-pct').textContent = `${Math.round((earned / total) * 100)}%`;
  $('progress-fill').style.width = `${(earned / total) * 100}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (isEarned(state, t.id)) byGrade[t.grade].got += 1;
  }
  $('grade-progress').innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `<span>${gradeLabel(g)} ${byGrade[g].got}/${byGrade[g].total}</span>`)
    .join('');
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  $('result-count').textContent =
    shown.length === trophies.length
      ? `${trophies.length} trophies · 1 platinum, 2 gold, 6 silver, 46 bronze · 0 online`
      : `${shown.length} of ${trophies.length} trophies shown`;
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-card' + (isEarned(state, t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = isEarned(state, t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      setEarned(state, t.id, box.checked);
      renderAll();
    });
    const hiddenSpoiler = spoilerHidden(t);
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = hiddenSpoiler ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.textContent = hiddenSpoiler ? 'Story trophy — hidden until earned (spoiler setting is on).' : t.description;
    const meta = document.createElement('span');
    meta.className = 'trophy-meta';
    const badges = [
      `<span class="badge grade-${t.grade}">${gradeLabel(t.grade)}</span>`,
      `<span class="badge">${t.kind === 'story' ? 'Story' : t.kind === 'collectibles' ? 'Collectibles' : 'Activities'}</span>`,
    ];
    if (t.hidden) badges.push('<span class="badge hidden-flag">Hidden on PSN</span>');
    if (t.missable) badges.push('<span class="badge missable">Potentially missable</span>');
    if (t.count) badges.push(`<span class="badge">${t.count} of ${t.countOf}</span>`);
    meta.innerHTML = badges.join('');
    const count = document.createElement('span');
    count.className = 'trophy-count';
    count.textContent = t.count ? `${t.count} / ${t.countOf}` : '';
    li.append(box, name, count, desc, meta);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    listEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = '<p class="detail-empty">Select a trophy to read its guide, sources and notes.</p>';
    return;
  }
  const earned = isEarned(state, t.id);
  const hiddenSpoiler = spoilerHidden(t);
  detailEl.replaceChildren();
  const h2 = document.createElement('h2');
  h2.textContent = hiddenSpoiler ? 'Hidden story trophy' : t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hiddenSpoiler
    ? 'Official name and description hidden by the spoiler setting — earn it to reveal.'
    : `“${t.description}” · ${gradeLabel(t.grade)}${t.hidden ? ' · Hidden on PlayStation until earned' : ''}${t.count ? ` · ${t.count} of ${t.countOf}` : ''}`;
  detailEl.append(h2, official);
  if (t.missable) {
    const warn = document.createElement('p');
    warn.className = 'missable-note';
    warn.textContent = '⚠ Potentially missable — the first meditation spot can be missed in Chapter 1. Do it the moment the game first offers meditation.';
    detailEl.append(warn);
  }
  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hiddenSpoiler ? 'Guide hidden until the trophy is earned.' : t.guide;
  detailEl.append(guideH, guide);
  if (!hiddenSpoiler) {
    const srcH = document.createElement('h3');
    srcH.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources || []) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
      ul.append(li);
    }
    detailEl.append(srcH, ul);
  }
  const noteH = document.createElement('h3');
  noteH.textContent = 'Your notes & keys';
  const note = document.createElement('textarea');
  note.placeholder = 'e.g. spot location, loadout, route — saved in this browser';
  note.value = state.notes[t.id] || '';
  note.setAttribute('aria-label', `Notes for ${t.name}`);
  const saved = document.createElement('span');
  saved.className = 'note-saved';
  note.addEventListener('input', () => {
    setNote(state, t.id, note.value);
    saved.textContent = note.value.trim() ? 'Saved.' : '';
  });
  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.textContent = earned ? 'Mark as not earned' : 'Mark as earned';
  earnBtn.addEventListener('click', () => {
    setEarned(state, t.id, !isEarned(state, t.id));
    renderAll();
  });
  earnRow.append(earnBtn);
  detailEl.append(noteH, note, saved, earnRow);
}

function renderRoadmap() {
  const wrap = $('roadmap-stages');
  wrap.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const stageTrophies = trophies.filter((t) => t.stage === s.stage);
    const got = stageTrophies.filter((t) => isEarned(state, t.id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<h2>${s.title}</h2><p class="stage-meta">${s.time} · ${got}/${stageTrophies.length} trophies earned in this stage</p><p>${s.blurb}</p><p><strong>Tip:</strong> ${s.tip}</p>`;
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const fill = document.createElement('div');
    fill.className = 'stage-fill';
    fill.style.width = `${stageTrophies.length ? (got / stageTrophies.length) * 100 : 0}%`;
    bar.append(fill);
    const ul = document.createElement('ul');
    for (const t of stageTrophies) {
      const li = document.createElement('li');
      li.className = isEarned(state, t.id) ? 'earned' : '';
      li.textContent = `${spoilerHidden(t) ? 'Hidden story trophy' : t.name} — ${gradeLabel(t.grade)}${t.missable ? ' · potentially missable' : ''}`;
      ul.append(li);
    }
    div.append(bar, ul);
    wrap.append(div);
  }
}

function renderMissables() {
  const wrap = $('missable-list');
  wrap.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const t of missable) {
    const card = document.createElement('div');
    card.className = 'missable-card';
    card.innerHTML = `<h2>${t.name} <span class="badge grade-${t.grade}">${gradeLabel(t.grade)}</span></h2><p class="official">“${t.description}” · ${t.count} spots in 10 locations</p><p>${t.guide}</p>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = isEarned(state, t.id) ? 'Earned ✓' : 'Open in checklist';
    btn.addEventListener('click', () => {
      showView('checklist');
      selectedId = t.id;
      $('search').value = '';
      $('kind-filter').value = 'all';
      renderAll();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    card.append(btn);
    wrap.append(card);
  }
  const safe = document.createElement('div');
  safe.className = 'missable-safe';
  safe.innerHTML = `<h2>Everything else is safe</h2><p>The other 54 trophies cannot be missed: story trophies unlock automatically, and every collectible, activity and grind trophy stays available in free-roam after the story — there is no mission replay, but nothing in free-roam is locked behind a mission you can fail. PowerPyx lists exactly one potential missable; Push Square lists none.</p>`;
  wrap.append(safe);
}

function renderNextUp() {
  const wrap = $('nextup-list');
  wrap.replaceChildren();
  const items = nextUpOrder(trophies, new Set(state.earned)).slice(0, 15);
  if (!items.length) {
    wrap.innerHTML = '<li class="nextup-item"><span class="nextup-rank">★</span><span><strong>Platinum earned!</strong><span class="why">Every trophy is ticked. Vice Got a Price! is yours — you are a Leonida Legend.</span></span></li>';
    return;
  }
  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'nextup-item';
    const rank = document.createElement('span');
    rank.className = 'nextup-rank';
    rank.textContent = i + 1;
    const body = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = spoilerHidden(item.trophy) ? 'Hidden story trophy' : item.trophy.name;
    const why = document.createElement('span');
    why.className = 'why';
    why.textContent = item.why;
    body.append(name, document.createElement('br'), why);
    li.append(rank, body);
    li.addEventListener('click', () => {
      selectedId = item.trophy.id;
      showView('checklist');
      renderAll();
    });
    wrap.append(li);
  });
}

function showView(view) {
  for (const btn of document.querySelectorAll('.tab')) {
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'nextup') renderNextUp();
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  const active = document.querySelector('.tab.active')?.dataset.view || 'checklist';
  if (active === 'roadmap') renderRoadmap();
  if (active === 'missables') renderMissables();
  if (active === 'nextup') renderNextUp();
  $('missable-count').textContent = trophies.filter((t) => t.missable && !isEarned(state, t.id)).length;
}

function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('view')) showView(h.get('view'));
  if (h.get('trophy')) selectedId = h.get('trophy');
  if (h.get('spoiler') === 'on' || h.get('spoiler') === 'off') state.spoiler = h.get('spoiler') === 'on';
  if (h.get('kind')) $('kind-filter').value = h.get('kind');
  if (h.get('grade')) $('grade-filter').value = h.get('grade');
  if (h.get('q')) $('search').value = h.get('q');
  if (h.get('theme') === 'dark' || h.get('theme') === 'light') state.theme = h.get('theme');
}

for (const btn of document.querySelectorAll('.tab')) {
  btn.addEventListener('click', () => {
    showView(btn.dataset.view);
    history.replaceState(null, '', `#view=${btn.dataset.view}`);
  });
}
$('search').addEventListener('input', renderList);
$('kind-filter').addEventListener('change', renderList);
$('grade-filter').addEventListener('change', renderList);
$('hide-earned').addEventListener('change', renderList);
$('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveState(state);
  applyTheme();
});
$('spoiler-toggle').addEventListener('click', () => {
  state.spoiler = !state.spoiler;
  saveState(state);
  applySpoiler();
  renderAll();
});
$('export-btn').addEventListener('click', () => exportFile(state));
$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const next = await importFile(file);
    Object.assign(state, next);
    selectedId = null;
    applyTheme();
    applySpoiler();
    renderAll();
  } catch {
    alert('That file is not a valid progress export.');
  }
  e.target.value = '';
});
$('sample-btn').addEventListener('click', () => {
  for (const id of SAMPLE_EARNED) if (!state.earned.includes(id)) state.earned.push(id);
  saveState(state);
  renderAll();
});
$('reset-btn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies, notes and settings?')) return;
  state.earned = [];
  state.notes = {};
  selectedId = null;
  saveState(state);
  renderAll();
});

readHash();
applyTheme();
applySpoiler();
renderAll();
