/*
  Builds the portfolio from content.js (window.SITE) and adds the interactions.
  When the page is shown inside the editor's preview, it uses the editor's unsaved draft instead.
*/
const SITE = (() => {
  try {
    if (window.parent !== window && window.parent.__DRAFT__) return window.parent.__DRAFT__;
  } catch (e) { /* different origin: ignore */ }
  return window.SITE || {};
})();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function url(u) {
  u = String(u ?? '').trim();
  if (/^(https?:|mailto:|tel:)/i.test(u)) return esc(u);
  if (/^[\w\-./%]+$/.test(u) && !u.startsWith('//')) return esc(u); // relative file like assets/x.jpg
  return '#';
}
const list = (a) => (Array.isArray(a) ? a : []);
const chips = (a, cls = 'chips') => `<ul class="${cls}">${list(a).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
const pad = (n) => String(n).padStart(2, '0');
const CAT_ICONS = { robotics: 'ti-robot', community: 'ti-heart-handshake', tech: 'ti-cpu', design: 'ti-palette', sports: 'ti-ball-football', volunteering: 'ti-heart-handshake' };
const catIcon = (c) => CAT_ICONS[String(c || '').toLowerCase()] || 'ti-sparkles';

/* ---------- Render ---------- */
function render() {
  const p = SITE.profile || {};
  const l = SITE.links || {};
  const meta = SITE.meta || {};
  if (meta.title) document.title = meta.title;
  if (meta.description) document.querySelector('meta[name="description"]').setAttribute('content', meta.description);

  document.getElementById('logo').innerHTML = `${esc(p.logoMain)}<span>${esc(p.logoAccent)}</span>`;
  document.getElementById('say-hi').href = l.email ? `mailto:${l.email}` : '#';
  document.getElementById('footer-name').textContent = p.fullName || '';

  const tiles = [];

  // Intro
  tiles.push(`
    <section class="tile intro w2 h2">
      ${p.status ? `<span class="status"><span class="dot"></span>${esc(p.status)}</span>` : ''}
      <h1>${esc(p.headline)} ${p.headlineHighlight ? `<em>${esc(p.headlineHighlight)}</em>` : ''}</h1>
      <p class="lede">${esc(p.intro)}</p>
      <div class="btn-row">
        <a class="btn primary" href="#projects"><i class="ti ti-arrow-down-right" aria-hidden="true"></i>See my work</a>
        <a class="btn" href="#contact"><i class="ti ti-message-circle" aria-hidden="true"></i>Get in touch</a>
      </div>
    </section>`);

  // Identity
  const nameLines = String(p.fullName || '').split(/\s+/).filter(Boolean).map(esc).join('<br>');
  tiles.push(`
    <section class="tile identity h2 tint-violet">
      <p class="label">Who</p>
      <p class="id-name">${nameLines}</p>
      <div class="id-meta">
        ${p.location ? `<span><i class="ti ti-map-pin" aria-hidden="true"></i>${esc(p.location)}</span>` : ''}
        ${p.degree ? `<span><i class="ti ti-school" aria-hidden="true"></i>${esc(p.degree)}</span>` : ''}
      </div>
    </section>`);

  // Currently
  const now = SITE.now || {};
  if (now.role) tiles.push(`
    <section class="tile now tint-peach">
      <p class="label"><span class="live"></span>Currently</p>
      <h3>${esc(now.role)}</h3>
      <p class="muted">${esc([now.company, now.since].filter(Boolean).join(' · '))}</p>
      <i class="ti ti-video tile-icon" aria-hidden="true"></i>
    </section>`);

  // CGPA
  const cg = SITE.cgpa || {};
  if (cg.value) {
    const num = parseFloat(cg.value);
    const dec = (String(cg.value).split('.')[1] || '').length;
    tiles.push(`
    <section class="tile cgpa tint-butter">
      <p class="label">CGPA</p>
      <p class="big-num"><span ${isNaN(num) ? '' : `data-count="${num}" data-decimals="${dec}"`}>${esc(cg.value)}</span></p>
      <p class="muted">${esc(cg.note)}</p>
    </section>`);
  }

  // Projects showcase
  const projects = list(SITE.projects);
  if (projects.length) {
    tiles.push(`
    <section class="tile projects w4 h2" id="projects">
      <div class="projects-head">
        <p class="label">Selected projects</p>
        <span class="count">${pad(projects.length)}</span>
      </div>
      <div class="projects-body">
        <ol class="project-list" role="tablist" aria-label="Projects">
          ${projects.map((pr, i) => `
          <li><button class="project-row${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" data-i="${i}">
            <span class="num">${pad(i + 1)}</span>
            <span class="row-main"><strong>${esc(pr.title)}</strong><small>${esc(pr.tagline)}</small></span>
            ${pr.tag ? `<span class="row-kind">${esc(pr.tag)}</span>` : ''}
            <span class="progress" aria-hidden="true"></span>
          </button></li>`).join('')}
        </ol>
        <div class="stage" role="tabpanel">
          <div class="scenes" aria-hidden="true">
            ${projects.map((pr, i) => `<div class="scene${i === 0 ? ' is-active' : ''}" data-i="${i}">${visual(pr)}</div>`).join('')}
          </div>
          <div class="stage-foot">
            <div class="stage-text">
              <h2 id="stage-title"></h2>
              <p id="stage-desc"></p>
              <ul class="chips" id="stage-chips"></ul>
            </div>
            <div class="stage-actions">
              <button class="btn primary" id="stage-details"><i class="ti ti-layout-sidebar-right-expand" aria-hidden="true"></i>Details</button>
              <a class="btn icon-only" id="stage-github" target="_blank" rel="noopener" aria-label="View on GitHub"><i class="ti ti-brand-github" aria-hidden="true"></i></a>
            </div>
          </div>
        </div>
      </div>
    </section>`);
  }

  // Toolkit
  const sk = SITE.skills || {};
  tiles.push(`
    <section class="tile skills w2 h2">
      <p class="label">Toolkit</p>
      <div class="skill-group"><h3><i class="ti ti-code" aria-hidden="true"></i>Code</h3>${chips(sk.code, 'chips lg')}</div>
      <div class="skill-group"><h3><i class="ti ti-palette" aria-hidden="true"></i>Design and media</h3>${chips(sk.design, 'chips lg')}</div>
    </section>`);

  // Experience
  tiles.push(`
    <section class="tile experience w2 h2">
      <p class="label">Experience</p>
      <ol class="timeline">
        ${list(SITE.experience).map((e) => `
        <li>
          <span class="when">${esc(e.when)}</span>
          <strong>${esc(e.role)}</strong>
          <span class="where">${esc(e.company)}</span>
          ${e.text ? `<p>${esc(e.text)}</p>` : ''}
        </li>`).join('')}
      </ol>
    </section>`);

  // Extracurricular
  const extra = list(SITE.extracurricular);
  const headings = SITE.headings || {};
  if (extra.length) {
    const cats = [...new Set(extra.map((x) => x.category).filter(Boolean))];
    tiles.push(`
    <section class="tile extra w4" id="extracurricular">
      <div class="extra-head">
        <div>
          <p class="label">Extracurricular <span class="count">${pad(extra.length)}</span></p>
          ${headings.extracurricular ? `<h2>${esc(headings.extracurricular)}</h2>` : ''}
        </div>
        <div class="extra-controls">
          ${cats.length > 1 ? `<div class="filters" role="group" aria-label="Filter activities">
            <button class="filter is-active" data-cat="">All</button>
            ${cats.map((c) => `<button class="filter" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
          </div>` : ''}
          <div class="arrows">
            <button class="arrow" data-dir="-1" aria-label="Scroll left"><i class="ti ti-arrow-left" aria-hidden="true"></i></button>
            <button class="arrow" data-dir="1" aria-label="Scroll right"><i class="ti ti-arrow-right" aria-hidden="true"></i></button>
          </div>
        </div>
      </div>
      <div class="extra-track">
        ${extra.map((x, i) => {
          const imgs = list(x.images);
          return `
          <button class="extra-card" data-i="${i}" data-cat="${esc(x.category)}">
            <span class="extra-media" data-cat="${esc(String(x.category || '').toLowerCase())}">
              ${imgs[0] ? `<img src="${url(imgs[0])}" alt="" loading="lazy">` : `<span class="extra-ph"><i class="ti ${catIcon(x.category)}" aria-hidden="true"></i></span>`}
              ${imgs.length > 1 ? `<span class="extra-count"><i class="ti ti-photo" aria-hidden="true"></i>${imgs.length}</span>` : ''}
            </span>
            <span class="extra-info">
              <small>${esc([x.date, x.category].filter(Boolean).join(' · '))}</small>
              <strong>${esc(x.title)}</strong>
            </span>
          </button>`;
        }).join('')}
      </div>
    </section>`);
  }

  // Leadership
  const lead = list(SITE.leadership);
  if (lead.length) tiles.push(`
    <section class="tile leadership w2">
      <p class="label">Leadership</p>
      <ul class="lead-list">
        ${lead.map((x) => `<li><span>${esc(x.role)}</span><em>${esc(x.year)}</em></li>`).join('')}
      </ul>
    </section>`);

  // Robotics
  const rb = SITE.robotics || {};
  if (rb.count) tiles.push(`
    <section class="tile robotics tint-mint">
      <p class="label">Robotics</p>
      <p class="big-num"><span ${isNaN(parseFloat(rb.count)) ? '' : `data-count="${parseFloat(rb.count)}" data-decimals="0"`}>${esc(rb.count)}</span></p>
      <p class="muted">${esc(rb.note)}</p>
      <i class="ti ti-robot tile-icon" aria-hidden="true"></i>
    </section>`);

  // Clock
  tiles.push(`
    <section class="tile clock">
      <p class="label">Local time</p>
      <p class="time" id="clock">--:--</p>
      <p class="muted">Kuala Lumpur · GMT+8</p>
    </section>`);

  // Showreel
  if (l.showreel) tiles.push(`
    <a class="tile media w2 invert" href="${url(l.showreel)}" target="_blank" rel="noopener">
      <div class="media-text">
        <p class="label">Showreel</p>
        <h2>${esc(l.showreelTitle)}</h2>
        <p class="muted">${esc(l.showreelSubtitle)}</p>
      </div>
      <div class="editor" aria-hidden="true">
        <div class="track"><span style="--w:30%;--c:#8FD6EE"></span><span style="--w:22%;--c:#C9CDD4"></span><span style="--w:36%;--c:#FF8A3D"></span></div>
        <div class="track"><span style="--w:18%;--c:#FFC060"></span><span style="--w:44%;--c:#6FA8C4"></span><span style="--w:20%;--c:#E8552C"></span></div>
        <div class="track audio"><span style="--w:92%;--c:#9AA3AE"></span></div>
        <div class="playhead"></div>
      </div>
      <span class="play"><i class="ti ti-player-play" aria-hidden="true"></i></span>
    </a>`);

  // Languages
  const langs = list(SITE.languages);
  if (langs.length) tiles.push(`
    <section class="tile languages w2">
      <p class="label">Languages</p>
      <ul class="lang-list">
        ${langs.map((x) => `<li><span>${esc(x.name)}</span><span class="bar" style="--v:${Math.max(0, Math.min(100, Number(x.level) || 0))}%"></span></li>`).join('')}
      </ul>
    </section>`);

  // Contact
  tiles.push(`
    <section class="tile contact w4" id="contact">
      <div>
        <p class="label">Contact</p>
        <h2>${esc(l.contactHeading)}</h2>
      </div>
      <div class="contact-actions">
        ${l.email ? `<button class="btn primary" id="copy-email" data-email="${esc(l.email)}"><i class="ti ti-copy" aria-hidden="true"></i><span>${esc(l.email)}</span></button>` : ''}
        ${l.linkedin ? `<a class="btn" href="${url(l.linkedin)}" target="_blank" rel="noopener"><i class="ti ti-brand-linkedin" aria-hidden="true"></i>LinkedIn</a>` : ''}
        ${l.github ? `<a class="btn" href="${url(l.github)}" target="_blank" rel="noopener"><i class="ti ti-brand-github" aria-hidden="true"></i>GitHub</a>` : ''}
      </div>
    </section>`);

  document.getElementById('grid').innerHTML = tiles.join('');
}

/* The animated picture shown for each project in the showcase */
function visual(pr) {
  const v = pr.visual || 'none';
  const text = pr.visualText || '';
  if (v === 'gauge') {
    const n = parseFloat(text) || 0;
    return `<div class="gauge">
      <svg viewBox="0 0 200 120"><path class="gauge-track" d="M20 110 A80 80 0 0 1 180 110"/><path class="gauge-fill" d="M20 110 A80 80 0 0 1 180 110" pathLength="100" style="--fill:${100 - Math.max(0, Math.min(100, n))}"/></svg>
      <div class="gauge-text"><span class="gauge-num" data-target="${n}">${esc(n)}</span><small>Score</small></div>
    </div>`;
  }
  if (v === 'chain') {
    const steps = text.split('>').map((s) => s.trim()).filter(Boolean);
    return `<div class="chain">${steps.map((s, i) => `${i ? '<div class="link"></div>' : ''}<div class="block${i === steps.length - 1 ? ' ok' : ''}"><i class="ti ${i === steps.length - 1 ? 'ti-rosette-discount-check' : 'ti-cube'}"></i>${esc(s)}</div>`).join('')}</div>`;
  }
  if (v === 'chat') {
    const title = text.replace(/\b(today|tomorrow|tonight)\b/gi, '').trim();
    return `<div class="todo-demo">
      <div class="bubble"><span class="typed" data-text="${esc(text)}"></span><span class="caret"></span></div>
      <div class="reminder"><i class="ti ti-calendar-event"></i><span><strong>${esc(title.charAt(0).toUpperCase() + title.slice(1))}</strong><small class="tomorrow">Tomorrow</small></span></div>
    </div>`;
  }
  if (v === 'image' && pr.image) return `<img class="scene-img" src="${url(pr.image)}" alt="" loading="lazy">`;
  return `<i class="ti ti-code scene-icon"></i>`;
}

render();

/* ---------- Reveal tiles on scroll ---------- */
const tiles = [...document.querySelectorAll('.tile')];
const revealed = new WeakSet();
function reveal(tile) {
  if (revealed.has(tile)) return;
  revealed.add(tile);
  tile.classList.add('in');
  setTimeout(() => tile.style.removeProperty('--delay'), 1500);
  tile.querySelectorAll('[data-count]').forEach((el) => countUp(el));
  if (tile.classList.contains('projects')) queueMicrotask(startShowcase);
}
if ('IntersectionObserver' in window && !reduceMotion) {
  let order = 0;
  tiles.forEach((t) => {
    if (t.getBoundingClientRect().top < window.innerHeight) {
      t.style.setProperty('--delay', `${Math.min(order++, 8) * 0.06}s`);
      reveal(t);
    }
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  tiles.forEach((t) => { if (!revealed.has(t)) io.observe(t); });
  setTimeout(() => tiles.forEach(reveal), 4000); // safety net
} else {
  tiles.forEach(reveal);
}

/* ---------- Cursor spotlight (one update per frame) ---------- */
if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
  let last = null;
  let raf = 0;
  document.addEventListener('pointermove', (e) => {
    const tile = e.target.closest && e.target.closest('.tile');
    if (!tile) return;
    last = { tile, x: e.clientX, y: e.clientY };
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = last.tile.getBoundingClientRect();
      last.tile.style.setProperty('--mx', `${last.x - r.left}px`);
      last.tile.style.setProperty('--my', `${last.y - r.top}px`);
    });
  }, { passive: true });
}

/* ---------- Count-up numbers ---------- */
function countUp(el, target = parseFloat(el.dataset.count), decimals = parseInt(el.dataset.decimals || '0', 10)) {
  if (isNaN(target)) return;
  if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
  const duration = 1400;
  const start = performance.now();
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // make sure the final value lands even if animation frames are paused (e.g. background tab)
  setTimeout(() => { el.textContent = target.toFixed(decimals); }, duration + 150);
}

/* ---------- Project showcase ---------- */
const projects = list(SITE.projects);
const showcase = document.querySelector('.projects');
const CYCLE_MS = 7000;
let current = 0;
let autoTimer = null;
let autoplay = !reduceMotion;
let typingToken = 0;

function restartBar(row) {
  const bar = row && row.querySelector('.progress');
  if (!bar) return;
  bar.style.animation = 'none';
  void bar.offsetWidth;
  bar.style.animation = '';
}

function select(i) {
  if (!showcase) return;
  current = i;
  const p = projects[i];
  showcase.querySelectorAll('.project-row').forEach((r) => {
    const on = Number(r.dataset.i) === i;
    r.classList.toggle('is-active', on);
    r.setAttribute('aria-selected', on);
    if (on) restartBar(r);
  });
  const scene = showcase.querySelector(`.scene[data-i="${i}"]`);
  showcase.querySelectorAll('.scene').forEach((s) => s.classList.toggle('is-active', s === scene));
  showcase.dataset.visual = p.visual || 'none';

  const stageText = showcase.querySelector('.stage-text');
  stageText.classList.remove('swap');
  void stageText.offsetWidth;
  stageText.classList.add('swap');
  document.getElementById('stage-title').textContent = p.title || '';
  document.getElementById('stage-desc').textContent = p.description || '';
  document.getElementById('stage-chips').innerHTML = list(p.chips).slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('');
  const gh = document.getElementById('stage-github');
  gh.style.display = p.link ? '' : 'none';
  gh.href = url(p.link);

  const num = scene.querySelector('.gauge-num');
  if (num) countUp(num, parseFloat(num.dataset.target) || 0, 0);
  if (scene.querySelector('.typed')) typeDemo(scene);
}

function scheduleNext() {
  clearTimeout(autoTimer);
  if (!autoplay || projects.length < 2) return;
  autoTimer = setTimeout(() => { select((current + 1) % projects.length); scheduleNext(); }, CYCLE_MS);
}

function startShowcase() {
  select(current);
  showcase.classList.toggle('autoplay', autoplay && projects.length > 1);
  scheduleNext();
}

if (showcase) {
  showcase.querySelectorAll('.project-row').forEach((r) => r.addEventListener('click', () => {
    autoplay = false; // once you pick a project, stop auto-rotating
    showcase.classList.remove('autoplay');
    clearTimeout(autoTimer);
    select(Number(r.dataset.i));
  }));
  showcase.addEventListener('pointerenter', () => { clearTimeout(autoTimer); showcase.classList.add('paused'); });
  showcase.addEventListener('pointerleave', () => {
    showcase.classList.remove('paused');
    restartBar(showcase.querySelector('.project-row.is-active'));
    scheduleNext();
  });
  showcase.querySelector('.project-list').addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const i = (current + (e.key === 'ArrowDown' ? 1 : -1) + projects.length) % projects.length;
    const row = showcase.querySelector(`.project-row[data-i="${i}"]`);
    row.focus();
    row.click();
  });
  document.getElementById('stage-details').addEventListener('click', () => openProject(current));
}

/* Chat demo: types the reminder, then shows it with tomorrow's date */
const tmr = new Date(Date.now() + 864e5);
document.querySelectorAll('.tomorrow').forEach((el) => {
  el.textContent = tmr.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · 9:00 PM';
});
function typeDemo(scene) {
  const typed = scene.querySelector('.typed');
  const reminder = scene.querySelector('.reminder');
  const text = typed.dataset.text;
  const token = ++typingToken;
  reminder.classList.remove('show');
  if (reduceMotion) { typed.textContent = text; reminder.classList.add('show'); return; }
  let i = 0;
  typed.textContent = '';
  (function step() {
    if (token !== typingToken) return;
    if (i <= text.length) {
      typed.textContent = text.slice(0, i++);
      setTimeout(step, 45 + Math.random() * 50);
    } else {
      setTimeout(() => { if (token === typingToken) reminder.classList.add('show'); }, 250);
    }
  })();
}

/* ---------- Project details modal ---------- */
const modal = document.getElementById('project-modal');
function openProject(i) {
  const p = projects[i];
  document.getElementById('modal-kind').textContent = p.category || '';
  document.getElementById('modal-title').textContent = p.title || '';
  document.getElementById('modal-summary').textContent = p.summary || '';
  document.getElementById('modal-points').innerHTML = list(p.points).map((t) => `<li>${esc(t)}</li>`).join('');
  document.getElementById('modal-chips').innerHTML = list(p.chips).map((t) => `<li>${esc(t)}</li>`).join('');
  const link = document.getElementById('modal-link');
  link.style.display = p.link ? '' : 'none';
  link.href = url(p.link);
  modal.showModal();
}

/* ---------- Extracurricular: filters, arrows, gallery ---------- */
const extraTile = document.querySelector('.extra');
if (extraTile) {
  const track = extraTile.querySelector('.extra-track');
  extraTile.querySelectorAll('.filter').forEach((f) => f.addEventListener('click', () => {
    extraTile.querySelectorAll('.filter').forEach((b) => b.classList.toggle('is-active', b === f));
    const cat = f.dataset.cat;
    extraTile.querySelectorAll('.extra-card').forEach((c) => { c.hidden = !!cat && c.dataset.cat !== cat; });
    track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  extraTile.querySelectorAll('.arrow').forEach((a) => a.addEventListener('click', () => {
    const card = track.querySelector('.extra-card:not([hidden])');
    const step = card ? card.getBoundingClientRect().width + 14 : 260;
    track.scrollBy({ left: Number(a.dataset.dir) * step * 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  extraTile.querySelectorAll('.extra-card').forEach((c) => c.addEventListener('click', () => openGallery(Number(c.dataset.i))));
}

const gallery = document.getElementById('gallery-modal');
let gItem = null;
let gIndex = 0;
function openGallery(i) {
  gItem = list(SITE.extracurricular)[i];
  gIndex = 0;
  document.getElementById('g-meta').textContent = [gItem.date, gItem.category].filter(Boolean).join(' · ');
  document.getElementById('g-title').textContent = gItem.title || '';
  const desc = document.getElementById('g-desc');
  desc.textContent = gItem.description || '';
  desc.hidden = !gItem.description;
  const imgs = list(gItem.images);
  document.getElementById('g-thumbs').innerHTML = imgs.length > 1
    ? imgs.map((src, k) => `<button class="g-thumb" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${url(src)}" alt="" loading="lazy"></button>`).join('')
    : '';
  document.querySelectorAll('.g-thumb').forEach((b) => b.addEventListener('click', () => showPhoto(Number(b.dataset.k))));
  showPhoto(0);
  gallery.showModal();
}
function showPhoto(k) {
  const imgs = list(gItem.images);
  const has = imgs.length > 0;
  gIndex = has ? (k + imgs.length) % imgs.length : 0;
  const img = document.getElementById('g-img');
  img.hidden = !has;
  document.getElementById('g-empty').hidden = has;
  if (has) {
    img.classList.remove('fade');
    void img.offsetWidth;
    img.src = url(imgs[gIndex]);
    img.alt = `${gItem.title || 'Activity'}, photo ${gIndex + 1}`;
    img.classList.add('fade');
  }
  const many = imgs.length > 1;
  document.getElementById('g-prev').hidden = !many;
  document.getElementById('g-next').hidden = !many;
  document.getElementById('g-counter').textContent = many ? `${gIndex + 1} / ${imgs.length}` : '';
  document.querySelectorAll('.g-thumb').forEach((b) => b.classList.toggle('is-active', Number(b.dataset.k) === gIndex));
}
document.getElementById('g-prev').addEventListener('click', () => showPhoto(gIndex - 1));
document.getElementById('g-next').addEventListener('click', () => showPhoto(gIndex + 1));
gallery.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') showPhoto(gIndex - 1);
  if (e.key === 'ArrowRight') showPhoto(gIndex + 1);
});

/* Close buttons and click-outside for both dialogs */
[modal, gallery].forEach((d) => {
  d.querySelector('.modal-close').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
});

/* ---------- Live clock (Kuala Lumpur) ---------- */
const clockEl = document.getElementById('clock');
function tick() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kuala_Lumpur'
  }).formatToParts(new Date());
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
  clockEl.innerHTML = `${get('hour')}:${get('minute')}<small>${get('dayPeriod').toUpperCase()}</small>`;
}
tick();
setInterval(tick, 15000);

/* ---------- Copy email ---------- */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
const copyBtn = document.getElementById('copy-email');
if (copyBtn) copyBtn.addEventListener('click', async () => {
  const email = copyBtn.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    showToast('Email copied');
  } catch (err) {
    window.location.href = `mailto:${email}`;
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
