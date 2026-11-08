/*
  Portfolio editor. Builds forms from SCHEMA, keeps an unsaved draft,
  shows it in the preview, and saves it to content.js through the local server.
*/

/* ---------- What can be edited ---------- */
const VISUALS = [
  ['gauge', 'Score gauge'],
  ['chain', 'Step chain'],
  ['chat', 'Typed reminder'],
  ['image', 'Picture'],
  ['none', 'Icon only']
];

const SCHEMA = [
  {
    id: 'profile', title: 'Profile', icon: 'ti-user', fields: [
      { k: 'fullName', label: 'Full name', hint: 'Shown on the Who tile and in the footer.' },
      { k: 'logoMain', label: 'Logo, white part' },
      { k: 'logoAccent', label: 'Logo, orange part' },
      { k: 'status', label: 'Status badge', hint: 'The small pill above your headline.' },
      { k: 'headline', label: 'Headline', type: 'textarea' },
      { k: 'headlineHighlight', label: 'Headline ending', hint: 'Shown in the orange gradient after the headline.' },
      { k: 'intro', label: 'Intro paragraph', type: 'textarea' },
      { k: 'location', label: 'Location' },
      { k: 'degree', label: 'Degree' }
    ]
  },
  {
    id: 'links', title: 'Links and contact', icon: 'ti-link', fields: [
      { k: 'email', label: 'Email', type: 'email' },
      { k: 'linkedin', label: 'LinkedIn link', type: 'url' },
      { k: 'github', label: 'GitHub link', type: 'url' },
      { k: 'showreel', label: 'Showreel link', type: 'url', hint: 'Google Drive, YouTube or any link to your video and design work.' },
      { k: 'showreelTitle', label: 'Showreel title' },
      { k: 'showreelSubtitle', label: 'Showreel subtitle' },
      { k: 'contactHeading', label: 'Contact heading' }
    ]
  },
  {
    id: 'now', title: 'Currently', icon: 'ti-briefcase', fields: [
      { k: 'role', label: 'Role' },
      { k: 'company', label: 'Company' },
      { k: 'since', label: 'Since', hint: 'For example: since Mar 2026' }
    ]
  },
  {
    id: 'cgpa', title: 'CGPA', icon: 'ti-school', fields: [
      { k: 'value', label: 'CGPA' },
      { k: 'note', label: 'Note under the number' }
    ]
  },
  {
    id: 'projects', title: 'Projects', icon: 'ti-layout-grid', list: true,
    note: 'Drag order with the arrows. The first project shows first.',
    itemName: (x) => x.title || 'New project',
    itemSub: (x) => x.tag || '',
    blank: () => ({ title: '', tagline: '', tag: '', category: '', description: '', summary: '', points: [], chips: [], link: '', visual: 'image', visualText: '', image: '' }),
    fields: [
      { k: 'title', label: 'Project name' },
      { k: 'tagline', label: 'Short line in the list' },
      { k: 'tag', label: 'Tag', hint: 'One word shown on the right of the list, like Flutter.' },
      { k: 'description', label: 'Description on the showcase', type: 'textarea' },
      { k: 'category', label: 'Category in the details pop-up', hint: 'For example: Mobile app · Flutter' },
      { k: 'summary', label: 'Summary in the details pop-up', type: 'textarea' },
      { k: 'points', label: 'Key points', type: 'lines', hint: 'One point per line.' },
      { k: 'chips', label: 'Tools used', type: 'tags' },
      { k: 'link', label: 'GitHub or project link', type: 'url' },
      { k: 'visual', label: 'Showcase visual', type: 'select', options: VISUALS },
      { k: 'visualText', label: 'Visual text', hint: 'Score gauge: a number 0–100. Step chain: steps separated by > . Typed reminder: the sentence to type.' },
      { k: 'image', label: 'Picture', type: 'image', hint: 'Used when the visual is Picture. A screenshot of the app works well.' }
    ]
  },
  {
    id: 'extracurricular', title: 'Extracurricular', icon: 'ti-photo', list: true,
    note: 'Add photos to any activity. The first photo is the cover.',
    itemName: (x) => x.title || 'New activity',
    itemSub: (x) => [x.date, (x.images || []).length ? `${x.images.length} photo${x.images.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · '),
    itemThumb: (x) => (x.images || [])[0],
    blank: () => ({ title: '', date: '', category: '', description: '', images: [] }),
    addTop: true,
    fields: [
      { k: 'title', label: 'Activity name' },
      { k: 'date', label: 'Date', hint: 'For example: May 2026' },
      { k: 'category', label: 'Category', type: 'category', hint: 'Activities are grouped into filters by category.' },
      { k: 'description', label: 'Description', type: 'textarea', hint: 'Optional. What you did or achieved.' },
      { k: 'images', label: 'Photos', type: 'images' }
    ]
  },
  {
    id: 'headings', title: 'Section headings', icon: 'ti-heading', fields: [
      { k: 'extracurricular', label: 'Extracurricular heading', hint: 'The big line above your activities. Leave empty to show only the small label.' }
    ]
  },
  {
    id: 'skills', title: 'Toolkit', icon: 'ti-tools', fields: [
      { k: 'code', label: 'Code', type: 'tags' },
      { k: 'design', label: 'Design and media', type: 'tags' }
    ]
  },
  {
    id: 'experience', title: 'Experience', icon: 'ti-timeline', list: true,
    itemName: (x) => x.role || 'New role', itemSub: (x) => x.when || '',
    blank: () => ({ when: '', role: '', company: '', text: '' }),
    addTop: true,
    fields: [
      { k: 'when', label: 'When', hint: 'For example: Mar 2026 — Now' },
      { k: 'role', label: 'Role' },
      { k: 'company', label: 'Company' },
      { k: 'text', label: 'What you did', type: 'textarea' }
    ]
  },
  {
    id: 'leadership', title: 'Leadership', icon: 'ti-flag', list: true,
    itemName: (x) => x.role || 'New position', itemSub: (x) => x.year || '',
    blank: () => ({ role: '', year: '' }),
    addTop: true,
    fields: [
      { k: 'role', label: 'Position and organisation' },
      { k: 'year', label: 'Year' }
    ]
  },
  {
    id: 'robotics', title: 'Robotics', icon: 'ti-robot', fields: [
      { k: 'count', label: 'Number shown' },
      { k: 'note', label: 'Note under the number' }
    ]
  },
  {
    id: 'languages', title: 'Languages', icon: 'ti-language', list: true,
    itemName: (x) => x.name || 'New language', itemSub: (x) => `${x.level ?? 0}%`,
    blank: () => ({ name: '', level: 50 }),
    fields: [
      { k: 'name', label: 'Language' },
      { k: 'level', label: 'Level', type: 'range' }
    ]
  },
  {
    id: 'meta', title: 'Search and sharing', icon: 'ti-world', fields: [
      { k: 'title', label: 'Browser tab title' },
      { k: 'description', label: 'Description for Google and link previews', type: 'textarea' }
    ]
  }
];

/* ---------- State ---------- */
const draft = JSON.parse(JSON.stringify(window.SITE || {}));
window.__DRAFT__ = draft; // the preview reads this
let dirty = false;

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const statusEl = $('#status');

function setStatus(text, cls = '') {
  statusEl.textContent = text;
  statusEl.className = cls;
}
function markDirty() {
  dirty = true;
  setStatus('Unsaved changes', 'dirty');
  schedulePreview();
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, error = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', error);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), error ? 4500 : 2200);
}

/* ---------- Building the form ---------- */
function sectionData(sec) {
  if (sec.list) {
    if (!Array.isArray(draft[sec.id])) draft[sec.id] = [];
  } else if (!draft[sec.id] || typeof draft[sec.id] !== 'object') {
    draft[sec.id] = {};
  }
  return draft[sec.id];
}

function buildNav() {
  $('#section-nav').innerHTML = SCHEMA.map((s) => `<a href="#sec-${s.id}">${esc(s.title)}</a>`).join('');
}

function buildForm() {
  const form = $('#form');
  form.innerHTML = '';
  SCHEMA.forEach((sec) => form.appendChild(buildSection(sec)));
}

function buildSection(sec, openIndex = -1) {
  const el = document.createElement('section');
  el.className = 'sec';
  el.id = `sec-${sec.id}`;
  const data = sectionData(sec);
  el.innerHTML = `
    <div class="sec-head">
      <h2><i class="ti ${sec.icon}"></i>${esc(sec.title)}</h2>
      ${sec.list ? `<span class="count">${data.length}</span>` : ''}
    </div>
    ${sec.note ? `<p class="sec-note">${esc(sec.note)}</p>` : ''}`;

  if (!sec.list) {
    sec.fields.forEach((f) => el.appendChild(buildField(f, data)));
    return el;
  }

  const rebuild = (open) => {
    const fresh = buildSection(sec, open);
    el.replaceWith(fresh);
    markDirty();
  };
  const addBtn = () => {
    const row = document.createElement('div');
    row.className = 'add-row';
    row.innerHTML = `<button type="button" class="btn small"><i class="ti ti-plus"></i>Add ${esc(sec.title === 'Extracurricular' ? 'activity' : sec.title.toLowerCase().replace(/s$/, ''))}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      if (sec.addTop) { data.unshift(sec.blank()); rebuild(0); } else { data.push(sec.blank()); rebuild(data.length - 1); }
    });
    return row;
  };

  if (sec.addTop) el.appendChild(addBtn());
  data.forEach((item, i) => {
    const det = document.createElement('details');
    det.className = 'item';
    if (i === openIndex) det.open = true;
    const thumb = sec.itemThumb && sec.itemThumb(item);
    det.innerHTML = `
      <summary>
        <i class="ti ti-chevron-right chev"></i>
        ${thumb ? `<img class="thumb-mini" src="/${esc(thumb)}" alt="">` : ''}
        <span class="name"></span>
        <span class="sub"></span>
        <span class="tools">
          <button type="button" class="icon-btn" data-act="up" title="Move up" aria-label="Move up"><i class="ti ti-arrow-up"></i></button>
          <button type="button" class="icon-btn" data-act="down" title="Move down" aria-label="Move down"><i class="ti ti-arrow-down"></i></button>
          <button type="button" class="icon-btn danger" data-act="del" title="Delete" aria-label="Delete"><i class="ti ti-trash"></i></button>
        </span>
      </summary>
      <div class="item-body"></div>`;
    const refreshSummary = () => {
      $('.name', det).textContent = sec.itemName(item);
      $('.sub', det).textContent = sec.itemSub ? sec.itemSub(item) : '';
    };
    refreshSummary();
    det.addEventListener('input', refreshSummary);
    det.addEventListener('change', refreshSummary);

    det.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const act = b.dataset.act;
      if (act === 'del') {
        if (!confirm(`Delete "${sec.itemName(item)}"? (Nothing is lost until you save.)`)) return;
        data.splice(i, 1);
        rebuild(-1);
      } else {
        const j = act === 'up' ? i - 1 : i + 1;
        if (j < 0 || j >= data.length) return;
        [data[i], data[j]] = [data[j], data[i]];
        rebuild(j);
      }
    }));

    const body = $('.item-body', det);
    // Build the fields only when opened, so long lists stay fast.
    const fill = () => { if (!body.childElementCount) sec.fields.forEach((f) => body.appendChild(buildField(f, item, refreshSummary))); };
    if (det.open) fill();
    det.addEventListener('toggle', () => { if (det.open) fill(); });
    el.appendChild(det);
  });
  if (!sec.addTop) el.appendChild(addBtn());
  return el;
}

function buildField(f, obj, onChange = () => {}) {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = `f-${Math.random().toString(36).slice(2, 9)}`;
  const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
  const set = (v) => { obj[f.k] = v; onChange(); markDirty(); };
  const type = f.type || 'text';

  if (type === 'text' || type === 'url' || type === 'email') {
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><input id="${id}" type="${type === 'text' ? 'text' : type}" value="${esc(obj[f.k])}">${hint}`;
    $('input', wrap).addEventListener('input', (e) => set(e.target.value));
  } else if (type === 'textarea') {
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><textarea id="${id}" rows="3">${esc(obj[f.k])}</textarea>${hint}`;
    const ta = $('textarea', wrap);
    autoGrow(ta);
    ta.addEventListener('input', (e) => { autoGrow(ta); set(e.target.value); });
  } else if (type === 'lines') {
    const val = (obj[f.k] || []).join('\n');
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><textarea id="${id}" rows="4">${esc(val)}</textarea>${hint}`;
    const ta = $('textarea', wrap);
    autoGrow(ta);
    ta.addEventListener('input', (e) => { autoGrow(ta); set(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)); });
  } else if (type === 'select') {
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><select id="${id}">${f.options.map(([v, t]) => `<option value="${v}" ${obj[f.k] === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>${hint}`;
    $('select', wrap).addEventListener('change', (e) => set(e.target.value));
  } else if (type === 'category') {
    const cats = [...new Set((draft.extracurricular || []).map((x) => x.category).filter(Boolean))];
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><input id="${id}" type="text" list="${id}-list" value="${esc(obj[f.k])}"><datalist id="${id}-list">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist>${hint}`;
    $('input', wrap).addEventListener('input', (e) => set(e.target.value));
  } else if (type === 'range') {
    const v = Number(obj[f.k]) || 0;
    wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><div class="range-row"><input id="${id}" type="range" min="0" max="100" step="5" value="${v}"><output>${v}%</output></div>${hint}`;
    $('input', wrap).addEventListener('input', (e) => { $('output', wrap).textContent = `${e.target.value}%`; set(Number(e.target.value)); });
  } else if (type === 'tags') {
    buildTags(wrap, f, obj, set, hint, id);
  } else if (type === 'image') {
    buildSingleImage(wrap, f, obj, set, hint);
  } else if (type === 'images') {
    buildImages(wrap, f, obj, set, hint);
  } else if (type === 'file') {
    buildFile(wrap, f, obj, set, hint);
  }
  return wrap;
}

function autoGrow(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${ta.scrollHeight + 2}px`;
}

function buildTags(wrap, f, obj, set, hint, id) {
  if (!Array.isArray(obj[f.k])) obj[f.k] = [];
  const tags = obj[f.k];
  wrap.innerHTML = `<label for="${id}">${esc(f.label)}</label><div class="tags"></div><span class="hint">Type and press Enter to add. ${f.hint ? esc(f.hint) : ''}</span>`;
  const box = $('.tags', wrap);
  const draw = () => {
    box.innerHTML = tags.map((t, i) => `<span class="tag">${esc(t)}<button type="button" data-i="${i}" aria-label="Remove ${esc(t)}"><i class="ti ti-x"></i></button></span>`).join('') +
      `<input id="${id}" type="text" placeholder="Add…">`;
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { tags.splice(Number(b.dataset.i), 1); set(tags); draw(); $('input', box).focus(); }));
    const input = $('input', box);
    input.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
        e.preventDefault();
        tags.push(input.value.trim().replace(/,$/, ''));
        set(tags); draw(); $('input', box).focus();
      } else if (e.key === 'Backspace' && !input.value && tags.length) {
        tags.pop(); set(tags); draw(); $('input', box).focus();
      }
    });
    input.addEventListener('blur', () => { if (input.value.trim()) { tags.push(input.value.trim()); set(tags); draw(); } });
  };
  box.addEventListener('click', (e) => { if (e.target === box) $('input', box).focus(); });
  draw();
}

function buildSingleImage(wrap, f, obj, set, hint) {
  const draw = () => {
    const v = obj[f.k];
    wrap.innerHTML = `<label>${esc(f.label)}</label>
      <div class="file-row">
        ${v ? `<img class="single-img" src="/${esc(v)}" alt="">` : ''}
        <button type="button" class="btn small" data-act="pick"><i class="ti ti-upload"></i>${v ? 'Replace' : 'Upload picture'}</button>
        ${v ? '<button type="button" class="btn small danger" data-act="clear"><i class="ti ti-trash"></i>Remove</button>' : ''}
      </div>${hint}`;
    $('[data-act="pick"]', wrap).addEventListener('click', async () => {
      const files = await pickFiles('image/*', false);
      if (!files.length) return;
      const path = await uploadWithFeedback(files[0]);
      if (path) { set(path); draw(); }
    });
    const clear = $('[data-act="clear"]', wrap);
    if (clear) clear.addEventListener('click', () => { set(''); draw(); });
  };
  draw();
}

function buildFile(wrap, f, obj, set, hint) {
  const draw = () => {
    const v = obj[f.k];
    wrap.innerHTML = `<label>${esc(f.label)}</label>
      <div class="file-row">
        <span class="path">${v ? `<a href="/${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>` : 'No file'}</span>
        <button type="button" class="btn small" data-act="pick"><i class="ti ti-upload"></i>${v ? 'Replace' : 'Upload'}</button>
      </div>${hint}`;
    $('[data-act="pick"]', wrap).addEventListener('click', async () => {
      const files = await pickFiles(f.accept, false);
      if (!files.length) return;
      const path = await uploadWithFeedback(files[0]);
      if (path) { set(path); draw(); }
    });
  };
  draw();
}

function buildImages(wrap, f, obj, set, hint) {
  if (!Array.isArray(obj[f.k])) obj[f.k] = [];
  const imgs = obj[f.k];
  wrap.innerHTML = `<label>${esc(f.label)}</label><div class="images"></div><span class="hint">Click Add or drag photos here. Big photos are shrunk automatically. ${f.hint ? esc(f.hint) : ''}</span>`;
  const grid = $('.images', wrap);
  let pending = 0;

  const draw = () => {
    grid.innerHTML = imgs.map((src, i) => `
      <div class="img-cell">
        <img src="/${esc(src)}" alt="">
        ${i === 0 ? '<span class="cover-badge">Cover</span>' : ''}
        <div class="img-tools">
          <span>
            <button type="button" data-act="left" data-i="${i}" aria-label="Move earlier"><i class="ti ti-arrow-left"></i></button>
            <button type="button" data-act="right" data-i="${i}" aria-label="Move later"><i class="ti ti-arrow-right"></i></button>
          </span>
          <button type="button" data-act="del" data-i="${i}" aria-label="Remove photo"><i class="ti ti-trash"></i></button>
        </div>
      </div>`).join('') +
      Array.from({ length: pending }, () => '<div class="img-cell loading">Uploading…</div>').join('') +
      '<button type="button" class="img-add"><i class="ti ti-photo-plus"></i>Add photos</button>';

    grid.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      if (b.dataset.act === 'del') imgs.splice(i, 1);
      if (b.dataset.act === 'left' && i > 0) [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]];
      if (b.dataset.act === 'right' && i < imgs.length - 1) [imgs[i + 1], imgs[i]] = [imgs[i], imgs[i + 1]];
      set(imgs); draw();
    }));
    $('.img-add', grid).addEventListener('click', async () => addFiles(await pickFiles('image/*', true)));
  };

  async function addFiles(files) {
    files = files.filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    pending += files.length;
    draw();
    for (const file of files) {
      const path = await uploadWithFeedback(file);
      pending -= 1;
      if (path) imgs.push(path);
      set(imgs);
      draw();
    }
  }

  grid.addEventListener('dragover', (e) => { e.preventDefault(); grid.classList.add('drag'); });
  grid.addEventListener('dragleave', () => grid.classList.remove('drag'));
  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    grid.classList.remove('drag');
    addFiles([...e.dataTransfer.files]);
  });
  draw();
}

/* ---------- Files and uploads ---------- */
function pickFiles(accept, multiple) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '';
    input.multiple = multiple;
    input.addEventListener('change', () => resolve([...input.files]));
    input.click();
  });
}

// Redraw every photo before uploading: big ones get smaller so the website stays fast,
// and redrawing drops hidden details like the GPS location and phone model.
async function shrinkImage(file, maxSide = 1800, quality = 0.85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return { blob: file, name: file.name };
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const png = file.type === 'image/png' && scale === 1; // keep small PNGs (screenshots, logos) sharp and transparent
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, png ? 'image/png' : 'image/jpeg', quality));
    return { blob, name: file.name.replace(/\.[^.]+$/, '') + (png ? '.png' : '.jpg') };
  } catch (e) {
    return { blob: file, name: file.name };
  }
}

async function upload(file) {
  const { blob, name } = await shrinkImage(file);
  const res = await fetch(`/api/upload?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Upload failed.');
  return json.path;
}

async function uploadWithFeedback(file) {
  try {
    const path = await upload(file);
    toast(`Uploaded ${file.name}`);
    return path;
  } catch (e) {
    toast(`${file.name}: ${e.message} Is the editor window still open?`, true);
    return null;
  }
}

/* ---------- Preview ---------- */
const frame = $('#preview');
let previewTimer;
let savedScroll = 0;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(reloadPreview, 600);
}
function reloadPreview() {
  try { savedScroll = frame.contentWindow.scrollY; } catch (e) { savedScroll = 0; }
  frame.contentWindow.location.reload();
}
frame.addEventListener('load', () => {
  try { frame.contentWindow.scrollTo(0, savedScroll); } catch (e) { /* ignore */ }
});
document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('is-on', x === b));
  $('#frame-wrap').classList.toggle('phone', b.dataset.size === 'phone');
}));
$('#toggle-view').addEventListener('click', () => {
  const on = $('#layout').classList.toggle('show-preview');
  $('#toggle-view span').textContent = on ? 'Edit' : 'Preview';
  $('#toggle-view i').className = `ti ${on ? 'ti-pencil' : 'ti-eye'}`;
});

/* ---------- Save and discard ---------- */
async function save() {
  const btn = $('#save');
  btn.disabled = true;
  setStatus('Saving…');
  try {
    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Save failed.');
    dirty = false;
    setStatus(`Saved at ${json.savedAt}`, 'saved');
    toast('Saved. Click Publish when you want it on the live site.');
    refreshPublish();
    return true;
  } catch (e) {
    setStatus('Not saved', 'dirty');
    toast(`Couldn't save: ${e.message} Is the editor window still open?`, true);
    return false;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Publish to the live website ---------- */
let pubInfo = null;
async function refreshPublish() {
  try {
    const res = await fetch('/api/publish-status');
    pubInfo = await res.json();
  } catch (e) {
    pubInfo = null;
  }
  const waiting = pubInfo && pubInfo.ready && (pubInfo.files.length || pubInfo.unpushed);
  $('#pub-dot').hidden = !waiting;
  $('#publish').title = waiting ? 'You have saved changes that aren\'t on the live website yet' : 'The live website is up to date';
}

const FRIENDLY = { 'content.js': 'Your text, links and photo list' };
function describe(file) {
  if (FRIENDLY[file]) return FRIENDLY[file];
  if (file.startsWith('assets/uploads/')) return `Photo: ${file.slice(15)}`;
  return file;
}

async function publish() {
  const btn = $('#publish');
  if (btn.disabled) return;
  if (dirty) {
    if (!confirm('You have unsaved changes. Save them and publish?')) return;
    if (!(await save())) return;
  }
  await refreshPublish();
  if (!pubInfo) { toast('Couldn\'t reach the editor. Is its window still open?', true); return; }
  if (!pubInfo.ready) { toast(pubInfo.error, true); return; }
  const files = pubInfo.files;
  if (!files.length && !pubInfo.unpushed) { toast('Nothing new to publish. The live site is up to date.'); return; }
  const shown = files.slice(0, 12).map((f) => `  • ${describe(f)}`).join('\n');
  const more = files.length > 12 ? `\n  …and ${files.length - 12} more` : '';
  const list = files.length ? `These will be uploaded and visible to anyone:\n${shown}${more}\n\n` : 'Your last saved version will be uploaded.\n\n';
  if (!confirm(`Publish to ${pubInfo.url || 'your website'}?\n\n${list}It shows up on the site about a minute later.`)) return;

  btn.disabled = true;
  btn.classList.add('busy');
  setStatus('Publishing…');
  try {
    const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Publishing failed.');
    setStatus(`Published at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 'saved');
    toast(json.nothing ? 'Nothing new to publish.' : 'Published. Your website updates in about a minute.');
  } catch (e) {
    setStatus('Not published', 'dirty');
    toast(e.message, true);
  } finally {
    btn.disabled = false;
    btn.classList.remove('busy');
    refreshPublish();
  }
}
$('#publish').addEventListener('click', publish);
$('#save').addEventListener('click', save);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
});
$('#discard').addEventListener('click', () => {
  if (!dirty) { toast('Nothing to discard'); return; }
  if (confirm('Discard all changes since your last save?')) { dirty = false; location.reload(); }
});
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- Start ---------- */
if (location.protocol === 'file:') {
  document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Open the editor by double-clicking <b>Edit website.bat</b> in the portfolio folder.</p>';
} else {
  buildNav();
  buildForm();
  setStatus(window.SITE ? 'All changes saved' : 'content.js not found, starting empty', window.SITE ? 'saved' : 'dirty');
  refreshPublish();
}
