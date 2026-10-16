// Turns drafted pieces into SVG (all coordinates in cm) and packs them onto sheets and fabric.
import { P, add, sub, mul, lerp, offsetOutline, signedArea, outward, pointAt, bbox, join, norm, polyLen } from './geometry.js';

export const THEMES = {
  screen: { fill: '#FFFFFF', cut: '#043069', stitch: '#C43D66', text: '#043069', soft: '#6E7FA0', grain: '#043069', outside: '#E3EAF4' },
  print:  { fill: 'none',    cut: '#000000', stitch: '#555555', text: '#000000', soft: '#777777', grain: '#000000', outside: '#000000' },
};

const f = (n) => (Math.round(n * 1000) / 1000).toString();
const pts2d = (pts) => pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' ');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FONT = `font-family="'Onest','Noto Sans Armenian',Arial,sans-serif"`;

/** Stitch outline, cutting outline, orientation and bounds for a piece (cached). */
export function geometryOf(piece) {
  if (piece._geo) return piece._geo;
  const stitch = join(...piece.edges.map((e) => e.pts));
  const cut = offsetOutline(piece.edges);
  const area = signedArea(stitch);
  const box = bbox(cut.concat(stitch));
  // leave room for the fold bracket outside a fold edge
  if (piece.onFold) {
    const fold = piece.edges.find((e) => e.kind === 'fold');
    const a = fold.pts[0], b = fold.pts[fold.pts.length - 1];
    if (Math.abs(a.x - b.x) < 0.01) { box.x -= 2.2; box.w += 2.2; } else { box.y -= 2.2; box.h += 2.2; }
  }
  piece._geo = { stitch, cut, area, box };
  return piece._geo;
}

function arrowHead(tip, dir, size) {
  const d = norm(dir), n = P(-d.y, d.x);
  const back = sub(tip, mul(d, size));
  return [add(back, mul(n, size * 0.45)), tip, sub(back, mul(n, size * 0.45))];
}

/** Rotation that keeps text readable (never upside down). */
function readableAngle(dir) {
  let ang = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
  if (ang > 90) ang -= 180;
  if (ang < -90) ang += 180;
  return ang;
}

function findEdge(piece, ref) {
  return typeof ref === 'number' ? piece.edges[ref] : piece.edges.find((e) => e.name === ref);
}

/** One piece as an SVG <g>, in its own drafting coordinates. `L` holds translated labels. */
export function renderPiece(piece, t, info = {}) {
  const L = info.labels || {};
  const g = geometryOf(piece);
  const out = [];
  out.push(`<polygon points="${pts2d(g.cut)}" fill="${t.fill}" stroke="${t.cut}" stroke-width="0.06" stroke-linejoin="round"/>`);
  if (piece.edges.some((e) => e.sa > 0)) {
    out.push(`<polygon points="${pts2d(g.stitch)}" fill="none" stroke="${t.stitch}" stroke-width="0.035" stroke-dasharray="0.35 0.2"/>`);
  }

  // Interior reference lines (bicep, hip, knee, roll line, fold line)
  for (const l of piece.lines || []) {
    out.push(l.style === 'solid'
      ? `<polyline points="${pts2d(l.pts)}" fill="none" stroke="${t.cut}" stroke-width="0.035"/>`
      : `<polyline points="${pts2d(l.pts)}" fill="none" stroke="${t.soft}" stroke-width="0.03" stroke-dasharray="1 0.3 0.15 0.3"/>`);
    if (!l.labelKey) continue;
    const a = l.pts[0], b = l.pts[l.pts.length - 1];
    const mid = lerp(a, b, l.labelAt ?? 0.5);
    const ang = readableAngle(sub(b, a));
    out.push(`<text transform="translate(${f(mid.x)} ${f(mid.y)}) rotate(${f(ang)})" y="-0.3" font-size="0.62" text-anchor="middle" fill="${t.soft}" ${FONT}>${esc(L[l.labelKey])}</text>`);
  }

  // Pleat direction arrows
  for (const ar of piece.arrows || []) {
    out.push(`<line x1="${f(ar.a.x)}" y1="${f(ar.a.y)}" x2="${f(ar.b.x)}" y2="${f(ar.b.y)}" stroke="${t.stitch}" stroke-width="0.04"/>`);
    out.push(`<polygon points="${pts2d(arrowHead(ar.b, sub(ar.b, ar.a), 0.45))}" fill="${t.stitch}"/>`);
  }

  // Darts
  for (const d of piece.darts) {
    if (d.type === 'diamond') {
      out.push(`<polygon points="${pts2d([d.top, d.l, d.bottom, d.r])}" fill="none" stroke="${t.cut}" stroke-width="0.04"/>`);
      out.push(`<line x1="${f(d.top.x)}" y1="${f(d.top.y)}" x2="${f(d.bottom.x)}" y2="${f(d.bottom.y)}" stroke="${t.soft}" stroke-width="0.025" stroke-dasharray="0.3 0.2"/>`);
      for (const q of [d.top, d.bottom]) out.push(`<circle cx="${f(q.x)}" cy="${f(q.y)}" r="0.22" fill="none" stroke="${t.cut}" stroke-width="0.04"/>`);
      continue;
    }
    const mid = lerp(d.a, d.b, 0.5);
    out.push(`<polyline points="${pts2d([d.a, d.tip, d.b])}" fill="none" stroke="${t.cut}" stroke-width="0.04"/>`);
    out.push(`<line x1="${f(mid.x)}" y1="${f(mid.y)}" x2="${f(d.tip.x)}" y2="${f(d.tip.y)}" stroke="${t.soft}" stroke-width="0.025" stroke-dasharray="0.3 0.2"/>`);
    out.push(`<circle cx="${f(d.tip.x)}" cy="${f(d.tip.y)}" r="0.22" fill="none" stroke="${t.cut}" stroke-width="0.04"/>`);
    out.push(`<circle cx="${f(d.tip.x)}" cy="${f(d.tip.y)}" r="0.06" fill="${t.cut}"/>`);
  }

  // Notches: short cuts into the seam allowance
  const notches = (piece.notches || []).slice();
  if (piece.slit) notches.push({ edge: 0, at: -piece.slit, count: 1, labelKey: 'slit' });
  for (const n of notches) {
    const e = findEdge(piece, n.edge);
    if (!e) continue;
    const { p, dir } = pointAt(e.pts, n.at);
    const nrm = outward(dir, g.area);
    const offs = n.count === 2 ? [-0.3, 0.3] : [0];
    for (const o of offs) {
      const base = add(p, mul(dir, o));
      const a = add(base, mul(nrm, e.sa)), b = add(base, mul(nrm, e.sa - 0.7));
      out.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${t.cut}" stroke-width="0.06"/>`);
    }
    if (n.labelKey) {
      const lp = add(p, mul(nrm, -1.2));
      out.push(`<text x="${f(lp.x)}" y="${f(lp.y)}" font-size="0.6" fill="${t.text}" ${FONT}>${esc(L[n.labelKey])}</text>`);
    }
  }

  // Marks
  let buttonLabelled = false;
  piece._eyeletLabelled = false;
  for (const mk of piece.marks || []) {
    const { x, y } = mk.p;
    if (mk.type === 'apex') {
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="0.5" fill="none" stroke="${t.stitch}" stroke-width="0.04"/>`);
      out.push(`<path d="M${f(x - 0.8)} ${f(y)}H${f(x + 0.8)}M${f(x)} ${f(y - 0.8)}V${f(y + 0.8)}" stroke="${t.stitch}" stroke-width="0.04"/>`);
      out.push(`<text x="${f(x + 0.9)}" y="${f(y - 0.6)}" font-size="0.6" fill="${t.text}" ${FONT}>${esc(L.bustPoint)}</text>`);
    } else if (mk.type === 'button') {
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="0.9" fill="none" stroke="${t.cut}" stroke-width="0.045"/>`);
      out.push(`<path d="M${f(x - 0.35)} ${f(y)}H${f(x + 0.35)}M${f(x)} ${f(y - 0.35)}V${f(y + 0.35)}" stroke="${t.cut}" stroke-width="0.04"/>`);
      if (!buttonLabelled) {
        out.push(`<text x="${f(x + 1.3)}" y="${f(y + 0.25)}" font-size="0.6" fill="${t.text}" ${FONT}>${esc(L.button)}</text>`);
        buttonLabelled = true;
      }
    } else if (mk.type === 'eyelet') {
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="0.35" fill="none" stroke="${t.cut}" stroke-width="0.05"/>`);
      if (!piece._eyeletLabelled) {
        out.push(`<text x="${f(x + 0.8)}" y="${f(y + 0.2)}" font-size="0.55" fill="${t.text}" ${FONT}>${esc(L.eyelet)}</text>`);
        piece._eyeletLabelled = true;
      }
    } else if (mk.type === 'dot') {
      out.push(`<circle cx="${f(x)}" cy="${f(y)}" r="0.3" fill="${t.stitch}"/>`);
    }
  }

  // Fold bracket
  const fold = piece.edges.find((e) => e.kind === 'fold');
  if (fold) {
    const a = fold.pts[0], b = fold.pts[fold.pts.length - 1];
    const dir = norm(sub(b, a));
    const nrm = outward(dir, g.area);
    const len = polyLen(fold.pts);
    const inset = Math.min(4, len * 0.15);
    const s = add(a, mul(dir, inset)), e2 = add(a, mul(dir, len - inset));
    const so = add(s, mul(nrm, 1.6)), eo = add(e2, mul(nrm, 1.6));
    out.push(`<polyline points="${pts2d([s, so, eo, e2])}" fill="none" stroke="${t.outside}" stroke-width="0.045"/>`);
    out.push(`<polygon points="${pts2d(arrowHead(s, sub(s, so), 0.5))}" fill="${t.outside}"/>`);
    out.push(`<polygon points="${pts2d(arrowHead(e2, sub(e2, eo), 0.5))}" fill="${t.outside}"/>`);
    const mid = lerp(so, eo, 0.5);
    const tx = add(mid, mul(nrm, 0.45));
    const fs = Math.min(0.7, (len - 2 * inset) / Math.max(8, String(L.placeOnFold || '').length * 0.42));
    out.push(`<text transform="translate(${f(tx.x)} ${f(tx.y)}) rotate(${f(readableAngle(dir))})" font-size="${f(fs)}" text-anchor="middle" dominant-baseline="middle" fill="${t.outside}" ${FONT}>${esc(L.placeOnFold)}</text>`);
  }

  // Grainline
  if (piece.grain) {
    const { a, b } = piece.grain;
    out.push(`<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}" stroke="${t.grain}" stroke-width="0.045"/>`);
    out.push(`<polygon points="${pts2d(arrowHead(a, sub(a, b), 0.6))}" fill="${t.grain}"/>`);
    out.push(`<polygon points="${pts2d(arrowHead(b, sub(b, a), 0.6))}" fill="${t.grain}"/>`);
    const mid = lerp(a, b, 0.3);
    const dir = sub(b, a);
    const vertical = Math.abs(dir.y) > Math.abs(dir.x);
    const ang = vertical ? -90 : readableAngle(dir);
    const tx = vertical ? P(mid.x - 0.35, mid.y) : P(mid.x, mid.y - 0.35);
    out.push(`<text transform="translate(${f(tx.x)} ${f(tx.y)}) rotate(${f(ang)})" font-size="0.6" text-anchor="middle" fill="${t.text}" ${FONT}>${esc(L.grainline)}</text>`);
  }

  // Gathering instruction
  if (piece.gather) {
    const { from, to } = piece.gather;
    out.push(`<text x="${f((from.x + to.x) / 2)}" y="${f(from.y + 1.6)}" font-size="0.7" text-anchor="middle" fill="${t.text}" ${FONT}>${esc(L.gather)}</text>`);
  }

  // Title block
  const lp = piece.labelAt || labelPoint(piece, g);
  const k = piece.small ? 0.62 : 1;
  out.push(
    `<text x="${f(lp.x)}" y="${f(lp.y)}" font-size="${f(3.2 * k)}" font-weight="700" text-anchor="middle" fill="${t.stitch}" font-family="Lora, Georgia, serif">${piece.letter}</text>`,
    `<text x="${f(lp.x)}" y="${f(lp.y + 1.6 * k)}" font-size="${f(1.05 * k)}" font-weight="700" text-anchor="middle" fill="${t.text}" ${FONT}>${esc(piece.name)}</text>`,
    `<text x="${f(lp.x)}" y="${f(lp.y + 2.6 * k)}" font-size="${f(0.75 * k)}" text-anchor="middle" fill="${t.text}" ${FONT}>${esc(piece.cut)}</text>`,
  );
  if (info.sub) out.push(`<text x="${f(lp.x)}" y="${f(lp.y + 3.5 * k)}" font-size="${f(0.6 * k)}" text-anchor="middle" fill="${t.soft}" ${FONT}>${esc(info.sub)}</text>`);
  return out.join('');
}

function labelPoint(piece, g) {
  const s = bbox(g.stitch);
  return P(s.x + s.w * 0.5, s.y + s.h * 0.42);
}

/** A 10 cm test square plus a key, drawn as its own block (fits inside one printed page). */
function keyBlock(t, info) {
  const s = 10;
  const L = info.labels || {};
  const tx = (x, y, size, fill, text, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${FONT} ${extra}>${esc(text)}</text>`;
  return {
    w: 16, h: 17.4,
    svg: [
      t.fill !== 'none' ? `<rect x="-0.8" y="-0.8" width="17.6" height="19" rx="0.4" fill="${t.fill}"/>` : '',
      `<rect x="0" y="0" width="${s}" height="${s}" fill="none" stroke="${t.cut}" stroke-width="0.06"/>`,
      tx(s / 2, s / 2 - 0.3, 1, t.text, L.tenCm, 'text-anchor="middle"'),
      tx(s / 2, s / 2 + 0.8, 0.5, t.soft, L.measure, 'text-anchor="middle"'),
      tx(0, s + 1.2, 0.75, t.text, L.patternTitle, 'font-weight="700"'),
      tx(0, s + 2.1, 0.45, t.text, info.title || ''),
      tx(0, s + 2.9, 0.45, t.soft, info.subtitle || ''),
      `<line x1="0" y1="${s + 4.2}" x2="2.4" y2="${s + 4.2}" stroke="${t.cut}" stroke-width="0.06"/>`,
      tx(3, s + 4.4, 0.5, t.text, L.cutLine),
      `<line x1="0" y1="${s + 5.3}" x2="2.4" y2="${s + 5.3}" stroke="${t.stitch}" stroke-width="0.035" stroke-dasharray="0.35 0.2"/>`,
      tx(3, s + 5.5, 0.5, t.text, L.stitchLine),
      `<line x1="1.2" y1="${s + 5.95}" x2="1.2" y2="${s + 6.85}" stroke="${t.cut}" stroke-width="0.06"/>`,
      tx(3, s + 6.6, 0.5, t.text, L.notch),
    ].join(''),
  };
}

/** Pack pieces onto a sheet of the given width with simple shelf packing. */
export function layoutSheet(pieces, t, info = {}, sheetW = 100) {
  const gap = 2.5, margin = 1.5;
  const items = pieces.map((p) => ({ piece: p, box: geometryOf(p).box }));
  const maxW = Math.max(...items.map((i) => i.box.w));
  const width = Math.max(sheetW, maxW + margin * 2);
  items.sort((a, b) => b.box.h - a.box.h);
  const key = keyBlock(t, info);
  const placed = [];
  let x = margin + key.w + gap, y = margin, shelfH = key.h;
  const keyPos = { x: margin, y: margin };
  for (const it of items) {
    if (x + it.box.w > width - margin) { y += shelfH + gap; x = margin; shelfH = 0; }
    placed.push({ ...it, dx: x - it.box.x, dy: y - it.box.y, rect: { x, y, w: it.box.w, h: it.box.h } });
    x += it.box.w + gap;
    shelfH = Math.max(shelfH, it.box.h);
  }
  const height = y + shelfH + margin;
  const body = [
    `<g transform="translate(${keyPos.x} ${keyPos.y})">${key.svg}</g>`,
    ...placed.map((pl) => `<g transform="translate(${f(pl.dx)} ${f(pl.dy)})">${renderPiece(pl.piece, t, info)}</g>`),
  ].join('');
  const rects = [{ x: keyPos.x, y: keyPos.y, w: key.w, h: key.h }, ...placed.map((p) => p.rect)];
  return { width, height, body, rects };
}

export function sheetSVG(sheet, { mat = false, trueScale = false } = {}) {
  const { width: w, height: h } = sheet;
  const size = trueScale ? `width="${f(w)}cm" height="${f(h)}cm"` : '';
  const bg = mat
    ? `<defs><pattern id="g1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#2A5390" stroke-width="0.02"/></pattern><pattern id="g5" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0H0V5" fill="none" stroke="#5C80B8" stroke-width="0.05"/></pattern></defs><rect width="${f(w)}" height="${f(h)}" fill="#043069"/><rect width="${f(w)}" height="${f(h)}" fill="url(#g1)"/><rect width="${f(w)}" height="${f(h)}" fill="url(#g5)"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" ${size}>${bg}${sheet.body}</svg>`;
}

/**
 * Rough fabric layout on fabric folded lengthwise (selvedges together).
 * Every piece is placed once; the double layer gives mirror pairs and fold pieces.
 */
export function packFabric(pieces, fabricWidth) {
  const halfW = fabricWidth / 2 - 1;
  const gap = 1.5;
  const items = pieces.map((p) => ({ piece: p, box: geometryOf(p).box }));
  const fits = items.filter((i) => i.box.w <= halfW);
  const oversize = items.filter((i) => i.box.w > halfW);
  const foldFirst = fits.filter((i) => i.piece.onFold).sort((a, b) => b.box.h - a.box.h);
  const others = fits.filter((i) => !i.piece.onFold).sort((a, b) => b.box.h - a.box.h);
  const shelves = [];
  const placed = [];
  let y = 0;
  const newShelf = (h) => { const s = { y, h, x: 0 }; shelves.push(s); y += h + gap; return s; };
  for (const it of foldFirst) {
    const s = newShelf(it.box.h);
    placed.push({ ...it, x: 0, y: s.y }); s.x = it.box.w + gap;
  }
  for (const it of others) {
    let s = shelves.find((sh) => sh.x + it.box.w <= halfW && it.box.h <= sh.h + 0.01);
    if (!s) s = newShelf(it.box.h);
    placed.push({ ...it, x: s.x, y: s.y }); s.x += it.box.w + gap;
  }
  let length = y;
  for (const it of oversize) {
    placed.push({ ...it, x: 0, y: length, oversize: true });
    length += it.box.h * 2 + gap;
  }
  const withAllowance = Math.ceil((length * 1.1 + 10) / 10) * 10;
  return { halfW, placed, length, total: withAllowance, oversize: oversize.map((o) => o.piece) };
}

export function fabricSVG(pack, fabricWidth, labels = {}) {
  const W = fabricWidth / 2, L = Math.max(pack.length, 20);
  const t = THEMES.screen;
  const parts = [`<rect x="0" y="0" width="${f(W)}" height="${f(L)}" fill="#E3EAF4" stroke="#043069" stroke-width="0.4"/>`];
  parts.push(`<line x1="0" y1="0" x2="0" y2="${f(L)}" stroke="#043069" stroke-width="0.8" stroke-dasharray="3 2"/>`);
  for (const pl of pack.placed) {
    const g = geometryOf(pl.piece);
    const dx = pl.x - g.box.x, dy = pl.y - g.box.y;
    parts.push(`<g transform="translate(${f(dx)} ${f(dy)})"><polygon points="${pts2d(g.cut)}" fill="${pl.oversize ? '#FBE3EA' : t.fill}" stroke="${t.cut}" stroke-width="0.35"/></g>`);
    const c = P(pl.x + g.box.w / 2, pl.y + g.box.h / 2);
    parts.push(`<text x="${f(c.x)}" y="${f(c.y)}" font-size="${f(Math.min(9, g.box.w * 0.35))}" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="${t.stitch}" font-family="Lora, Georgia, serif">${pl.piece.letter}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 ${f(W + 12)} ${f(L + 8)}" role="img" aria-label="${esc(labels.layoutAria)}">${parts.join('')}<text x="-2" y="${f(L / 2)}" transform="rotate(-90 -2 ${f(L / 2)})" font-size="2.6" text-anchor="middle" fill="#043069" ${FONT}>${esc(labels.fold)}</text><text x="${f(W + 3)}" y="${f(L / 2)}" transform="rotate(90 ${f(W + 3)} ${f(L / 2)})" font-size="2.6" text-anchor="middle" fill="#043069" ${FONT}>${esc(labels.selvedges)}</text></svg>`;
}
