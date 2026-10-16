// Pattern drafting for every garment. All values in centimetres; y grows downward.
import {
  P, add, sub, mul, norm, dist, clamp, along, lerp, cubic, line, arc, join, reverse, polyLen,
  rotate, rotateAll, angleBetween, cutAtY,
} from './geometry.js';

export const GARMENTS = ['dress', 'skirt', 'top', 'corset', 'trousers', 'blazer', 'coat'];

const FIT = {
  fitted:  { bust: 5,  waist: 3, hip: 4, arm: 5, scye: 0, cap: 1.5 },
  regular: { bust: 8,  waist: 5, hip: 6, arm: 7, scye: 1, cap: 2 },
  relaxed: { bust: 12, waist: 9, hip: 9, arm: 9, scye: 2, cap: 1 },
};
// Extra room for garments worn over other clothes.
const KIND = {
  dress:  {},
  top:    {},
  blazer: { bust: 4, waist: 4, hip: 4, arm: 4, scye: 1.5, cap: 1.5, shoulder: 0.5, neck: 0.5 },
  coat:   { bust: 9, waist: 9, hip: 8, arm: 8, scye: 3, cap: 1.5, shoulder: 1, neck: 1 },
};
function easeFor(kind, fit) {
  const a = FIT[fit] || FIT.regular, b = KIND[kind] || {};
  const o = {};
  for (const k of ['bust', 'waist', 'hip', 'arm', 'scye', 'cap']) o[k] = a[k] + (b[k] || 0);
  o.shoulder = b.shoulder || 0;
  o.neck = b.neck || 0;
  return o;
}

const ZIPS = [18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
const zipFor = (len) => ZIPS.find((z) => z >= len - 2) || 70;

const edge = (pts, sa, kind, name) => ({ pts, sa, kind, name });

/** Split waist suppression between side seam and a dart. */
function shapeWaist(excess, maxDart, dartShare) {
  if (excess <= 0) return { side: excess, dart: 0 };
  let dart = clamp(excess * dartShare, 0, maxDart);
  let side = excess - dart;
  if (side > 4) { dart = Math.min(maxDart + 1, dart + side - 4); side = excess - dart; }
  return { side, dart };
}

/** Double-pointed (fish-eye) dart for garments without a waist seam. */
function diamond(x, top, waist, bottom, width) {
  return { type: 'diamond', top: P(x, top), bottom: P(x, Math.max(bottom, waist + 3)), l: P(x - width / 2, waist), r: P(x + width / 2, waist) };
}

/** Side seam below the waist: waist point → hip → hem. */
function sideBelow(ws, hipX, hipY, hemY, flare) {
  const toHip = cubic(ws, P(ws.x + (hipX - ws.x) * 0.6, ws.y + (hipY - ws.y) * 0.3), P(hipX, ws.y + (hipY - ws.y) * 0.6), P(hipX, hipY));
  if (hemY <= hipY) return cutAtY(toHip, hemY);
  return join(toHip, line(P(hipX, hipY), P(hipX + flare, hemY)));
}

export function draft(garment, m, o) {
  const warnings = [];
  const warn = (key) => { if (!warnings.includes(key)) warnings.push(key); };
  let res;
  if (garment === 'skirt') res = skirtGarment(m, o, warn);
  else if (garment === 'trousers') res = trousersGarment(m, o, warn);
  else if (garment === 'corset') res = corsetGarment(m, o, warn);
  else res = upperGarment(garment, m, o, warn);
  res.pieces.forEach((p, i) => { p.letter = String.fromCharCode(65 + i); });
  res.warnings = warnings;
  res.garment = garment;
  return res;
}

// =====================================================================
// Dresses, tops, blazers and coats
// =====================================================================
function upperGarment(kind, m, o, warn) {
  const body = torso(kind, m, o, warn);
  const pieces = [body.front, body.back];
  const meta = { ...body.meta };
  if (body.raglanSleeves) {
    pieces.push(...body.raglanSleeves);
  } else if (o.sleeve !== 'none') {
    const s = sleevePiece(kind, m, o, body.meta, warn);
    pieces.push(s.piece);
    meta.sleeve = s.info;
  }
  if (kind === 'dress') {
    const e = easeFor('dress', o.fit);
    let L = m.dressLen - (m.backLen + 2);
    if (L < m.waistHip + 5) { L = m.waistHip + 5; warn('skirtShort'); }
    const sk = skirtPieces({
      shape: o.skirt, dartOpt: o.skirtDarts, H: m.hip + e.hip, L, wh: m.waistHip, SA: o.sa,
      targetF: meta.frontWaistSeam, targetB: meta.backWaistSeam, dxF: meta.fdx, dxB: meta.bdx, waist: 'bodice', warn,
      pleats: { n: o.pleatCount, d: o.pleatDepth },
    });
    pieces.push(...sk);
    meta.skirtLen = L;
  }
  pieces.push(...body.extra);
  return { pieces, meta };
}

function torso(kind, m, o, warn) {
  const jacket = kind === 'blazer' || kind === 'coat';
  const continuous = kind !== 'dress';
  const e = easeFor(kind, o.fit);
  const SA = o.sa;
  const HEM = SA === 0 ? 0 : jacket ? 4 : 2.5;
  const sleeveless = o.sleeve === 'none';
  const raglan = !jacket && o.sleeveType === 'raglan' && o.sleeve !== 'none';
  const dartOpt = raglan && o.topDarts === 'shoulder' ? 'sideWaist' : o.topDarts;
  const waistDarts = ['sideWaist', 'waist', 'shoulder'].includes(dartOpt);
  const bustDart = dartOpt !== 'none';

  const B = m.bust + e.bust, W = m.waist + e.waist, H = m.hip + e.hip;
  let backW = B / 4 - 0.5, frontW = B / 4 + 0.5;
  if (m.upperBust) {
    if (m.upperBust > m.bust) warn('upperBust');
    else { backW = (m.upperBust + e.bust) / 4 - 0.5; frontW = B / 2 - backW; }
  }
  const nw = m.neck / 6 + 0.4 + e.neck;
  const BWL = m.backLen;
  let scyeY = m.bust / 8 + 10.5 + e.scye - (sleeveless ? 1 : 0);
  if (scyeY > BWL - 12) { scyeY = BWL - 12; warn('armhole'); }
  const shoulderHalf = m.shoulder / 2 - (sleeveless ? 1.5 : 0) + e.shoulder;
  const acrossBack = (m.acrossBack || m.bust * 0.38) / 2 + 0.6 + e.shoulder * 0.5;
  const acrossChest = (m.acrossChest || m.bust * 0.36) / 2 + 0.4 + e.shoulder * 0.5;
  const neckline = jacket ? 'round' : o.neckline;
  const backOpt = jacket ? 'closed' : (o.back || 'closed');
  const openBack = backOpt === 'v' || backOpt === 'u';
  // An open back needs a slightly wider neckline at the shoulder so the straps stay put.
  const widen = jacket ? 0 : Math.max({ round: 0, scoop: 2.5, v: 1.5 }[neckline] ?? 0, openBack ? 2 : 0);

  let hemY = null;
  if (continuous) {
    const len = kind === 'top' ? m.topLen : kind === 'blazer' ? m.jacketLen : m.coatLen;
    hemY = -2 + len;
    if (hemY < BWL + 8) { hemY = BWL + 8; warn('lengthShort'); }
  }
  const flare = kind === 'coat' ? 3 : continuous ? 0.5 : 0;

  // ---------------- BACK ----------------
  const hpsB0 = P(nw, -2);
  const spB = P(shoulderHalf + 0.6, 2.2);
  const hpsB = along(hpsB0, spB, widen);
  let cbDepth = jacket ? 0 : ({ round: 0, scoop: 3, v: 1 }[neckline] ?? 0);
  if (openBack) {
    const want = o.backDepth ?? 25;
    cbDepth = Math.min(want, BWL - 6);
    if (want > BWL - 6) warn('backDepth');
  }
  const cbNeck = P(0, cbDepth);
  const keyLen = backOpt === 'keyhole' ? clamp(o.keyholeLen ?? 12, 5, BWL - 10) : 0;
  const uB = P(backW, scyeY);
  const ab = P(clamp(acrossBack, spB.x - 2.5, backW - 2), (spB.y + scyeY) / 2 + 1);
  const armB = join(
    cubic(uB, P(uB.x - 2.2, uB.y), P(ab.x, ab.y + (uB.y - ab.y) * 0.55), ab),
    cubic(ab, P(ab.x, ab.y - (ab.y - spB.y) * 0.45), P(spB.x - 0.4, spB.y + 1.6), spB),
  );
  const targetB = W / 4 - 0.5;
  const shapeB = waistDarts ? shapeWaist(backW - targetB, continuous ? 3.5 : 4, 0.55) : { side: clamp(backW - targetB, -20, 2.5), dart: 0 };
  const wsB = P(backW - shapeB.side, BWL);
  const neckB = backOpt === 'v'
    ? line(hpsB, cbNeck)
    : backOpt === 'u'
      ? cubic(hpsB, P(hpsB.x, hpsB.y + (cbNeck.y - hpsB.y) * 0.6), P(hpsB.x * 0.55, cbNeck.y), cbNeck)
      : cubic(hpsB, P(hpsB.x - 0.2, hpsB.y + Math.max(0.8, (cbNeck.y - hpsB.y) * 0.45)), P(hpsB.x * 0.45, cbNeck.y), cbNeck);
  const keyEnd = P(0, cbNeck.y + keyLen);
  const keyCurve = keyLen ? cubic(cbNeck, P(2.2, cbNeck.y + keyLen * 0.12), P(2.6, cbNeck.y + keyLen * 0.8), keyEnd) : null;
  const bdx = wsB.x * 0.5;
  let backBottom, backSide, backGrain, backBelowLen = 0;
  const backDarts = [];
  if (!continuous) {
    backBottom = line(P(0, BWL), wsB);
    backSide = line(wsB, uB);
    if (shapeB.dart > 0.3) backDarts.push({ a: P(bdx - shapeB.dart / 2, BWL), b: P(bdx + shapeB.dart / 2, BWL), tip: P(bdx, scyeY + 2) });
    backGrain = { a: P(backW * 0.8, scyeY + 1.5), b: P(backW * 0.8, BWL - 3) };
  } else {
    const below = sideBelow(wsB, H / 4 - 0.5, BWL + m.waistHip, hemY, flare);
    backBelowLen = polyLen(below);
    backBottom = line(P(0, hemY), below[below.length - 1]);
    backSide = join(reverse(below), line(wsB, uB));
    if (shapeB.dart > 0.3) backDarts.push(diamond(bdx, scyeY + 2, BWL, Math.min(BWL + 14, hemY - 4), shapeB.dart));
    backGrain = { a: P(backW * 0.8, scyeY + 1.5), b: P(backW * 0.8, hemY - 4) };
  }
  const back = {
    id: 'back', nameKey: kind === 'dress' ? 'backBodice' : 'back', cutKey: 'cut2pair', copies: 2, onFold: false,
    edges: [
      ...(keyCurve ? [edge(keyCurve, SA, 'seam', 'keyhole')] : []),
      edge(line(keyEnd, P(0, continuous ? hemY : BWL)), SA, 'seam', jacket ? 'cbSeam' : 'cbZip'),
      edge(backBottom, continuous ? HEM : SA, continuous ? 'hem' : 'seam', continuous ? 'hem' : 'waist'),
      edge(backSide, SA, 'seam', 'side'),
      edge(armB, SA, 'seam', 'armhole'),
      edge(line(spB, hpsB), SA, 'seam', 'shoulder'),
      edge(neckB, SA, 'seam', 'neck'),
    ],
    darts: backDarts, notches: [{ edge: 'armhole', at: 8, count: 2 }], grain: backGrain,
    marks: keyLen ? [{ type: 'button', p: P(1.2, cbNeck.y + 1.2) }] : [], lines: [],
  };

  // ---------------- FRONT ----------------
  const hpsF0 = P(nw, -2);
  const spF = P(shoulderHalf - 0.2, 3.2);
  const hpsF = along(hpsF0, spF, widen);
  const depth = { round: nw + 1.6, scoop: nw + 7, v: nw + 12 }[neckline] ?? nw + 1.6;
  const cfNeck = P(0, -2 + depth);
  const apx = clamp((m.bustSpan || m.bust * 0.21) / 2, 6, frontW - 6);
  let apexY = m.bustHeight
    ? -2 + Math.sqrt(Math.max(m.bustHeight ** 2 - (apx - nw) ** 2, 100))
    : -2 + m.bust * 0.16 + 11;
  apexY = clamp(apexY, scyeY - 3, BWL - 6);
  const apex = P(apx, apexY);

  let drop;
  if (m.shoulderWaist) {
    const raw = apex.y + m.shoulderWaist - dist(hpsF0, apex) - BWL;
    drop = clamp(raw, 0, 7);
    if (raw < -1.5 || raw > 8.5) warn('frontLength');
  } else drop = clamp(2.5 + (m.bust - m.waist - 18) * 0.1, 1.5, 5);

  const uF = P(frontW, scyeY);
  const ac = P(clamp(acrossChest, spF.x - 2.5, frontW - 2.2), (spF.y + scyeY) / 2 + 1.5);
  let armF = join(
    cubic(uF, P(uF.x - 2.6, uF.y), P(ac.x, ac.y + (uF.y - ac.y) * 0.5), ac),
    cubic(ac, P(ac.x, ac.y - (ac.y - spF.y) * 0.45), P(spF.x - 0.5, spF.y + 1.6), spF),
  );
  const targetF = W / 4 + 0.5;
  const exF = frontW - targetF;
  let shapeF;
  if (!waistDarts) shapeF = { side: clamp(exF, -20, 2.5), dart: 0 };
  else if (m.underBust && m.underBust < m.bust) {
    let dart = Math.min(clamp((m.bust - m.underBust) * 0.35, 1, 5.5), Math.max(exF, 0));
    let side = exF - dart;
    if (side > 4) { dart += side - 4; side = 4; }
    shapeF = { side, dart };
  } else shapeF = shapeWaist(exF, 4.5, 0.6);

  const backAbove = dist(wsB, uB);
  let wsF;
  if (bustDart) wsF = P(frontW - shapeF.side, BWL + drop);
  else {
    const dx = shapeF.side;
    wsF = P(frontW - shapeF.side, uF.y + Math.sqrt(Math.max(backAbove ** 2 - dx * dx, 1)));
  }
  const sideDart = bustDart ? Math.max(0, dist(wsF, uF) - backAbove) : 0;
  const dUp = along(uF, wsF, 4), dLow = along(uF, wsF, 4 + sideDart);
  const sideTip = along(apex, along(uF, wsF, 4 + sideDart / 2), 2.5);
  // Pivot for dart rotation: the point nearest the bust point that is equally far from both dart legs,
  // so rotating closes the side dart exactly.
  const dMidPt = lerp(dUp, dLow, 0.5);
  const bis = (() => { const d = norm(sub(dLow, dUp)); return P(-d.y, d.x); })();
  const tPiv = (apex.x - dMidPt.x) * bis.x + (apex.y - dMidPt.y) * bis.y;
  const pivot = sideDart > 0.05 ? add(dMidPt, mul(bis, tPiv)) : apex;
  const fdx = clamp(apx, shapeF.dart / 2 + 2, wsF.x - shapeF.dart / 2 - 2);
  const fwY = BWL + drop;
  const cfBottomY = continuous ? hemY + drop : fwY;
  const sideHemY = continuous ? hemY + (wsF.y - BWL) : null;

  // Opening and neckline
  const ext = jacket ? (o.closure === 'double' ? (kind === 'coat' ? 8 : 7) : (kind === 'coat' ? 2.5 : 2)) : 0;
  const x0 = -ext;
  const topSegs = [];
  let lapel = null, breakY = null;
  if (!jacket) {
    const neckF = neckline === 'v'
      ? line(hpsF, cfNeck)
      : cubic(hpsF, P(hpsF.x, hpsF.y + (cfNeck.y - hpsF.y) * 0.55), P(hpsF.x * 0.5, cfNeck.y), cfNeck);
    topSegs.push(edge(neckF, SA, 'seam', 'neck'), edge(line(cfNeck, P(0, cfBottomY)), 0, 'fold', 'cf'));
  } else {
    breakY = fwY - { blazer: { single: 4, double: 9 }, coat: { single: 9, double: 12 } }[kind][o.closure === 'double' ? 'double' : 'single'];
    const Bk = P(-ext, breakY);
    if (o.collar === 'notched') {
      const R = add(hpsF, mul(norm(sub(hpsF, spF)), 2.5));
      const u = norm(sub(R, Bk)), Lr = dist(R, Bk);
      const nOut = P(u.y, -u.x);
      const LP = (s, w) => add(add(Bk, mul(u, s * Lr)), mul(nOut, w));
      const lw = (kind === 'coat' ? 8.5 : 7.5) + (o.closure === 'double' ? 1.5 : 0);
      const Pp = LP(0.66, lw), Q = LP(0.75, lw * 0.45), K = LP(0.86, -1.2);
      const lapelEdge = cubic(Bk, LP(0.25, lw * 0.55), LP(0.5, lw * 1.02), Pp);
      const neckF = cubic(hpsF, P(hpsF.x - 0.3, hpsF.y + (K.y - hpsF.y) * 0.5), P(K.x + (hpsF.x - K.x) * 0.3, K.y - 0.6), K);
      topSegs.push(
        edge(neckF, SA, 'seam', 'neck'),
        edge(line(K, Q), SA, 'seam', 'gorge'),
        edge(line(Q, Pp), SA, 'seam', 'lapel'),
        edge(reverse(lapelEdge), SA, 'seam', 'lapel'),
        edge(line(Bk, P(x0, cfBottomY)), SA, 'seam', 'frontEdge'),
      );
      lapel = { R, Bk, K, Q, Pp, neckF };
    } else {
      topSegs.push(
        edge(line(hpsF, Bk), SA, 'seam', 'neck'),
        edge(line(Bk, P(x0, cfBottomY)), SA, 'seam', 'frontEdge'),
      );
    }
  }

  // Waist line or hem, and the lower side seam
  let bottom, sideLow;
  if (!continuous) {
    bottom = Math.abs(wsF.y - fwY) < 0.05
      ? line(P(0, fwY), wsF)
      : cubic(P(0, fwY), P(wsF.x * 0.45, fwY), P(wsF.x * 0.8, wsF.y + (fwY - wsF.y) * 0.3), wsF);
    sideLow = [wsF];
  } else {
    let hy = sideHemY;
    let below = sideBelow(wsF, H / 4 + 0.5, wsF.y + m.waistHip, hy, flare);
    for (let i = 0; i < 3; i++) {
      hy -= polyLen(below) - backBelowLen; // keep front and back side seams the same length
      below = sideBelow(wsF, H / 4 + 0.5, wsF.y + m.waistHip, hy, flare);
    }
    const hs = below[below.length - 1];
    bottom = Math.abs(hs.y - cfBottomY) < 0.05
      ? line(P(x0, cfBottomY), hs)
      : cubic(P(x0, cfBottomY), P(x0 + (hs.x - x0) * 0.4, cfBottomY), P(x0 + (hs.x - x0) * 0.8, hs.y + (cfBottomY - hs.y) * 0.2), hs);
    sideLow = reverse(below);
  }

  let side = join(sideLow, line(wsF, uF));
  let shoulderPts = line(spF, hpsF);
  const frontDarts = [];
  const waistDart = (a, b) => (continuous
    ? diamond((a.x + b.x) / 2, apex.y + 2.5, fwY, Math.min(fwY + 12, cfBottomY - 4), dist(a, b))
    : { a, b, tip: along(apex, lerp(a, b, 0.5), 2.5) });
  const wa = P(fdx - shapeF.dart / 2, fwY), wb = P(fdx + shapeF.dart / 2, fwY);

  if (dartOpt === 'shoulder' && sideDart > 0.3) {
    const th = angleBetween(pivot, dUp, dLow);
    const M = along(hpsF, spF, Math.min(6, dist(hpsF, spF) / 2));
    const upper = rotateAll(line(dUp, uF), pivot, th);
    armF = rotateAll(armF, pivot, th);
    const sp2 = rotate(spF, pivot, th), M2 = rotate(M, pivot, th);
    side = join(sideLow, line(wsF, dLow), upper);
    shoulderPts = [sp2, M2, M, hpsF];
    frontDarts.push({ a: M2, b: M, tip: along(apex, lerp(M, M2, 0.5), 3) });
    if (shapeF.dart > 0.3) frontDarts.push(waistDart(wa, wb));
  } else if (dartOpt === 'waist' && !continuous && sideDart > 0.3) {
    const ph = angleBetween(pivot, dLow, dUp);
    const b2 = rotate(wb, pivot, ph), ws2 = rotate(wsF, pivot, ph);
    bottom = [P(0, fwY), wa, b2, ws2];
    side = join(line(ws2, dUp), line(dUp, uF));
    frontDarts.push({ a: wa, b: b2, tip: along(apex, lerp(wa, b2, 0.5), 2.5) });
  } else {
    if (sideDart > 0.3) frontDarts.push({ a: dUp, b: dLow, tip: sideTip });
    if (waistDarts && shapeF.dart > 0.3) frontDarts.push(waistDart(wa, wb));
  }

  const frontMarks = [{ type: 'apex', p: apex }];
  const frontLines = [];
  if (jacket) {
    const xs = o.closure === 'double' ? [-(ext - 2.5), ext - 2.5] : [0];
    const step = kind === 'coat' ? 11 : 10.5;
    const rows = kind === 'blazer' ? 2 : (o.closure === 'double' ? 3 : 4);
    for (let r = 0; r < rows; r++) {
      const y = breakY + 1.5 + r * step;
      if (y > cfBottomY - 8) break;
      for (const x of xs) frontMarks.push({ type: 'button', p: P(x, y) });
    }
    if (lapel) {
      frontLines.push({ pts: line(lapel.Bk, lapel.R), labelKey: 'rollLine' });
      frontMarks.push({ type: 'dot', p: lapel.Q });
    }
  }

  const frontEdges = [
    ...topSegs,
    edge(bottom, continuous ? HEM : SA, continuous ? 'hem' : 'seam', continuous ? 'hem' : 'waist'),
    edge(side, SA, 'seam', 'side'),
    edge(armF, SA, 'seam', 'armhole'),
    edge(shoulderPts, SA, 'seam', 'shoulder'),
  ];
  const front = {
    id: 'front', nameKey: kind === 'dress' ? 'frontBodice' : 'front',
    cutKey: jacket ? 'cut2pair' : 'cut1fold', copies: jacket ? 2 : 1, onFold: !jacket,
    edges: frontEdges, darts: frontDarts, notches: [{ edge: 'armhole', at: 7, count: 1 }],
    grain: jacket ? { a: P(Math.max(2.5, fdx * 0.4), (breakY ?? fwY) + 3), b: P(Math.max(2.5, fdx * 0.4), cfBottomY - 5) } : null,
    marks: frontMarks, lines: frontLines,
  };

  // ---------------- Jacket extras: collar and facings ----------------
  const extra = [];
  if (jacket) {
    const S4 = along(hpsF, spF, 4);
    const fx = (o.closure === 'double' ? ext - 2.5 : 0) + 6;
    const facingTop = topSegs.map((s) => edge(s.pts, s.sa, s.kind, s.name));
    extra.push({
      id: 'facing', nameKey: 'frontFacing', cutKey: 'cut2pairIF', copies: 2, onFold: false,
      edges: [
        ...facingTop,
        edge(line(P(x0, cfBottomY), P(fx, cfBottomY)), HEM, 'hem', 'hem'),
        edge(join(line(P(fx, cfBottomY), P(fx, breakY)), cubic(P(fx, breakY), P(fx, breakY - 6), P(S4.x + 1, S4.y + 8), S4)), SA, 'seam', 'inner'),
        edge(line(S4, hpsF), SA, 'seam', 'shoulder'),
      ],
      darts: [], notches: [], marks: [], lines: [],
      grain: { a: P(fx - 2.5, breakY + 3), b: P(fx - 2.5, cfBottomY - 4) },
      labelAt: P((x0 + fx) / 2 + 0.5, (breakY + cfBottomY) / 2),
    });
    const S4b = along(hpsB, spB, 4);
    const fb = P(0, cbNeck.y + 7);
    extra.push({
      id: 'backFacing', nameKey: 'backFacing', cutKey: 'cut1foldIF', copies: 1, onFold: true,
      edges: [
        edge(line(S4b, hpsB), SA, 'seam', 'shoulder'),
        edge(neckB, SA, 'seam', 'neck'),
        edge(line(cbNeck, fb), 0, 'fold', 'cb'),
        edge(cubic(fb, P(S4b.x * 0.55, fb.y), P(S4b.x - 0.5, S4b.y + 4), S4b), SA, 'seam', 'inner'),
      ],
      darts: [], notches: [], marks: [], lines: [], grain: null,
      labelAt: P(S4b.x * 0.5, fb.y - 3.2),
      small: true,
    });
    if (lapel) {
      const Lc = polyLen(neckB) + polyLen(lapel.neckF) + dist(lapel.K, lapel.Q);
      const st = kind === 'coat' ? 3.5 : 3, cw = st + (kind === 'coat' ? 5 : 4);
      const neckC = cubic(P(0, 0), P(Lc * 0.45, 0), P(Lc * 0.85, -0.4), P(Lc, -2));
      const C = P(Lc + 2.2, -2 - cw - 0.5);
      extra.splice(0, 0, {
        id: 'collar', nameKey: 'collar', cutKey: 'cut2foldIF', copies: 2, onFold: true,
        edges: [
          edge(line(P(0, -cw), P(0, 0)), 0, 'fold', 'cb'),
          edge(neckC, SA, 'seam', 'neck'),
          edge(line(P(Lc, -2), C), SA, 'seam', 'end'),
          edge(cubic(C, P(Lc * 0.8, -cw - 0.6), P(Lc * 0.35, -cw), P(0, -cw)), SA, 'seam', 'outer'),
        ],
        darts: [], marks: [], grain: null,
        notches: [{ edge: 'neck', at: polyLen(neckB), count: 1 }],
        lines: [{ pts: neckC.map((p) => P(p.x, p.y - st)), labelKey: 'rollLine' }],
        labelAt: P(Lc * 0.55, -cw * 0.62),
        small: true,
      });
    }
  }

  // ---------------- Measurements of the result ----------------
  const dartWidth = (darts) => darts.filter((d) => !d.type && Math.abs(d.a.y - d.b.y) < 3 && d.a.y > BWL - 3).reduce((s, d) => s + dist(d.a, d.b), 0);
  const frontWaistSeam = !continuous ? polyLen(bottom) - dartWidth(frontDarts) : null;
  const backWaistSeam = !continuous ? polyLen(backBottom) - dartWidth(backDarts) : null;
  const zipTop = cbNeck.y + keyLen;
  const cbLen = (continuous ? hemY : BWL) - zipTop;
  const neckFront = polyLen(frontEdges.find((x) => x.name === 'neck').pts);
  const meta = {
    ease: e, fdx, bdx, drop, sideDart,
    armholeFront: polyLen(armF), armholeBack: polyLen(armB),
    neckLen: 2 * (neckFront + polyLen(neckB) + (keyCurve ? polyLen(keyCurve) : 0)),
    frontWaistSeam, backWaistSeam,
    zip: kind === 'dress' ? zipFor(cbLen + 18) : kind === 'top' ? zipFor(Math.min(BWL - zipTop + 10, cbLen - 4)) : 0,
    backOpen: backOpt,
    buttons: frontMarks.filter((x) => x.type === 'button').length,
    hemLen: continuous ? 2 * (polyLen(bottom) + polyLen(backBottom)) : 0,
  };
  meta.bindingNeck = Math.ceil(meta.neckLen + 6);
  meta.bindingArm = sleeveless ? Math.ceil(2 * (meta.armholeFront + meta.armholeBack) + 10) : 0;

  let raglanSleeves = null;
  if (raglan) {
    const r = raglanPieces({ front, back, armF, armB, spF, spB, hpsF, hpsB, m, o, e, SA, warn });
    raglanSleeves = r.pieces;
    meta.sleeve = r.info;
  }
  return { front, back, extra, meta, raglanSleeves };
}

/** Split a polyline at arc length d. */
function splitAt(pts, d) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (acc + seg >= d) {
      const q = lerp(pts[i - 1], pts[i], seg ? (d - acc) / seg : 0);
      return [[...pts.slice(0, i), q], [q, ...pts.slice(i)]];
    }
    acc += seg;
  }
  return [pts.slice(), [pts[pts.length - 1]]];
}

/**
 * Raglan sleeves: cut a diagonal line from the neckline to the armhole on the bodice and
 * join the cut-off shoulder section onto a front and a back sleeve half.
 */
function raglanPieces({ front, back, armF, armB, spF, spB, hpsF, hpsB, m, o, e, SA, warn }) {
  const SLEEVE_HEM = SA === 0 ? 0 : 2.5;
  const bh = (m.upperArm + e.arm) / 2;
  const wristW = Math.max(m.wrist + (o.fit === 'fitted' ? 6 : 8), 20);
  const bicep = bh * 2;
  const hemW = { short: bicep - 2, threequarter: bicep - (bicep - wristW) * 0.6, long: wristW }[o.sleeve] ?? wristW;
  const hh = Math.min(hemW, bicep) / 2;
  const tilt = o.fit === 'relaxed' ? 40 : 45;

  const half = (piece, arm, sp, hps, deg, isFront) => {
    const neckEdge = piece.edges.find((x) => x.name === 'neck');
    const armEdge = piece.edges.find((x) => x.name === 'armhole');
    const shoulderIdx = piece.edges.findIndex((x) => x.name === 'shoulder');
    const neckFromHps = neckEdge.pts; // runs from the shoulder point toward the centre
    const [neckSleeve, neckBody] = splitAt(neckFromHps, Math.min(3.5, polyLen(neckFromHps) * 0.4));
    const [armBody] = splitAt(arm, polyLen(arm) * 0.42);
    const A = armBody[armBody.length - 1], N = neckSleeve[neckSleeve.length - 1];
    const v = sub(N, A);
    let nb = norm(P(v.y, -v.x));
    const toS = sub(sp, lerp(A, N, 0.5));
    if (nb.x * toS.x + nb.y * toS.y > 0) nb = mul(nb, -1);
    const rag = cubic(A, add(lerp(A, N, 0.35), mul(nb, 0.7)), add(lerp(A, N, 0.7), mul(nb, 0.35)), N);

    // Bodice: the armhole stops at A, the raglan line runs up to the neckline at N.
    armEdge.pts = armBody;
    neckEdge.pts = neckBody;
    piece.edges.splice(shoulderIdx, 1);
    const ai = piece.edges.indexOf(armEdge);
    piece.edges.splice(ai + 1, 0, edge(rag, SA, 'seam', 'raglan'));
    piece.notches = piece.notches.filter((n) => n.edge !== 'armhole');
    piece.notches.push({ edge: 'raglan', at: polyLen(rag) * 0.5, count: isFront ? 1 : 2 });

    // Sleeve half: overarm line from the shoulder point at `deg` below horizontal.
    const th = deg * Math.PI / 180;
    const d = P(Math.cos(th), Math.sin(th)), pn = P(-Math.sin(th), Math.cos(th));
    const target = polyLen(armBody) + 0.3;
    const build = (capD) => {
      const U = add(add(sp, mul(d, capD)), mul(pn, bh));
      const q = norm(P(A.y - U.y, -(A.x - U.x)));
      const ln = dist(U, A);
      const curve = cubic(U, add(lerp(U, A, 0.33), mul(q, ln * 0.06)), add(lerp(U, A, 0.7), mul(q, ln * 0.08)), A);
      return { U, curve };
    };
    let best = null;
    for (let c = 5; c <= 26; c += 0.05) {
      const b = build(c);
      const err = Math.abs(polyLen(b.curve) - target);
      if (!best || err < best.err) best = { ...b, capD: c, err };
    }
    if (best.err > 1) warn('cap');
    return { piece, A, N, rag, neckSleeve, sp, hps, d, pn, ...best };
  };

  const F = half(front, armF, spF, hpsF, tilt, true);
  const B = half(back, armB, spB, hpsB, tilt - 5, false);
  const lenFor = (capD) => Math.max({ short: Math.max(capD + 8, 22), threequarter: m.armLen * 0.75, long: m.armLen }[o.sleeve] ?? m.armLen, capD + 6);
  const L = Math.max(lenFor(F.capD), lenFor(B.capD));

  const sleeve = (h, isFront, matchUnder) => {
    const Hm = add(h.sp, mul(h.d, L));
    let Hi = add(Hm, mul(h.pn, hh));
    if (matchUnder) { // keep the two underarm seams the same length
      for (let i = 0; i < 3; i++) Hi = add(Hi, mul(h.d, matchUnder - dist(h.U, Hi)));
    }
    const piece = {
      id: isFront ? 'frontSleeve' : 'backSleeve', nameKey: isFront ? 'frontSleeve' : 'backSleeve',
      cutKey: 'cut2pair', copies: 2, onFold: false,
      edges: [
        edge(reverse(h.neckSleeve), SA, 'seam', 'neck'),
        edge(join(line(h.neckSleeve[0], h.sp), line(h.sp, Hm)), SA, 'seam', 'overarm'),
        edge(line(Hm, Hi), SLEEVE_HEM, 'hem', 'hem'),
        edge(line(Hi, h.U), SA, 'seam', 'underarm'),
        edge(h.curve, SA, 'seam', 'underCurve'),
        edge(h.rag, SA, 'seam', 'raglan'),
      ],
      darts: [], marks: [], lines: [],
      notches: [{ edge: 'raglan', at: polyLen(h.rag) * 0.5, count: isFront ? 1 : 2 }],
      grain: { a: add(add(h.sp, mul(h.d, h.capD + 2)), mul(h.pn, bh * 0.45)), b: add(add(h.sp, mul(h.d, L - 3)), mul(h.pn, hh * 0.45)) },
      labelAt: add(add(h.sp, mul(h.d, h.capD + (L - h.capD) * 0.35)), mul(h.pn, bh * 0.5)),
    };
    return { piece, under: dist(h.U, Hi) };
  };
  const fs = sleeve(F, true);
  const bs = sleeve(B, false, fs.under);
  return {
    pieces: [fs.piece, bs.piece],
    info: { hem: SLEEVE_HEM, raglan: true, underCurve: [polyLen(F.curve), polyLen(B.curve)], underArm: [polyLen(F.piece.edges.find((x) => x.name === 'armhole').pts), polyLen(B.piece.edges.find((x) => x.name === 'armhole').pts)], under: [fs.under, bs.under], overarm: [polyLen(fs.piece.edges[1].pts), polyLen(bs.piece.edges[1].pts)] },
  };
}

// =====================================================================
// Corset: panelled, boned, strapless
// =====================================================================
function smooth(pts, n = 16) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, dd) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - dd) * t2 + (-a + 3 * b - 3 * c + dd) * t3);
      out.push(P(f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function corsetGarment(m, o, warn) {
  const SA = o.sa;
  const HEM = SA === 0 ? 0 : 1.5;
  const ce = { fitted: { bust: 0, waist: -2, hip: 2 }, regular: { bust: 2, waist: 0, hip: 4 }, relaxed: { bust: 4, waist: 2, hip: 6 } }[o.fit] || { bust: 2, waist: 0, hip: 4 };
  const lacing = o.corsetBack === 'lacing';
  const gap = lacing ? 2 : 0; // each back edge stops 2 cm short, leaving a lacing gap
  const B = m.bust + ce.bust, W = m.waist + ce.waist, H = m.hip + ce.hip;
  let backW = B / 4 - 0.5, frontW = B / 4 + 0.5;
  if (m.upperBust) {
    if (m.upperBust > m.bust) warn('upperBust');
    else { backW = (m.upperBust + ce.bust) / 4 - 0.5; frontW = B / 2 - backW; }
  }
  const BWL = m.backLen;
  let scyeY = m.bust / 8 + 10.5;
  if (scyeY > BWL - 12) { scyeY = BWL - 12; warn('armhole'); }
  const nw = (m.neck || 36) / 6 + 0.4;
  const apx = clamp((m.bustSpan || m.bust * 0.21) / 2, 6, frontW - 8);
  let apexY = m.bustHeight ? -2 + Math.sqrt(Math.max(m.bustHeight ** 2 - (apx - nw) ** 2, 100)) : -2 + m.bust * 0.16 + 11;
  apexY = clamp(apexY, scyeY - 3, BWL - 6);
  const apex = P(apx, apexY);
  let drop;
  if (m.shoulderWaist) {
    const raw = apex.y + m.shoulderWaist - dist(P(nw, -2), apex) - BWL;
    drop = clamp(raw, 0, 7);
    if (raw < -1.5 || raw > 8.5) warn('frontLength');
  } else drop = clamp(2.5 + (m.bust - m.waist - 18) * 0.1, 1.5, 5);

  const below = clamp(m.corsetBelow ?? 6, 0, 25);
  const hemB = BWL + below;
  const hipY = BWL + Math.max(m.waistHip, 6);
  const t = below > 0 ? Math.min(1, below / (hipY - BWL)) : 0; // share of the hip flare reached at the hem
  const topSide = scyeY + 2.5;

  // ---------- BACK ----------
  const bW = backW - gap;
  const tB = W / 4 - 0.5 - gap;
  const exB = Math.max(bW - tB, 0);
  let sideB = exB * 0.4, pB = exB * 0.6;
  const bx = bW * 0.48;
  const xsB = bW - sideB;
  if (bx + pB / 2 > xsB - 3) { const over = bx + pB / 2 - (xsB - 3); pB -= over; sideB += over; }
  const xsB2 = bW - sideB;
  const hipExB = Math.max(H / 4 - 0.5 - gap - (xsB2 - pB), 0) * t;
  const topCB = topSide + 1.5;
  const yTopB = topCB + (topSide - topCB) * (bx / bW);
  const backPrin = (sign) => {
    const w = P(bx + sign * pB / 2, BWL);
    const pts = smooth([P(bx, yTopB), P(bx + sign * pB * 0.12, (yTopB + BWL) / 2), w]);
    return below > 0 ? join(pts, line(w, P(w.x - sign * hipExB * 0.25, hemB))) : pts;
  };
  const prCB = backPrin(-1), prSB = backPrin(1);
  const sideBack = below > 0
    ? join(line(P(bW, topSide), P(xsB2, BWL)), line(P(xsB2, BWL), P(xsB2 + hipExB * 0.5, hemB)))
    : line(P(bW, topSide), P(xsB2, BWL));
  const cbPanel = {
    id: 'corsetCB', nameKey: 'corsetBack', cutKey: 'cut2pairLin', copies: 2, onFold: false,
    edges: [
      edge(line(P(0, topCB), P(bx, yTopB)), SA, 'seam', 'top'),
      edge(prCB, SA, 'seam', 'princess'),
      edge(line(prCB[prCB.length - 1], P(0, hemB)), HEM, 'hem', 'hem'),
      edge(line(P(0, hemB), P(0, topCB)), SA, 'seam', 'cb'),
    ],
    darts: [], lines: [],
    notches: [{ edge: 'princess', at: polyLen(prCB) * 0.4, count: 2 }],
    marks: [],
    grain: { a: P(bx * 0.6, topCB + 3), b: P(bx * 0.6, hemB - 3) },
    labelAt: P(bx * 0.55, (topCB + hemB) / 2 - 2),
    small: true,
  };
  if (lacing) {
    for (let y = topCB + 1.5; y <= hemB - 1.4; y += 2.5) cbPanel.marks.push({ type: 'eyelet', p: P(1.5, y) });
  }
  const sbPanel = {
    id: 'corsetSB', nameKey: 'corsetSideBack', cutKey: 'cut2pairLin', copies: 2, onFold: false,
    edges: [
      edge(line(P(bx, yTopB), P(bW, topSide)), SA, 'seam', 'top'),
      edge(sideBack, SA, 'seam', 'side'),
      edge(line(sideBack[sideBack.length - 1], prSB[prSB.length - 1]), HEM, 'hem', 'hem'),
      edge(reverse(prSB), SA, 'seam', 'princess'),
    ],
    darts: [], lines: [], marks: [],
    notches: [{ edge: 'princess', at: -polyLen(prSB) * 0.4, count: 2 }],
    grain: { a: P((bx + xsB2) / 2, topSide + 3), b: P((bx + xsB2) / 2, hemB - 3) },
    labelAt: P((bx + xsB2) / 2 + 0.6, (topSide + hemB) / 2 - 2),
    small: true,
  };

  // ---------- FRONT ----------
  const tF = W / 4 + 0.5;
  const exF = Math.max(frontW - tF, 0);
  let sideF = exF * 0.4, pF = exF * 0.6;
  const fwY = BWL + drop;
  const hemF = hemB + drop;
  const wsF = P(frontW - sideF, fwY);
  const Ts0 = P(frontW, topSide);
  const backSideLen = dist(P(bW, topSide), P(xsB2, BWL));
  const sd = Math.max(0, dist(Ts0, wsF) - backSideLen);
  const straight = o.corsetNeck === 'straight';
  const peakY = apex.y - (straight ? 7 : 8);
  const cfTop = straight ? peakY : apex.y - 3.5;
  const M = P(apx, peakY);
  const topIn = straight ? line(P(0, cfTop), M) : cubic(P(0, cfTop), P(apx * 0.3, cfTop - 3), P(apx * 0.75, peakY), M);
  const topOut = cubic(M, P(apx + (frontW - apx) * 0.4, peakY + 0.3), P(frontW - 2.5, topSide - 0.5), Ts0);
  const dUp = along(Ts0, wsF, 3), dLow = along(Ts0, wsF, 3 + sd);
  const dMid = lerp(dUp, dLow, 0.5);
  const bis = (() => { const dd = norm(sub(dLow, dUp)); return P(-dd.y, dd.x); })();
  const tp = (apex.x - dMid.x) * bis.x + (apex.y - dMid.y) * bis.y;
  const pivot = sd > 0.05 ? add(dMid, mul(bis, tp)) : apex;
  const th = sd > 0.05 ? angleBetween(pivot, dUp, dLow) : 0;
  const topOutR = rotateAll(topOut, pivot, th);
  const TsR = rotate(Ts0, pivot, th), dUpR = rotate(dUp, pivot, th);
  const M2 = topOutR[0];
  const px = clamp(pivot.x, pF / 2 + 2, wsF.x - pF / 2 - 3);
  const hipExF = Math.max(H / 4 + 0.5 - (wsF.x - pF), 0) * t;
  const frontPrin = (top, sign) => {
    const w = P(px + sign * pF / 2, fwY);
    const pts = smooth([top, pivot, w]);
    return below > 0 ? join(pts, line(w, P(w.x - sign * hipExF * 0.25, hemF))) : pts;
  };
  const prCF = frontPrin(M, -1), prSF = frontPrin(M2, 1);
  const sideFront = join(line(TsR, dUpR), line(dLow, wsF), below > 0 ? line(wsF, P(wsF.x + hipExF * 0.5, hemF)) : []);
  const cfPanel = {
    id: 'corsetCF', nameKey: 'corsetFront', cutKey: 'cut1foldLin', copies: 1, onFold: true,
    edges: [
      edge(topIn, SA, 'seam', 'top'),
      edge(prCF, SA, 'seam', 'princess'),
      edge(line(prCF[prCF.length - 1], P(0, hemF)), HEM, 'hem', 'hem'),
      edge(line(P(0, hemF), P(0, cfTop)), 0, 'fold', 'cf'),
    ],
    darts: [], lines: [],
    notches: [{ edge: 'princess', at: dist(M, pivot), count: 1 }],
    marks: [{ type: 'apex', p: apex }],
    grain: null,
    labelAt: P(px * 0.45, (pivot.y + hemF) / 2),
    small: true,
  };
  const sfPanel = {
    id: 'corsetSF', nameKey: 'corsetSideFront', cutKey: 'cut2pairLin', copies: 2, onFold: false,
    edges: [
      edge(topOutR, SA, 'seam', 'top'),
      edge(sideFront, SA, 'seam', 'side'),
      edge(line(sideFront[sideFront.length - 1], prSF[prSF.length - 1]), HEM, 'hem', 'hem'),
      edge(reverse(prSF), SA, 'seam', 'princess'),
    ],
    darts: [], lines: [], marks: [],
    notches: [{ edge: 'princess', at: -dist(M2, pivot), count: 1 }],
    grain: { a: P((px + wsF.x) / 2 + 1, pivot.y), b: P((px + wsF.x) / 2 + 1, hemF - 3) },
    labelAt: P((px + wsF.x) / 2 + 1.5, (pivot.y + hemF) / 2 + 2),
    small: true,
  };
  const pieces = [cfPanel, sfPanel, sbPanel, cbPanel];
  const boning = 2 * (polyLen(prCF) + polyLen(prCB) + polyLen(sideBack)) + 2 * (hemB - topCB) * (lacing ? 2 : 1) + (hemF - cfTop);
  return {
    pieces,
    meta: {
      corset: true, lacing,
      zip: lacing ? 0 : zipFor(hemB - topCB - 1),
      boning: Math.ceil(boning / 10) * 10,
      eyelets: cbPanel.marks.length * 2,
      bindingBottom: Math.ceil(2 * (polyLen(cfPanel.edges[2].pts) + polyLen(sfPanel.edges[2].pts) + polyLen(sbPanel.edges[2].pts) + polyLen(cbPanel.edges[2].pts)) + 6),
      check: { princessF: [polyLen(prCF), polyLen(prSF)], princessB: [polyLen(prCB), polyLen(prSB)], side: [polyLen(sideFront) - (sd > 0.05 ? dist(dUpR, dLow) : 0), polyLen(sideBack)] },
    },
  };
}

function sleevePiece(kind, m, o, meta, warn) {
  const e = easeFor(kind, o.fit);
  const SA = o.sa;
  const jacket = kind === 'blazer' || kind === 'coat';
  const SLEEVE_HEM = SA === 0 ? 0 : jacket ? 4 : 2.5;
  const AH = meta.armholeBack + meta.armholeFront;
  const bicep = m.upperArm + e.arm;
  const hb = bicep / 2;
  const target = AH + e.cap;
  const capCurve = (capH) => {
    const back = join(
      cubic(P(-hb, capH), P(-hb * 0.8, capH), P(-hb * 0.62, capH * 0.62), P(-hb * 0.5, capH * 0.45)),
      cubic(P(-hb * 0.5, capH * 0.45), P(-hb * 0.36, capH * 0.22), P(-hb * 0.22, 0), P(0, 0)),
    );
    const front = join(
      cubic(P(0, 0), P(hb * 0.22, 0), P(hb * 0.36, capH * 0.22), P(hb * 0.5, capH * 0.47)),
      cubic(P(hb * 0.5, capH * 0.47), P(hb * 0.66, capH * 0.68), P(hb * 0.82, capH), P(hb, capH)),
    );
    return { back, front, all: join(back, front) };
  };
  let lo = 6, hi = 26;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (polyLen(capCurve(mid).all) < target) lo = mid; else hi = mid;
  }
  const capH = (lo + hi) / 2;
  const cap = capCurve(capH);
  if (Math.abs(polyLen(cap.all) - target) > 1) warn('cap');
  const extraLen = kind === 'coat' ? 3 : kind === 'blazer' ? 1.5 : 0;
  const L = Math.max({ short: Math.max(capH + 6, 22), threequarter: m.armLen * 0.75, long: m.armLen + extraLen }[o.sleeve] ?? m.armLen, capH + 5);
  const wristW = jacket ? Math.max(m.wrist + (kind === 'coat' ? 15 : 11), kind === 'coat' ? 30 : 25) : Math.max(m.wrist + (o.fit === 'fitted' ? 6 : 8), 20);
  const hemW = {
    short: bicep - 2,
    threequarter: bicep - (bicep - wristW) * 0.6,
    long: wristW,
  }[o.sleeve];
  const hh = Math.min(hemW, bicep) / 2;
  const piece = {
    id: 'sleeve', nameKey: 'sleeve', cutKey: 'cut2pair', copies: 2, onFold: false,
    edges: [
      edge(cap.all, SA, 'seam', 'cap'),
      edge(line(P(hb, capH), P(hh, L)), SA, 'seam', 'underarm'),
      edge(line(P(hh, L), P(-hh, L)), SLEEVE_HEM, 'hem', 'hem'),
      edge(line(P(-hh, L), P(-hb, capH)), SA, 'seam', 'underarm'),
    ],
    darts: [],
    notches: [
      { edge: 'cap', at: 8 + e.cap * 0.2, count: 2 },
      { edge: 'cap', at: meta.armholeBack + e.cap / 2, count: 1 },
      { edge: 'cap', at: -(7 + e.cap * 0.2), count: 1 },
    ],
    grain: { a: P(-hb * 0.4, capH * 0.75), b: P(-hb * 0.4, L - 2) },
    lines: [{ pts: line(P(-hb, capH), P(hb, capH)), labelKey: 'bicepLine' }],
    marks: [],
    labelAt: P(hb * 0.18, capH * 0.55),
  };
  return { piece, info: { capH, bicep, length: L, capLength: polyLen(cap.all), armhole: AH, hem: SLEEVE_HEM } };
}

// =====================================================================
// Skirts (on their own or as part of a dress)
// =====================================================================
function skirtPieces({ shape, dartOpt, H, L, wh, SA, targetF, targetB, dxF, dxB, waist, warn, pleats }) {
  const HEM = SA === 0 ? 0 : shape === 'circle' ? 1 : 3;
  const W = 2 * (targetF + targetB);
  const cbName = 'cbZip';
  const ids = { f: 'frontSkirt', b: 'backSkirt' };
  if (wh > L - 5) { wh = L - 5; warn('skirtShort'); }

  if (shape === 'circle') {
    const r = W / (2 * Math.PI);
    const R = r + L;
    const make = (front) => ({
      id: front ? ids.f : ids.b, nameKey: front ? 'frontSkirt' : 'backSkirt',
      cutKey: front ? 'cut1fold' : 'cut2pair', copies: front ? 1 : 2, onFold: front,
      edges: [
        edge(line(P(0, r), P(0, R)), front ? 0 : SA, front ? 'fold' : 'seam', front ? 'cf' : cbName),
        edge(arc(P(0, 0), R, Math.PI / 2, 0, 90), HEM, 'hem', 'hem'),
        edge(line(P(R, 0), P(r, 0)), SA, 'seam', 'side'),
        edge(arc(P(0, 0), r, 0, Math.PI / 2, 40), SA, 'seam', 'waist'),
      ],
      darts: [], notches: [], marks: [], lines: [],
      grain: front ? null : { a: P(R * 0.25, r + 4), b: P(R * 0.25, R - 6) },
      labelAt: P(Math.cos(Math.PI / 4) * (r + L * 0.45), Math.sin(Math.PI / 4) * (r + L * 0.45)),
    });
    return [make(true), make(false)];
  }

  if (shape === 'pleated') {
    const k = Math.max(1, Math.round((pleats?.n ?? 12) / 4)); // pleats in each quarter
    const d2 = 2 * clamp(pleats?.d ?? 3, 0.5, 10);
    const make = (front) => {
      const target = front ? targetF : targetB;
      const hipQ = Math.max(H / 4 + (front ? 0.5 : -0.5), target);
      const ew = (hipQ - target) / k; // waist shaping hidden inside each pleat
      const gw = target / k, gh = hipQ / k;
      const w = hipQ + d2 * k;
      const lines = [], arrows = [];
      for (let i = 0; i < k; i++) {
        const fw = gw * (i + 0.5) + (d2 + ew) * i, pw = fw + d2 + ew;
        const fh = gh * (i + 0.5) + d2 * i, ph = fh + d2;
        lines.push({ pts: join(line(P(fw, 0), P(fh, wh)), line(P(fh, wh), P(fh, L))), labelKey: i === 0 ? 'pleatFold' : null, labelAt: 0.55, style: 'solid' });
        lines.push({ pts: join(line(P(pw, 0), P(ph, wh)), line(P(ph, wh), P(ph, L))), labelKey: i === 0 ? 'pleatPlace' : null, labelAt: 0.7 });
        arrows.push({ a: P(fw + 0.3, 2.2), b: P(pw - 0.3, 2.2) });
      }
      return {
        id: front ? 'frontSkirt' : 'backSkirt', nameKey: front ? 'frontSkirt' : 'backSkirt',
        cutKey: front ? 'cut1fold' : 'cut2pair', copies: front ? 1 : 2, onFold: front,
        edges: [
          edge(line(P(0, 0), P(0, L)), front ? 0 : SA, front ? 'fold' : 'seam', front ? 'cf' : 'cbZip'),
          edge(line(P(0, L), P(w, L)), HEM, 'hem', 'hem'),
          edge(line(P(w, L), P(w, 0)), SA, 'seam', 'side'),
          edge(line(P(w, 0), P(0, 0)), SA, 'seam', 'waist'),
        ],
        darts: [], marks: [], notches: [],
        lines: [...lines, { pts: line(P(0, wh), P(w, wh)), labelKey: 'hipLine', labelAt: 0.04 }],
        arrows,
        grain: front ? null : { a: P(gw * 0.5 * 0.5 + 0.8, wh + 4), b: P(gw * 0.5 * 0.5 + 0.8, L - 6) },
        labelAt: P(w * 0.5, wh + (L - wh) * 0.3),
        pleatsTotal: 4 * k,
      };
    };
    return [make(true), make(false)];
  }

  if (shape === 'gathered') {
    const make = (front) => {
      const target = front ? targetF : targetB;
      const hipQ = H / 4 + (front ? 0.5 : -0.5);
      const w = Math.max(target * 1.8, hipQ + 6);
      return {
        id: front ? ids.f : ids.b, nameKey: front ? 'frontSkirt' : 'backSkirt',
        cutKey: front ? 'cut1fold' : 'cut2pair', copies: front ? 1 : 2, onFold: front,
        edges: [
          edge(line(P(0, 0), P(0, L)), front ? 0 : SA, front ? 'fold' : 'seam', front ? 'cf' : cbName),
          edge(line(P(0, L), P(w, L)), HEM, 'hem', 'hem'),
          edge(line(P(w, L), P(w, 0)), SA, 'seam', 'side'),
          edge(line(P(w, 0), P(0, 0)), SA, 'seam', 'waist'),
        ],
        darts: [], marks: [], lines: [],
        notches: [{ edge: 'waist', at: w / 2, count: 1 }],
        grain: front ? null : { a: P(w * 0.5, 6), b: P(w * 0.5, L - 6) },
        gather: { from: P(w - 1, 0), to: P(front ? 0 : 1, 0) },
      };
    };
    return [make(true), make(false)];
  }

  // Pencil or A-line
  const make = (front) => {
    const target = front ? targetF : targetB;
    const hipQ = H / 4 + (front ? 0.5 : -0.5);
    const ex = hipQ - target;
    let darts = [];
    let total = 0;
    if (ex > 0 && dartOpt === 'one') total = clamp(ex * (front ? 0.4 : 0.5), 0, front ? 2.5 : 3.5);
    if (ex > 0 && dartOpt === 'two') total = clamp(ex * (front ? 0.55 : 0.65), 0, front ? 4 : 6);
    const side = ex - total;
    if (dartOpt === 'none' && side > 6) warn('noDarts');
    const ws = P(hipQ - side, -0.6);
    const hp = P(hipQ, wh);
    let hemSide, hem;
    if (shape === 'aline') {
      const flare = (L - wh) * 0.2;
      hemSide = P(hipQ + flare, L - flare * 0.15);
      const d = norm(sub(hemSide, hp));
      const perp = P(-d.y, d.x);
      hem = cubic(P(0, L), P(hemSide.x * 0.45, L), add(hemSide, mul(perp, hemSide.x * 0.25)), hemSide);
    } else {
      const taper = L - wh > 25 ? 1.5 : 0;
      hemSide = P(hipQ - taper, L);
      hem = line(P(0, L), hemSide);
    }
    const sideCurve = reverse(cubic(ws, P(ws.x + (hipQ - ws.x) * 0.6, wh * 0.3), P(hipQ, wh * 0.6), hp));
    const waistLine = cubic(ws, P(ws.x * 0.66, 0), P(ws.x * 0.33, 0), P(0, 0));
    const lens = front ? [9, 7.5] : [13, 11.5];
    if (total > 0.3) {
      const n = dartOpt === 'two' ? 2 : 1;
      const w = total / n;
      const x1 = clamp(front ? dxF : dxB, w / 2 + 2, ws.x - w * (n === 2 ? 1.5 : 0.5) - 3);
      const xs = n === 2 ? [x1, x1 + Math.max(w + 2.5, (ws.x - x1) * 0.45)] : [x1];
      darts = xs.map((x, i) => ({ a: P(x - w / 2, 0), b: P(x + w / 2, 0), tip: P(x, Math.min(lens[i], wh - 3)) }));
    }
    return {
      id: front ? ids.f : ids.b, nameKey: front ? 'frontSkirt' : 'backSkirt',
      cutKey: front ? 'cut1fold' : 'cut2pair', copies: front ? 1 : 2, onFold: front,
      edges: [
        edge(line(P(0, 0), P(0, L)), front ? 0 : SA, front ? 'fold' : 'seam', front ? 'cf' : cbName),
        edge(hem, HEM, 'hem', 'hem'),
        edge(join(line(hemSide, hp), sideCurve), SA, 'seam', 'side'),
        edge(waistLine, SA, 'seam', 'waist'),
      ],
      darts, notches: [], marks: [],
      grain: front ? null : { a: P(hipQ * 0.85, wh + 3), b: P(hipQ * 0.85, L - 5) },
      lines: [{ pts: line(P(0, wh), P(hipQ, wh)), labelKey: 'hipLine' }],
      slit: !front && shape === 'pencil' && L - wh > 30 ? 18 : 0,
    };
  };
  return [make(true), make(false)];
}

function waistbandPiece(len, width, SA) {
  const h = width * 2;
  return {
    id: 'waistband', nameKey: 'waistband', cutKey: 'cut1IF', copies: 1, onFold: false,
    edges: [
      edge(line(P(0, 0), P(len, 0)), SA, 'seam', 'top'),
      edge(line(P(len, 0), P(len, h)), SA, 'seam', 'end'),
      edge(line(P(len, h), P(0, h)), SA, 'seam', 'bottom'),
      edge(line(P(0, h), P(0, 0)), SA, 'seam', 'end'),
    ],
    darts: [], notches: [], marks: [],
    lines: [{ pts: line(P(0, width), P(len, width)), labelKey: 'foldLine', labelAt: 0.12 }],
    grain: { a: P(len * 0.04, 1.6), b: P(len * 0.3, 1.6) },
    labelAt: P(len * 0.62, 2.4),
    small: true,
  };
}

function skirtGarment(m, o, warn) {
  const fe = { fitted: { w: 1, h: 4 }, regular: { w: 2, h: 6 }, relaxed: { w: 3, h: 9 } }[o.fit] || { w: 2, h: 6 };
  const W = m.waist + fe.w, H = m.hip + fe.h;
  const targetF = W / 4 + 0.5, targetB = W / 4 - 0.5;
  const pieces = skirtPieces({
    shape: o.skirt, dartOpt: o.skirtDarts, H, L: m.skirtLen, wh: m.waistHip, SA: o.sa,
    targetF, targetB, dxF: targetF * 0.45, dxB: targetB * 0.5, warn,
    pleats: { n: o.pleatCount, d: o.pleatDepth },
  });
  const wbLen = 2 * (targetF + targetB) + 3;
  pieces.push(waistbandPiece(wbLen, 4, o.sa));
  return { pieces, meta: { zip: 20, waistband: wbLen, skirtLen: m.skirtLen } };
}

// =====================================================================
// Trousers
// =====================================================================
function trousersGarment(m, o, warn) {
  const fe = { fitted: { w: 1, h: 3, cd: 0.5 }, regular: { w: 2, h: 5, cd: 1 }, relaxed: { w: 3, h: 8, cd: 1.5 } }[o.fit] || { w: 2, h: 5, cd: 1 };
  const SA = o.sa, HEM = SA === 0 ? 0 : 4;
  const W = m.waist + fe.w, H = m.hip + fe.h;
  const CD = m.crotchDepth + fe.cd;
  let L = m.trouserLen;
  if (L < CD + 20) { L = CD + 20; warn('trouserShort'); }
  const hipY = Math.min(m.waistHip, CD - 4);
  const kneeY = Math.min((CD + L) / 2 - 5, L - 8);
  const Hf = H / 4 - 1, Hb = H / 4 + 1;
  const extF = H / 18 + 0.5, extB = H / 9 + 0.5;

  const leg = o.leg || 'straight';
  let knee = m.kneeCirc ? m.kneeCirc + { straight: 14, tapered: 9, wide: 22 }[leg] : H * { straight: 0.46, tapered: 0.42, wide: 0.56 }[leg];
  let hemT = { straight: knee - 2, tapered: Math.max(H * 0.33, 32), wide: H * 0.62 }[leg];
  hemT = Math.min(hemT, knee + (leg === 'wide' ? 20 : 0));
  const kfh = knee / 4 - 1, hfh = hemT / 4 - 1, kbh = knee / 4 + 1, hbh = hemT / 4 + 1;

  const dartF = { none: 0, one: 2, two: 3 }[o.skirtDarts] ?? 2;
  const dartB = { none: 0, one: 3, two: 4.5 }[o.skirtDarts] ?? 3;
  if (o.skirtDarts === 'none' && H - W > 26) warn('noDarts');

  // ---- FRONT ----
  const cF = (Hf + extF) / 2 - 0.5;
  const F = P(Hf + extF, CD);
  const cfW = P(Hf - 1, 0), cfH = P(Hf, hipY);
  const Wf = W / 4 - 0.5;
  const sideF = P(cfW.x - (Wf + dartF), 0);
  const kneeOF = P(cF - kfh, kneeY), kneeIF = P(cF + kfh, kneeY);
  const hemOF = P(cF - hfh, L), hemIF = P(cF + hfh, L);
  const sideCurveF = join(
    cubic(sideF, P(sideF.x * 0.6, hipY * 0.4), P(0, hipY * 0.7), P(0, hipY)),
    cubic(P(0, hipY), P(0, CD), P(kneeOF.x, kneeY - (kneeY - CD) * 0.45), kneeOF),
    line(kneeOF, hemOF),
  );
  const inseamF = join(
    cubic(F, P(F.x - extF * 0.45, CD + 4), P(kneeIF.x + 0.4, kneeY - (kneeY - CD) * 0.45), kneeIF),
    line(kneeIF, hemIF),
  );
  const crotchF = cubic(cfH, P(Hf, CD - 1.5), P(Hf + extF * 0.35, CD), F);
  const frontDarts = [];
  if (dartF > 0) {
    const n = o.skirtDarts === 'two' ? 2 : 1, w = dartF / n;
    const xs = n === 2 ? [cF + 0.5, cF - 3.2] : [cF];
    xs.forEach((x, i) => {
      const xx = clamp(x, sideF.x + w + 2, cfW.x - w - 2);
      frontDarts.push({ a: P(xx - w / 2, 0), b: P(xx + w / 2, 0), tip: P(xx, i ? 7.5 : 9) });
    });
  }
  const front = {
    id: 'trouserFront', nameKey: 'trouserFront', cutKey: 'cut2pair', copies: 2, onFold: false,
    edges: [
      edge(line(sideF, cfW), SA, 'seam', 'waist'),
      edge(line(cfW, cfH), SA, 'seam', 'cf'),
      edge(crotchF, SA, 'seam', 'crotch'),
      edge(inseamF, SA, 'seam', 'inseam'),
      edge(line(hemIF, hemOF), HEM, 'hem', 'hem'),
      edge(reverse(sideCurveF), SA, 'seam', 'side'),
    ],
    darts: frontDarts, marks: [],
    notches: [{ edge: 'side', at: -20, count: 1 }, { edge: 'inseam', at: (kneeY - CD) * 0.5, count: 1 }],
    grain: { a: P(cF, hipY + 2), b: P(cF, L - 5) },
    lines: [
      { pts: line(P(0, CD), F), labelKey: 'crotchLine' },
      { pts: line(kneeOF, kneeIF), labelKey: 'kneeLine' },
    ],
    labelAt: P(cF, CD + (kneeY - CD) * 0.45),
  };

  // ---- BACK ----
  const cB = (Hb + extB) / 2 - 1.5;
  const cbH = P(Hb, hipY), cbW = P(Hb - 2.5, -2.5);
  const Wb = W / 4 + 0.5;
  const sideB = P(cbW.x - Math.sqrt(Math.max((Wb + dartB) ** 2 - 2.5 ** 2, 1)), 0);
  const kneeOB = P(cB - kbh, kneeY), kneeIB = P(cB + kbh, kneeY);
  const hemOB = P(cB - hbh, L), hemIB = P(cB + hbh, L);
  const sideCurveB = join(
    cubic(sideB, P(sideB.x * 0.6, hipY * 0.4), P(0, hipY * 0.7), P(0, hipY)),
    cubic(P(0, hipY), P(0, CD), P(kneeOB.x, kneeY - (kneeY - CD) * 0.45), kneeOB),
    line(kneeOB, hemOB),
  );
  const backInseam = (ky) => join(
    cubic(P(Hb + extB, ky), P(Hb + extB - extB * 0.45, ky + 4), P(kneeIB.x + 0.4, kneeY - (kneeY - ky) * 0.45), kneeIB),
    line(kneeIB, hemIB),
  );
  // Lower the back fork until the back inside leg is 0.3 cm shorter than the front (it is eased in).
  let ky = CD + 0.8;
  for (let i = 0; i < 4; i++) ky += polyLen(backInseam(ky)) - (polyLen(inseamF) - 0.3);
  ky = clamp(ky, CD, CD + 3);
  const K = P(Hb + extB, ky);
  const inseamB = backInseam(ky);
  const cbDir = norm(sub(cbH, cbW));
  const crotchB = cubic(cbH, add(cbH, mul(cbDir, (ky - hipY) * 0.55)), P(Hb + extB * 0.45, ky), K);
  const backDarts = [];
  if (dartB > 0) {
    const n = o.skirtDarts === 'two' ? 2 : 1, w = dartB / n;
    const dir = norm(sub(cbW, sideB));
    const down = P(-dir.y, dir.x).y > 0 ? P(-dir.y, dir.x) : P(dir.y, -dir.x);
    const ts = n === 2 ? [0.38, 0.68] : [0.5];
    ts.forEach((t, i) => {
      const c = lerp(sideB, cbW, t);
      backDarts.push({ a: sub(c, mul(dir, w / 2)), b: add(c, mul(dir, w / 2)), tip: add(c, mul(down, i ? 10.5 : 12)) });
    });
  }
  const back = {
    id: 'trouserBack', nameKey: 'trouserBack', cutKey: 'cut2pair', copies: 2, onFold: false,
    edges: [
      edge(line(sideB, cbW), SA, 'seam', 'waist'),
      edge(line(cbW, cbH), SA, 'seam', 'cb'),
      edge(crotchB, SA, 'seam', 'crotch'),
      edge(inseamB, SA, 'seam', 'inseam'),
      edge(line(hemIB, hemOB), HEM, 'hem', 'hem'),
      edge(reverse(sideCurveB), SA, 'seam', 'side'),
    ],
    darts: backDarts, marks: [],
    notches: [{ edge: 'side', at: -20, count: 2 }, { edge: 'inseam', at: (kneeY - CD) * 0.5, count: 2 }],
    grain: { a: P(cB, hipY + 2), b: P(cB, L - 5) },
    lines: [
      { pts: line(P(0, ky), K), labelKey: 'crotchLine' },
      { pts: line(kneeOB, kneeIB), labelKey: 'kneeLine' },
    ],
    labelAt: P(cB, CD + (kneeY - CD) * 0.45),
  };
  const wbLen = 2 * (Wf + Wb) + 4;
  const pieces = [front, back, waistbandPiece(wbLen, 4, SA)];
  return {
    pieces,
    meta: {
      zip: 20, waistband: wbLen, L,
      sideF: polyLen(sideCurveF), sideB: polyLen(sideCurveB), inseamF: polyLen(inseamF), inseamB: polyLen(inseamB),
      waistF: dist(sideF, cfW) - dartF, waistB: dist(sideB, cbW) - dartB, targetWf: Wf, targetWb: Wb,
    },
  };
}
