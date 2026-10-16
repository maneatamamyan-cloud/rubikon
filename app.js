import { draft, GARMENTS } from './draft.js';
import { layoutSheet, sheetSVG, THEMES, packFabric, fabricSVG } from './render.js';
import { buildInstructions, makeFormat } from './instructions.js';
import en from './en.js';
import ru from './ru.js';
import hy from './hy.js';

const LANGS = { en, hy, ru };

// ---------- measurements ----------
const FIELD_DEFS = {
  bust: { min: 60, max: 170, def: 92 },
  waist: { min: 45, max: 160, def: 74 },
  hip: { min: 65, max: 180, def: 100 },
  neck: { min: 28, max: 55, def: 36 },
  shoulder: { min: 28, max: 55, def: 38 },
  bustHeight: { min: 15, max: 40, opt: true },
  upperBust: { min: 60, max: 160, opt: true },
  underBust: { min: 55, max: 150, opt: true },
  backLen: { min: 32, max: 55, def: 41 },
  shoulderWaist: { min: 30, max: 65, def: 46 },
  waistHip: { min: 12, max: 32, def: 20 },
  dressLen: { min: 60, max: 170, def: 105 },
  topLen: { min: 40, max: 90, def: 62 },
  jacketLen: { min: 45, max: 100, def: 68 },
  coatLen: { min: 70, max: 140, def: 100 },
  skirtLen: { min: 30, max: 120, def: 62 },
  crotchDepth: { min: 18, max: 40, def: 27 },
  trouserLen: { min: 35, max: 125, def: 102 },
  corsetBelow: { min: 0, max: 25, def: 6 },
  kneeCirc: { min: 28, max: 60, opt: true },
  armLen: { min: 45, max: 75, def: 59 },
  upperArm: { min: 18, max: 55, def: 29 },
  wrist: { min: 12, max: 25, def: 16 },
  acrossBack: { min: 26, max: 55, opt: true },
  acrossChest: { min: 24, max: 55, opt: true },
  bustSpan: { min: 12, max: 30, opt: true },
};

const UPPER_BODY = ['bust', 'waist', 'hip', 'neck', 'shoulder', 'bustHeight', 'upperBust', 'underBust'];
const ARMS = ['armLen', 'upperArm', 'wrist'];
const ADV = ['acrossBack', 'acrossChest', 'bustSpan'];
const upperGroups = (len) => [
  { key: 'body', ids: UPPER_BODY },
  { key: 'lengths', ids: ['backLen', 'shoulderWaist', 'waistHip', len] },
  { key: 'arms', ids: ARMS, arms: true },
];
const GROUPS = {
  dress: upperGroups('dressLen'),
  top: upperGroups('topLen'),
  blazer: upperGroups('jacketLen'),
  coat: upperGroups('coatLen'),
  skirt: [{ key: 'body', ids: ['waist', 'hip'] }, { key: 'lengths', ids: ['waistHip', 'skirtLen'] }],
  corset: [{ key: 'body', ids: ['bust', 'waist', 'hip', 'bustHeight', 'upperBust', 'underBust'] }, { key: 'lengths', ids: ['backLen', 'shoulderWaist', 'waistHip', 'corsetBelow'] }],
  trousers: [{ key: 'body', ids: ['waist', 'hip'] }, { key: 'legs', ids: ['waistHip', 'crotchDepth', 'trouserLen', 'kneeCirc'] }],
};
const HAS_ADV = { dress: true, top: true, blazer: true, coat: true, corset: true };
const ADV_FOR = { corset: ['bustSpan'] };

// ---------- style choices ----------
const ICON = (d) => `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const ICONS = {
  neckline: {
    round: ICON('M6 6 L10 4 C12 10 20 10 22 4 L26 6 L26 28 L6 28 Z'),
    scoop: ICON('M6 6 L9 4 C10 16 22 16 23 4 L26 6 L26 28 L6 28 Z'),
    v: ICON('M6 6 L10 4 L16 17 L22 4 L26 6 L26 28 L6 28 Z'),
  },
  sleeve: {
    none: ICON('M9 4 L13 4 C14 7 18 7 19 4 L23 4 C22 9 24 12 24 12 L24 28 L8 28 L8 12 C8 12 10 9 9 4 Z'),
    short: ICON('M10 4 L13 4 C14 7 18 7 19 4 L22 4 L28 11 L25 14 L23 12 L23 28 L9 28 L9 12 L7 14 L4 11 Z'),
    threequarter: ICON('M10 4 L13 4 C14 7 18 7 19 4 L22 4 L27 20 L24 21 L23 12 L23 28 L9 28 L9 12 L8 21 L5 20 Z'),
    long: ICON('M10 4 L13 4 C14 7 18 7 19 4 L22 4 L28 27 L25 28 L23 12 L23 28 L9 28 L9 12 L7 28 L4 27 Z'),
  },
  skirt: {
    pencil: ICON('M11 4 L21 4 L23 14 L21 28 L11 28 L9 14 Z'),
    aline: ICON('M11 4 L21 4 L27 28 L5 28 Z'),
    gathered: ICON('M11 4 L21 4 L26 27 C22 29 10 29 6 27 Z M13 4 L12 12 M16 4 L16 13 M19 4 L20 12'),
    circle: ICON('M12 4 L20 4 C24 14 30 22 30 26 C24 30 8 30 2 26 C2 22 8 14 12 4 Z'),
    pleated: ICON('M11 4 L21 4 L26 28 L6 28 Z M13.5 4 L12 28 M16 4 L16 28 M18.5 4 L20 28'),
  },
  back: {
    closed: ICON('M6 6 L10 4 C12 6 20 6 22 4 L26 6 L26 28 L6 28 Z'),
    v: ICON('M6 6 L10 4 L16 20 L22 4 L26 6 L26 28 L6 28 Z'),
    u: ICON('M6 6 L10 4 C10 24 22 24 22 4 L26 6 L26 28 L6 28 Z'),
    keyhole: ICON('M6 6 L10 4 C12 6 20 6 22 4 L26 6 L26 28 L6 28 Z M16 5.5 C13.5 9 13.5 12 16 14 C18.5 12 18.5 9 16 5.5 Z'),
  },
  sleeveType: {
    setin: ICON('M10 4 L13 4 C14 7 18 7 19 4 L22 4 L28 14 L25 16 L23 12 L23 28 L9 28 L9 12 L7 16 L4 14 Z M10 4 C10 8 9.5 10 9 12 M22 4 C22 8 22.5 10 23 12'),
    raglan: ICON('M12 4 L13 4 C14 7 18 7 19 4 L20 4 L28 14 L25 16 L23 12 L23 28 L9 28 L9 12 L7 16 L4 14 Z M13 4.5 L9 12 M19 4.5 L23 12'),
  },
  corsetNeck: {
    sweetheart: ICON('M6 10 C8 6 13 6 16 11 C19 6 24 6 26 10 L24 28 L8 28 Z'),
    straight: ICON('M6 9 L26 9 L24 28 L8 28 Z'),
  },
  leg: {
    straight: ICON('M10 4 L22 4 L23 28 L18 28 L16 12 L14 28 L9 28 Z'),
    tapered: ICON('M10 4 L22 4 L21 28 L17.5 28 L16 12 L14.5 28 L11 28 Z'),
    wide: ICON('M10 4 L22 4 L27 28 L19 28 L16 12 L13 28 L5 28 Z'),
  },
};
const GARMENT_ICON = {
  dress: 'M15 5 L18 5 C19 8 21 8 22 5 L25 5 C24 10 26 14 26 14 L25.5 19 L33 36 L7 36 L14.5 19 L14 14 C14 14 16 10 15 5 Z M14.5 19 L25.5 19',
  skirt: 'M13 7 L27 7 L27 11 L13 11 Z M13 11 L27 11 L33 34 L7 34 Z',
  corset: 'M12 7 C16 9.5 18 9.5 20 8.5 C22 9.5 24 9.5 28 7 L26 21 L29 34 L11 34 L14 21 Z M20 8.5 L20 34 M17.5 13 L22.5 15 M22.5 13 L17.5 15 M17.5 19 L22.5 21 M22.5 19 L17.5 21 M17.5 25 L22.5 27 M22.5 25 L17.5 27',
  top: 'M15 6 L17.5 6 C18.5 9 21.5 9 22.5 6 L25 6 L33 13 L30.5 16.5 L27.5 14.5 L27.5 33 L12.5 33 L12.5 14.5 L9.5 16.5 L7 13 Z',
  trousers: 'M12 5 L28 5 L28 8 L12 8 Z M12 8 L28 8 L30.5 36 L23 36 L20 16 L17 36 L9.5 36 Z',
  blazer: 'M14 5 L20 12 L26 5 L33 9 L35 30 L31 30 L30 18 L29.5 35 L10.5 35 L10 18 L9 30 L5 30 L7 9 Z M20 12 L20 35 M14 5 L16.5 17 L20 12 M26 5 L23.5 17 L20 12',
  coat: 'M14 3 L20 10 L26 3 L33 7 L35 26 L31 26 L30.5 15 L31 38 L9 38 L9.5 15 L9 26 L5 26 L7 7 Z M20 10 L20 38 M14 3 L16.5 15 L20 10 M26 3 L23.5 15 L20 10',
};

const C = (key, values, extra = {}) => ({ key, values, ...extra });
const darted = (o) => o.skirt === 'pencil' || o.skirt === 'aline';
const hasSleeve = (o) => o.sleeve !== 'none';
const pleatParams = [C('pleats', null, { type: 'params', ids: ['pleatCount', 'pleatDepth'], when: (o) => o.skirt === 'pleated' })];
const backParams = [
  C('backDepthP', null, { type: 'params', ids: ['backDepth'], when: (o) => o.back === 'v' || o.back === 'u' }),
  C('keyholeP', null, { type: 'params', ids: ['keyholeLen'], when: (o) => o.back === 'keyhole' }),
];
const CHOICES = {
  dress: [C('fit', ['fitted', 'regular', 'relaxed']), C('neckline', ['round', 'scoop', 'v']), C('sleeve', ['none', 'short', 'threequarter', 'long']),
    C('sleeveType', ['setin', 'raglan'], { when: hasSleeve }),
    C('back', ['closed', 'v', 'u', 'keyhole']), ...backParams,
    C('skirt', ['pencil', 'aline', 'gathered', 'circle', 'pleated']), ...pleatParams, C('topDarts', ['sideWaist', 'waist', 'shoulder', 'none']),
    C('skirtDarts', ['one', 'two', 'none'], { when: darted }), C('sa', [1.5, 1, 0])],
  top: [C('fit', ['fitted', 'regular', 'relaxed']), C('neckline', ['round', 'scoop', 'v']), C('sleeve', ['none', 'short', 'threequarter', 'long']),
    C('sleeveType', ['setin', 'raglan'], { when: hasSleeve }),
    C('back', ['closed', 'v', 'u', 'keyhole']), ...backParams,
    C('topDarts', ['sideWaist', 'shoulder', 'side', 'none']), C('sa', [1.5, 1, 0])],
  skirt: [C('fit', ['fitted', 'regular', 'relaxed']), C('skirt', ['pencil', 'aline', 'gathered', 'circle', 'pleated']), ...pleatParams,
    C('skirtDarts', ['one', 'two', 'none'], { when: darted }), C('sa', [1.5, 1, 0])],
  corset: [C('fit', ['fitted', 'regular', 'relaxed']), C('corsetNeck', ['sweetheart', 'straight']), C('corsetBack', ['lacing', 'zip']), C('sa', [1.5, 1, 0])],
  trousers: [C('fit', ['fitted', 'regular', 'relaxed']), C('leg', ['straight', 'tapered', 'wide']),
    C('skirtDarts', ['one', 'two', 'none'], { labels: 'trouserDarts' }), C('sa', [1.5, 1, 0])],
  blazer: [C('fit', ['fitted', 'regular', 'relaxed']), C('collar', ['notched', 'collarless']), C('closure', ['single', 'double']),
    C('sleeve', ['long', 'threequarter']), C('topDarts', ['sideWaist', 'shoulder', 'side', 'none']), C('sa', [1.5, 1, 0])],
  coat: [C('fit', ['fitted', 'regular', 'relaxed']), C('collar', ['notched', 'collarless']), C('closure', ['single', 'double']),
    C('topDarts', ['sideWaist', 'shoulder', 'side', 'none']), C('sa', [1.5, 1, 0])],
};
const DEFAULT_OPTS = {
  dress: { fit: 'regular', neckline: 'round', sleeve: 'short', sleeveType: 'setin', back: 'closed', backDepth: 25, keyholeLen: 12, skirt: 'aline', pleatCount: 12, pleatDepth: 3, topDarts: 'sideWaist', skirtDarts: 'one', sa: 1.5 },
  top: { fit: 'regular', neckline: 'round', sleeve: 'short', sleeveType: 'setin', back: 'closed', backDepth: 25, keyholeLen: 12, topDarts: 'sideWaist', sa: 1.5 },
  skirt: { fit: 'regular', skirt: 'aline', skirtDarts: 'one', pleatCount: 12, pleatDepth: 3, sa: 1.5 },
  corset: { fit: 'fitted', corsetNeck: 'sweetheart', corsetBack: 'lacing', sa: 1.5 },
  trousers: { fit: 'regular', leg: 'straight', skirtDarts: 'one', sa: 1.5 },
  blazer: { fit: 'regular', collar: 'notched', closure: 'single', sleeve: 'long', topDarts: 'sideWaist', sa: 1.5 },
  coat: { fit: 'regular', collar: 'notched', closure: 'single', sleeve: 'long', topDarts: 'sideWaist', sa: 1.5 },
};

const PARAMS = {
  pleatCount: { min: 4, max: 48, def: 12, step: 1, unit: false },
  pleatDepth: { min: 1, max: 8, def: 3, step: 0.5, unit: true },
  backDepth: { min: 12, max: 45, def: 25, step: 0.5, unit: true },
  keyholeLen: { min: 5, max: 20, def: 12, step: 0.5, unit: true },
};

const PAPERS = { A4: { w: 21, h: 29.7 }, Letter: { w: 21.59, h: 27.94 } };

// ---------- state ----------
const store = {
  load() { try { return JSON.parse(localStorage.getItem('pinline2') || 'null'); } catch { return null; } },
  legacy() { try { return JSON.parse(localStorage.getItem('pinline') || 'null'); } catch { return null; } },
  save(s) { try { localStorage.setItem('pinline2', JSON.stringify(s)); } catch { /* storage unavailable */ } },
};

function guessLang() {
  const l = (navigator.language || 'en').toLowerCase();
  return l.startsWith('hy') ? 'hy' : l.startsWith('ru') ? 'ru' : 'en';
}

function defaultMeasurements() {
  return Object.fromEntries(Object.entries(FIELD_DEFS).filter(([, f]) => !f.opt).map(([k, f]) => [k, f.def]));
}

function loadState() {
  const s = { lang: guessLang(), garment: 'dress', m: defaultMeasurements(), opts: structuredClone(DEFAULT_OPTS), fabricWidth: 140, paper: 'A4', done: {} };
  const saved = store.load() || (() => { const old = store.legacy(); return old ? { m: old.m } : null; })();
  if (!saved) return s;
  if (LANGS[saved.lang]) s.lang = saved.lang;
  if (GARMENTS.includes(saved.garment)) s.garment = saved.garment;
  for (const [k, f] of Object.entries(FIELD_DEFS)) {
    const v = saved.m?.[k];
    if (typeof v === 'number' && v >= f.min && v <= f.max) s.m[k] = v;
  }
  for (const g of GARMENTS) {
    for (const c of CHOICES[g]) {
      if (c.type === 'params') {
        for (const id of c.ids) {
          const v = saved.opts?.[g]?.[id];
          if (typeof v === 'number' && v >= PARAMS[id].min && v <= PARAMS[id].max) s.opts[g][id] = v;
        }
        continue;
      }
      const v = saved.opts?.[g]?.[c.key];
      if (c.values.some((x) => x === v)) s.opts[g][c.key] = v;
    }
  }
  if ([110, 140, 150].includes(saved.fabricWidth)) s.fabricWidth = saved.fabricWidth;
  if (PAPERS[saved.paper]) s.paper = saved.paper;
  if (saved.done && typeof saved.done === 'object') s.done = saved.done;
  return s;
}

let state = loadState();
let T = LANGS[state.lang];
let F = makeFormat(T);
let current = null;
let zoom = null;
const errors = {};
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const opts = () => state.opts[state.garment];
const isUpper = () => !['skirt', 'trousers'].includes(state.garment);
const hasBust = () => isUpper();

// ---------- static text ----------
function applyStaticText() {
  document.documentElement.lang = T.code;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = T.ui[el.dataset.t]; });
  document.querySelectorAll('[data-t-aria]').forEach((el) => { el.setAttribute('aria-label', T.ui[el.dataset.tAria]); });
  $('#paper option[value="Letter"]').textContent = T.ui.letter;
  document.querySelectorAll('#fabric-width option').forEach((op) => { op.textContent = `${op.value} ${T.unit}`; });
  $('#howto-text').textContent = T.ui.howto;
}

function buildLangSwitch() {
  $('#lang').innerHTML = Object.values(LANGS).map((l) => `<label title="${esc(l.name)}"><input type="radio" name="lang" value="${l.code}"${l.code === state.lang ? ' checked' : ''}><span lang="${l.code}">${esc(l.short)}</span></label>`).join('');
  document.querySelectorAll('input[name="lang"]').forEach((r) => r.addEventListener('change', () => {
    state.lang = r.value; T = LANGS[state.lang]; F = makeFormat(T);
    store.save(state);
    renderAll();
  }));
}

function buildGarmentPicker() {
  $('#garments').innerHTML = GARMENTS.map((g) => `<label class="garment"><input type="radio" name="garment" value="${g}"${g === state.garment ? ' checked' : ''}>
    <span><svg viewBox="0 0 40 40" aria-hidden="true"><path d="${GARMENT_ICON[g]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>
    <b>${esc(T.garments[g][0])}</b><small>${esc(T.garments[g][1])}</small></span></label>`).join('');
  document.querySelectorAll('input[name="garment"]').forEach((r) => r.addEventListener('change', () => {
    state.garment = r.value; zoom = null;
    store.save(state);
    buildForm(); buildChoices(); syncChoices(); update();
  }));
}

// ---------- form ----------
function fieldHTML(id) {
  const def = FIELD_DEFS[id];
  const [label] = T.fields[id];
  return `<div class="field" data-id="${id}">
    <label for="f-${id}">${esc(label)}${def.opt ? ` <span class="opt">${esc(T.optional)}</span>` : ''}</label>
    <div class="input-wrap">
      <input id="f-${id}" name="${id}" type="number" inputmode="decimal" step="0.5" autocomplete="off" aria-describedby="e-${id}">
      <span class="unit">${esc(T.unit)}</span>
    </div>
    <p class="err" id="e-${id}" role="alert"></p>
  </div>`;
}

function buildForm() {
  for (const k of Object.keys(errors)) delete errors[k];
  const g = state.garment;
  $('#fields').innerHTML = GROUPS[g].map((grp) => `<fieldset class="group${grp.arms ? ' arms' : ''}"><legend>${esc(T.groups[grp.key])}${grp.arms ? ' <span class="opt" data-arms-note></span>' : ''}</legend>
    ${grp.ids.map(fieldHTML).join('')}</fieldset>`).join('');
  const adv = $('#advanced');
  adv.hidden = !HAS_ADV[g];
  $('#advanced-summary').textContent = T.advanced;
  $('#fields-advanced').innerHTML = HAS_ADV[g] ? (ADV_FOR[g] || ADV).map(fieldHTML).join('') : '';
  document.querySelectorAll('#measure-form input[type="number"]').forEach((input) => {
    const id = input.name;
    const v = state.m[id];
    input.value = typeof v === 'number' ? String(Math.round(v * 10) / 10) : '';
    input.addEventListener('input', () => { readField(id, input); schedule(); });
    input.addEventListener('focus', () => { $('#howto-text').innerHTML = `<strong>${esc(T.fields[id][0])}.</strong> ${esc(T.fields[id][1])}`; });
  });
  syncArms();
}

function readField(id, input) {
  const def = FIELD_DEFS[id];
  const raw = input.value.trim().replace(',', '.');
  const err = $(`#e-${id}`);
  const label = T.fields[id][0];
  if (raw === '' && def.opt) {
    delete state.m[id]; delete errors[id]; err.textContent = ''; input.removeAttribute('aria-invalid'); return;
  }
  const v = parseFloat(raw);
  if (!isFinite(v) || v < def.min || v > def.max) {
    errors[id] = true;
    err.textContent = raw === '' ? T.errors.required(label) : T.errors.range(F.cm(def.min), F.cm(def.max));
    input.setAttribute('aria-invalid', 'true');
    return;
  }
  delete errors[id];
  err.textContent = '';
  input.removeAttribute('aria-invalid');
  state.m[id] = v;
}

function syncArms() {
  const grp = document.querySelector('.group.arms');
  if (!grp) return;
  const sleeveless = opts().sleeve === 'none';
  grp.classList.toggle('muted', sleeveless);
  $('[data-arms-note]').textContent = sleeveless ? T.notNeeded : '';
}

// ---------- style choices ----------
function buildChoices() {
  const g = state.garment;
  $('#choices').innerHTML = CHOICES[g].map((c) => {
    if (c.type === 'params') {
      return `<fieldset class="choice params" data-key="${c.key}"><div class="param-grid">${c.ids.map((id) => {
        const def = PARAMS[id];
        return `<div class="field" data-id="${id}"><label for="p-${id}">${esc(T.params[id][0])}</label>
          <div class="input-wrap"><input id="p-${id}" name="${id}" type="number" inputmode="decimal" step="${def.step}" min="${def.min}" max="${def.max}" autocomplete="off" aria-describedby="pe-${id}">
          ${def.unit ? `<span class="unit">${esc(T.unit)}</span>` : ''}</div><p class="err" id="pe-${id}" role="alert"></p></div>`;
      }).join('')}</div></fieldset>`;
    }
    const [title, labels] = T.choices[c.labels || c.key];
    return `<fieldset class="choice" data-key="${c.key}"><legend>${esc(title)}</legend><div class="chips">
      ${c.values.map((v) => {
        const [label, sub] = labels[v];
        const icon = ICONS[c.key]?.[v] || '';
        return `<label class="chip${icon ? ' has-icon' : ''}"><input type="radio" name="opt-${c.key}" value="${v}">
          <span>${icon}<b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></label>`;
      }).join('')}
    </div></fieldset>`;
  }).join('');
  for (const c of CHOICES[g]) {
    if (c.type === 'params') {
      for (const id of c.ids) {
        const input = $(`#p-${id}`);
        input.addEventListener('focus', () => { $('#howto-text').innerHTML = `<strong>${esc(T.params[id][0])}.</strong> ${esc(T.params[id][1])}`; });
        input.addEventListener('input', () => {
          const def = PARAMS[id];
          const v = parseFloat(input.value.trim().replace(',', '.'));
          const err = $(`#pe-${id}`);
          const range = def.unit ? T.errors.range(F.cm(def.min), F.cm(def.max)) : T.errors.range(def.min, def.max);
          if (!isFinite(v) || v < def.min || v > def.max) {
            errors[`p:${id}`] = true; err.textContent = range; input.setAttribute('aria-invalid', 'true');
          } else {
            delete errors[`p:${id}`]; err.textContent = ''; input.removeAttribute('aria-invalid');
            opts()[id] = v;
          }
          schedule();
        });
      }
      continue;
    }
    document.querySelectorAll(`input[name="opt-${c.key}"]`).forEach((r) => r.addEventListener('change', () => {
      opts()[c.key] = c.key === 'sa' ? Number(r.value) : r.value;
      const oo = opts();
      if (oo.sleeveType === 'raglan' && oo.sleeve !== 'none' && oo.topDarts === 'shoulder') oo.topDarts = 'sideWaist';
      syncChoices(); syncArms(); schedule(0);
    }));
  }
}

function syncChoices() {
  const o = opts();
  for (const c of CHOICES[state.garment]) {
    const fs = document.querySelector(`.choice[data-key="${c.key}"]`);
    if (fs) fs.hidden = c.when ? !c.when(o) : false;
    if (c.type === 'params') {
      for (const id of c.ids) {
        const input = $(`#p-${id}`);
        if (input && document.activeElement !== input) input.value = String(o[id] ?? PARAMS[id].def);
      }
      continue;
    }
    document.querySelectorAll(`input[name="opt-${c.key}"]`).forEach((r) => {
      r.checked = String(o[c.key]) === r.value;
      if (c.key === 'topDarts') r.closest('.chip').hidden = r.value === 'shoulder' && o.sleeveType === 'raglan' && o.sleeve !== 'none';
    });
  }
}

// ---------- drafting & rendering ----------
let timer = null;
function schedule(delay = 160) {
  clearTimeout(timer);
  timer = setTimeout(update, delay);
}

function optionSummary() {
  const o = opts();
  const parts = [];
  for (const c of CHOICES[state.garment]) {
    if (c.key === 'sa' || c.type === 'params' || (c.when && !c.when(o))) continue;
    const [title, labels] = T.choices[c.labels || c.key];
    let label = labels[o[c.key]][0];
    if (c.key === 'topDarts' || c.key === 'skirtDarts') label = `${title.toLowerCase()}: ${label.toLowerCase()}`;
    parts.push(label);
  }
  if (parts.length) parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.join(', ');
}

function update() {
  const notice = $('#notice');
  const hiddenParam = (k) => k.startsWith('p:') && $(`#p-${k.slice(2)}`)?.closest('.choice')?.hidden;
  const bad = Object.keys(errors).filter((k) => !hiddenParam(k));
  if (bad.length) {
    notice.hidden = false;
    notice.className = 'notice notice-error';
    notice.textContent = T.ui.fixErrors(bad.length);
    return;
  }
  const o = { ...opts() };
  if (state.garment === 'coat') o.sleeve = 'long';
  current = draft(state.garment, { ...state.m }, o);
  current.o = o;
  for (const p of current.pieces) { p.name = T.pieces[p.nameKey]; p.cut = T.cut[p.cutKey]; }
  store.save(state);

  const warn = current.warnings.map((k) => T.warnings[k]);
  if (isUpper() && state.m.waist > state.m.bust + 8) warn.push(T.warnings.waistLarge);
  const pleated = current.pieces.find((x) => x.pleatsTotal);
  if (pleated && pleated.pleatsTotal !== o.pleatCount) warn.push(T.ui.pleatsRounded(pleated.pleatsTotal));
  notice.hidden = !warn.length;
  notice.className = 'notice';
  notice.textContent = warn.join(' ');

  $('#summary').textContent = T.garments[state.garment][0];
  const saText = o.sa ? T.ui.saIncluded(F.cm(o.sa)) : T.ui.saNone;
  $('#summary-sub').textContent = `${optionSummary()}. ${T.ui.summarySub(current.pieces.length, saText)}.`;

  renderMat();
  renderCutting();
  renderSteps();
}

function info() {
  const o = current.o;
  const m = state.m;
  const fl = (id) => `${T.fields[id][0]} ${F.cm(m[id])}`;
  return {
    labels: T.labels,
    title: `${T.garments[state.garment][0]}: ${optionSummary()}`,
    subtitle: (isUpper() ? ['bust', 'waist', 'hip'] : ['waist', 'hip']).map(fl).join(' · '),
    sub: o.sa ? T.labels.saSub(F.cm(o.sa)) : T.labels.saNotIncluded,
  };
}

function tilesFor(sheet) {
  const paper = PAPERS[state.paper];
  const tw = paper.w - 2, th = paper.h - 2.8;
  const cols = Math.ceil(sheet.width / tw), rows = Math.ceil(sheet.height / th);
  const tiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * tw, y = r * th;
    const used = sheet.rects.some((q) => q.x < x + tw && q.x + q.w > x && q.y < y + th && q.y + q.h > y);
    tiles.push({ r, c, x, y, w: tw, h: th, used, name: `${String.fromCharCode(65 + r)}${c + 1}` });
  }
  return { tiles, rows, cols, tw, th };
}

/** Lay the pieces out at the sheet width that prints on the fewest pages. */
function bestSheet(theme) {
  const tw = PAPERS[state.paper].w - 2;
  let best = null;
  for (let k = 3; k <= 10; k++) {
    const sheet = layoutSheet(current.pieces, theme, info(), k * tw);
    const used = tilesFor(sheet).tiles.filter((t) => t.used).length;
    const score = used + Math.abs(Math.log(sheet.width / sheet.height)) * 0.5;
    if (!best || score < best.score) best = { sheet, score };
  }
  return best.sheet;
}

function renderMat() {
  const sheet = bestSheet(THEMES.screen);
  const mat = $('#mat');
  let svg = sheetSVG(sheet, { mat: true });
  const { tiles } = tilesFor(sheet);
  if ($('#show-pages').checked) {
    const overlay = tiles.map((t) => `<g><rect x="${t.x}" y="${t.y}" width="${t.w}" height="${t.h}" fill="${t.used ? 'none' : 'rgba(4,48,105,.35)'}" stroke="#F4C6D4" stroke-width="0.12" stroke-dasharray="0.8 0.5"/><text x="${t.x + 0.8}" y="${t.y + 1.8}" font-size="1.4" fill="#F4C6D4" font-family="Arial, sans-serif" font-weight="700">${t.name}</text></g>`).join('');
    svg = svg.replace('</svg>', `${overlay}</svg>`);
  }
  mat.innerHTML = svg;
  mat.setAttribute('aria-label', T.ui.tabPattern);
  mat.dataset.w = sheet.width;
  mat.dataset.h = sheet.height;
  applyZoom();
  const used = tiles.filter((t) => t.used).length;
  $('#page-count').textContent = T.ui.pageCount(used, state.paper === 'A4' ? 'A4' : T.ui.letter, F.long(sheet.width), F.long(sheet.height));
}

function applyZoom() {
  const mat = $('#mat');
  const svg = mat.querySelector('svg');
  if (!svg) return;
  const w = Number(mat.dataset.w), h = Number(mat.dataset.h);
  let k = zoom;
  if (k == null) {
    const wrap = mat.parentElement;
    const cs = getComputedStyle(wrap);
    const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = Math.max(320, window.innerHeight * 0.74 - 20);
    k = Math.min(availW / w, availH / h);
  }
  if (!(k > 0)) return;
  svg.style.width = `${w * k}px`;
  svg.style.height = `${h * k}px`;
}
function currentPxPerCm() {
  const svg = $('#mat svg');
  return svg ? svg.getBoundingClientRect().width / Number($('#mat').dataset.w) : 8;
}

function renderCutting() {
  const pack = packFabric(current.pieces, state.fabricWidth);
  current.fabric = { ...pack, width: state.fabricWidth };
  $('#fabric-amount').textContent = F.long(pack.total);
  const { cutting, supplies } = buildInstructions(current, current.o, current.fabric, T);
  $('#cut-table').innerHTML = `<thead><tr><th scope="col">${esc(T.ui.colPiece)}</th><th scope="col">${esc(T.ui.colName)}</th><th scope="col">${esc(T.ui.colCut)}</th></tr></thead><tbody>${cutting.map((c) => `<tr><td class="letter">${c.letter}</td><td>${esc(c.name)}</td><td>${esc(c.cut)}</td></tr>`).join('')}</tbody>`;
  $('#supplies').innerHTML = supplies.map((s) => `<li>${s}</li>`).join('');
  $('#fabric-layout').innerHTML = fabricSVG(pack, state.fabricWidth, T.labels);
}

function renderSteps() {
  const { steps } = buildInstructions(current, current.o, current.fabric, T);
  const key = (s) => `${state.garment}:${s.key}`;
  $('#steps').innerHTML = steps.map((s, i) => `<li class="step${state.done[key(s)] ? ' is-done' : ''}">
    <label class="step-check"><input type="checkbox" data-key="${key(s)}" ${state.done[key(s)] ? 'checked' : ''}><span class="sr">${esc(T.ui.markDone(i + 1))}</span></label>
    <div><h3>${esc(s.title)}</h3><p>${s.body}</p>${s.tip ? `<p class="tip">${s.tip}</p>` : ''}</div></li>`).join('');
  const progress = () => {
    const total = steps.length, done = steps.filter((s) => state.done[key(s)]).length;
    $('#steps-progress').textContent = done ? T.ui.stepsDone(done, total) : T.ui.stepsCount(total);
  };
  progress();
  $('#steps').querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.addEventListener('change', () => {
    if (cb.checked) state.done[cb.dataset.key] = true; else delete state.done[cb.dataset.key];
    cb.closest('.step').classList.toggle('is-done', cb.checked);
    store.save(state); progress();
  }));
}

// ---------- print & download ----------
function printPattern() {
  if (!current) return;
  const sheet = bestSheet(THEMES.print);
  const paper = PAPERS[state.paper];
  const { tiles, rows, cols, tw, th } = tilesFor(sheet);
  const used = tiles.filter((t) => t.used);
  const neighbour = (t, dr, dc) => tiles.find((q) => q.r === t.r + dr && q.c === t.c + dc && q.used);
  const pages = used.map((t) => {
    const left = neighbour(t, 0, -1), up = neighbour(t, -1, 0);
    const hint = [left && T.print.tapeLeft(left.name), up && T.print.tapeAbove(up.name)].filter(Boolean).join(', ');
    return `<section class="page"><div class="lbl"><b>${t.name}</b><span>${esc(hint || T.print.startHere)}</span><span>${esc(T.print.printAt)}</span></div>
      <svg xmlns="http://www.w3.org/2000/svg" width="${tw}cm" height="${th}cm" viewBox="${t.x} ${t.y} ${tw} ${th}">
      <rect x="${t.x}" y="${t.y}" width="${tw}" height="${th}" fill="none" stroke="#999" stroke-width="0.02"/>${sheet.body}
      <text x="${t.x + tw / 2}" y="${t.y + th / 2}" font-size="5" text-anchor="middle" fill="#000" fill-opacity="0.06" font-family="Arial, sans-serif" font-weight="700">${t.name}</text></svg></section>`;
  });
  const scale = Math.min(17 / (cols * tw), 17 / (rows * th));
  const map = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * tw * scale}cm" height="${rows * th * scale}cm" viewBox="0 0 ${cols * tw} ${rows * th}">${sheet.body}
    ${tiles.map((t) => `<rect x="${t.x}" y="${t.y}" width="${tw}" height="${th}" fill="${t.used ? 'none' : '#eee'}" stroke="#c43d66" stroke-width="0.25"/><text x="${t.x + tw / 2}" y="${t.y + th / 2}" font-size="${Math.min(tw, th) * (t.used ? 0.28 : 0.14)}" text-anchor="middle" dominant-baseline="middle" fill="${t.used ? '#c43d66' : '#999'}" fill-opacity="0.75" font-family="Arial, sans-serif" font-weight="700">${t.used ? t.name : esc(T.print.skip)}</text>`).join('')}</svg>`;
  const overview = `<section class="page overview"><h1>${esc(T.print.overviewTitle)}</h1><p>${esc(T.garments[state.garment][0])}: ${esc(optionSummary())}.</p>
    <ol><li>${T.print.li1}</li><li>${esc(T.print.li2(used[0]?.name || 'A1'))}</li><li>${esc(T.print.li3)}</li></ol>${map}</section>`;
  const html = `<!doctype html><html lang="${T.code}"><head><meta charset="utf-8"><title>Rubikon</title><style>
    @page { size: ${paper.w}cm ${paper.h}cm; margin: 0; }
    * { box-sizing: border-box; } body { margin: 0; font-family: Arial, 'Noto Sans Armenian', sans-serif; color: #000; }
    .page { width: ${paper.w}cm; height: ${paper.h}cm; padding: 1cm; page-break-after: always; break-after: page; overflow: hidden; }
    .page:last-child { page-break-after: auto; break-after: auto; }
    .page svg { display: block; }
    .lbl { display: flex; gap: 0.6cm; align-items: baseline; height: 0.8cm; font-size: 9pt; }
    .lbl b { font-size: 14pt; color: #c43d66; } .lbl span:last-child { margin-left: auto; color: #777; }
    .overview h1 { font-size: 20pt; margin: 0 0 0.3cm; } .overview p, .overview li { font-size: 11pt; line-height: 1.45; } .overview ol { padding-left: 1.2em; margin: 0 0 0.6cm; }
  </style></head><body>${overview}${pages.join('')}</body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 2000);
  }, 300);
}

function downloadSVG() {
  if (!current) return;
  const sheet = bestSheet(THEMES.print);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${sheetSVG(sheet, { trueScale: true })}`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = url; a.download = `rubikon-${state.garment}.svg`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- tabs ----------
function initTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    }
    if (tab.id === 'tab-pattern') applyZoom();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
}

// ---------- boot ----------
function renderAll() {
  applyStaticText();
  buildLangSwitch();
  buildGarmentPicker();
  buildForm();
  buildChoices();
  syncChoices();
  $('#fabric-width').value = String(state.fabricWidth);
  $('#paper').value = state.paper;
  update();
}

initTabs();
$('#zoom-in').addEventListener('click', () => { zoom = currentPxPerCm() * 1.35; applyZoom(); });
$('#zoom-out').addEventListener('click', () => { zoom = Math.max(1.5, currentPxPerCm() / 1.35); applyZoom(); });
$('#zoom-fit').addEventListener('click', () => { zoom = null; applyZoom(); });
$('#show-pages').addEventListener('change', renderMat);
$('#paper').addEventListener('change', (e) => { state.paper = e.target.value; store.save(state); renderMat(); });
$('#fabric-width').addEventListener('change', (e) => { state.fabricWidth = Number(e.target.value); store.save(state); renderCutting(); renderSteps(); });
$('#print-pattern').addEventListener('click', printPattern);
$('#download-svg').addEventListener('click', downloadSVG);
$('#print-steps').addEventListener('click', () => window.print());
$('#reset').addEventListener('click', () => { state.m = defaultMeasurements(); buildForm(); schedule(0); });
window.addEventListener('resize', () => { if (zoom == null) applyZoom(); });
renderAll();
