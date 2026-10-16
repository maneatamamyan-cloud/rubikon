// Small 2D geometry toolkit. All units are centimetres; y grows downward (SVG space).

export const P = (x, y) => ({ x, y });
export const add = (a, b) => P(a.x + b.x, a.y + b.y);
export const sub = (a, b) => P(a.x - b.x, a.y - b.y);
export const mul = (a, k) => P(a.x * k, a.y * k);
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => len(sub(a, b));
export const norm = (a) => { const l = len(a) || 1; return P(a.x / l, a.y / l); };
export const lerp = (a, b, t) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const along = (a, b, d) => add(a, mul(norm(sub(b, a)), d));

/** Sample a cubic Bézier into a polyline. */
export function cubic(p0, c1, c2, p3, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
    pts.push(P(a * p0.x + b * c1.x + c * c2.x + d * p3.x, a * p0.y + b * c1.y + c * c2.y + d * p3.y));
  }
  return pts;
}

export const line = (a, b) => [a, b];

/** Arc around centre c, radius r, from angle a0 to a1 (radians). */
export function arc(c, r, a0, a1, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * (i / n);
    pts.push(P(c.x + r * Math.cos(t), c.y + r * Math.sin(t)));
  }
  return pts;
}

/** Join polylines end to end, dropping duplicated joint points. */
export function join(...parts) {
  const out = [];
  for (const p of parts) {
    for (const q of p) {
      const last = out[out.length - 1];
      if (!last || dist(last, q) > 1e-6) out.push(q);
    }
  }
  return out;
}

export const reverse = (pts) => pts.slice().reverse();

export function polyLen(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** Point and unit tangent at arc-length d along a polyline (negative d counts from the end). */
export function pointAt(pts, d) {
  const total = polyLen(pts);
  if (d < 0) d = total + d;
  d = clamp(d, 0, total);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (acc + seg >= d || i === pts.length - 1) {
      const t = seg ? (d - acc) / seg : 0;
      return { p: lerp(pts[i - 1], pts[i], clamp(t, 0, 1)), dir: norm(sub(pts[i], pts[i - 1])) };
    }
    acc += seg;
  }
  return { p: pts[0], dir: P(1, 0) };
}

export function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** Outward unit normal for direction `dir` on a polygon of the given orientation. */
export function outward(dir, area) {
  const n = P(dir.y, -dir.x);
  return area > 0 ? n : mul(n, -1);
}

function intersect(a1, a2, b1, b2) {
  const d1 = sub(a2, a1), d2 = sub(b2, b1);
  const cr = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(cr) < 1e-9) return null;
  const t = ((b1.x - a1.x) * d2.y - (b1.y - a1.y) * d2.x) / cr;
  return add(a1, mul(d1, t));
}

/**
 * Offset a closed outline made of edges, each with its own allowance (edge.sa).
 * Returns the cutting line as a polygon. Corners are mitred where allowances meet,
 * which gives the squared-off ends a seamstress expects.
 */
export function offsetOutline(edges) {
  const segs = [];
  for (const e of edges) {
    for (let i = 1; i < e.pts.length; i++) {
      const a = e.pts[i - 1], b = e.pts[i];
      if (dist(a, b) > 1e-6) segs.push({ a, b, sa: e.sa });
    }
  }
  const outline = segs.map((s) => s.a);
  const area = signedArea(outline);
  const off = segs.map((s) => {
    const n = outward(norm(sub(s.b, s.a)), area);
    return { a: add(s.a, mul(n, s.sa)), b: add(s.b, mul(n, s.sa)), sa: s.sa, v: s.b };
  });
  const out = [];
  for (let i = 0; i < off.length; i++) {
    const s = off[i], t = off[(i + 1) % off.length];
    const x = intersect(s.a, s.b, t.a, t.b);
    const limit = Math.max(s.sa, t.sa) * 4 + 0.3;
    if (x && dist(x, s.v) <= limit) out.push(x);
    else { out.push(s.b); out.push(t.a); }
  }
  return out;
}

export function bbox(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Rotate point p around centre c by angle a (radians). */
export function rotate(p, c, a) {
  const s = Math.sin(a), k = Math.cos(a);
  const dx = p.x - c.x, dy = p.y - c.y;
  return P(c.x + dx * k - dy * s, c.y + dx * s + dy * k);
}
export const rotateAll = (pts, c, a) => pts.map((p) => rotate(p, c, a));

/** Signed angle that turns direction (a - c) onto direction (b - c). */
export function angleBetween(c, a, b) {
  const a1 = Math.atan2(a.y - c.y, a.x - c.x), a2 = Math.atan2(b.y - c.y, b.x - c.x);
  let d = a2 - a1;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Cut a polyline that runs downward at height y (keeps the part above y). */
export function cutAtY(pts, y) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (b.y >= y) {
      const t = (y - a.y) / ((b.y - a.y) || 1);
      out.push(lerp(a, b, clamp(t, 0, 1)));
      return out;
    }
    out.push(b);
  }
  return out;
}
