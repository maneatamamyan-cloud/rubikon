// Builds the cutting list, supplies and step-by-step sewing instructions for any drafted garment.

const r1 = (n) => Math.round(n * 10) / 10;

/** Number formatting in the language's style (decimal comma for Russian and Armenian). */
export function makeFormat(T) {
  const num = (n) => (T.code === 'en' ? String(r1(n)) : String(r1(n)).replace('.', ','));
  return {
    num,
    cm: (cm) => `${num(cm)} ${T.unit}`,
    long: (cm) => (cm >= 100 ? `${num(cm / 100)} ${T.meter}` : `${num(cm)} ${T.unit}`),
  };
}

export function buildInstructions(d, o, fabric, T) {
  const F = makeFormat(T);
  const g = d.garment;
  const { meta, pieces } = d;
  const byId = Object.fromEntries(pieces.map((p) => [p.id, p]));
  const L = new Proxy({}, { get: (_, id) => (byId[id] ? byId[id].letter : '') });
  const jacket = g === 'blazer' || g === 'coat';
  const upper = g !== 'skirt' && g !== 'trousers';
  const hasSleeves = upper && g !== 'corset' && o.sleeve !== 'none';
  const raglan = hasSleeves && !jacket && o.sleeveType === 'raglan';
  const skirtShape = g === 'dress' || g === 'skirt' ? o.skirt : null;
  const dartedSkirt = skirtShape === 'pencil' || skirtShape === 'aline';
  const skirtDartsN = dartedSkirt ? { one: 1, two: 2, none: 0 }[o.skirtDarts] : 0;
  const backSkirt = byId.backSkirt;

  const p = {
    g, L, fmt: F.cm,
    sa: o.sa > 0 ? F.cm(o.sa) : null, saN: o.sa,
    zip: meta.zip,
    slit: backSkirt?.slit ? F.cm(backSkirt.slit) : null,
    oversize: fabric.oversize.map((x) => x.letter).join(', '),
    circle: skirtShape === 'circle', gathered: skirtShape === 'gathered', aline: skirtShape === 'aline',
    neckV: o.neckline === 'v',
    capEase: meta.sleeve ? F.cm(Math.max(0.5, meta.sleeve.capLength - meta.sleeve.armhole)) : '',
    darts: o.topDarts,
    fisheye: g !== 'dress' && ['sideWaist', 'shoulder'].includes(o.topDarts),
    skirtDartsN,
    collar: o.collar, closure: o.closure,
    hem: F.cm(o.sa === 0 ? 3 : jacket || g === 'trousers' ? 4 : g === 'top' ? 2.5 : 3),
    sleeveHem: F.cm(meta.sleeve ? (meta.sleeve.hem || 2.5) : 2.5),
    wool: jacket, upper, jacket,
    cut1: pieces.some((x) => x.cutKey === 'cut1IF'),
    interfacing: pieces.some((x) => /IF$/.test(x.cutKey)),
    lining: pieces.some((x) => /Lin$/.test(x.cutKey)),
    lacing: !!meta.lacing,
    pleated: skirtShape === 'pleated',
    pleatsN: pieces.find((x) => x.pleatsTotal)?.pleatsTotal || 0,
    openBack: o.back === 'v' || o.back === 'u',
  };

  // ---- Which steps, in order
  const k = ['prepare', 'print', 'cutPaper', 'layout', 'transfer'];
  if (jacket) k.push('interfacing');
  const bodiceDarts = upper && g !== 'corset' && o.topDarts !== 'none';
  const sleeveSteps = () => (raglan ? ['raglanJoin', 'raglanOverarm', 'raglanSides'] : ['shoulders', 'sides', ...(hasSleeves ? ['sleevesPrep', 'sleevesSet'] : ['bindArmholes'])]);
  if (g === 'corset') {
    k.push('corsetPanels', 'corsetLining', 'corsetBoning', 'corsetTop', p.lacing ? 'corsetLacing' : 'corsetZip', 'corsetBottom', 'finalPress');
  } else if (g === 'dress') {
    k.push('staystitch');
    if (bodiceDarts) k.push('bodiceDarts');
    k.push(...sleeveSteps());
    if (dartedSkirt && skirtDartsN) k.push('skirtDarts');
    if (p.gathered) k.push('gather');
    if (p.pleated) k.push('pleats');
    if (p.circle) k.push('circleHang');
    k.push('skirtSides', 'joinWaist', 'zipBack', 'bindNeck');
    if (o.back === 'keyhole') k.push('keyhole');
    if (hasSleeves) k.push('hemSleeves');
    k.push('hemSkirt', 'finalPress');
  } else if (g === 'top') {
    k.push('staystitch');
    if (bodiceDarts) k.push('bodiceDarts');
    k.push(...sleeveSteps());
    k.push('zipBack', 'bindNeck');
    if (o.back === 'keyhole') k.push('keyhole');
    if (hasSleeves) k.push('hemSleeves');
    k.push('hemTop', 'finalPress');
  } else if (g === 'skirt') {
    if (dartedSkirt && skirtDartsN) k.push('skirtDarts');
    if (p.gathered) k.push('gather');
    if (p.pleated) k.push('pleats');
    if (p.circle) k.push('circleHang');
    k.push('skirtSides', 'zipSkirt', 'waistbandPrep', 'waistbandAttach', 'hemSkirt', 'finalPress');
  } else if (g === 'trousers') {
    if (o.skirtDarts !== 'none') k.push('trouserDarts');
    k.push('trouserSides', 'zipSide', 'inseams', 'crotch', 'waistbandPrep', 'waistbandAttach', 'hemTrousers', 'finalPress');
  } else {
    k.push('staystitch');
    if (bodiceDarts) k.push('bodiceDarts');
    k.push('cbSeam', 'shoulders', 'sides');
    if (o.collar === 'notched') k.push('collarSew');
    k.push('joinFacings');
    if (o.collar === 'notched') k.push('collarAttach');
    k.push('facingAttach', 'sleevesPrep', 'sleevesSet', 'hemJacket', 'buttons', 'finalPress');
  }

  const steps = k.map((key) => {
    const s = T.steps[key];
    return { key, title: s.t, body: s.b(p), tip: s.tip ? s.tip(p) : null };
  });

  // ---- Supplies
  const hintKey = skirtShape || g;
  const supplies = T.supplies({
    g, sa: o.sa,
    fabric: F.long(fabric.total), width: fabric.width, hint: T.fabricHint[hintKey] || T.fabricHint.top,
    zip: meta.zip || 0,
    binding: F.long((meta.bindingNeck || 0) + (meta.bindingArm || 0)),
    waistband: F.cm(Math.ceil(meta.waistband || 0)),
    interfacing: F.long(g === 'coat' ? 140 : 100),
    buttons: meta.buttons || 0,
    double: o.closure === 'double',
    corset: meta.corset ? { boning: F.long(meta.boning), eyelets: meta.eyelets, lacing: meta.lacing, binding: F.long(meta.bindingBottom) } : null,
  });

  const cutting = pieces.map((x) => ({ letter: x.letter, name: T.pieces[x.nameKey], cut: T.cut[x.cutKey] }));
  return { supplies, cutting, steps };
}
