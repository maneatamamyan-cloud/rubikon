// English
const seam = (p) => (p.sa ? `a ${p.sa} seam allowance` : 'the seam allowance you added when cutting');

export default {
  code: 'en', name: 'English', short: 'EN', unit: 'cm', meter: 'm',

  ui: {
    pleatsRounded: (n) => `Pleats rounded to ${n} so the front and back match.`,
    tagline: 'Sewing patterns drafted to your measurements',
    language: 'Language',
    whatSew: 'What are you sewing?',
    measurements: 'Your measurements',
    howto: 'Measure over your underwear, standing straight, with the tape snug but not tight. Select a box to see how to measure it.',
    reset: 'Reset to sample measurements',
    style: 'Style',
    tabPattern: 'Pattern', tabCutting: 'Fabric & cutting', tabSteps: 'Sewing steps',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomFit: 'Fit',
    showPages: 'Show print pages', paper: 'Paper', letter: 'US Letter',
    printPattern: 'Print pattern', download: 'Download full-size SVG',
    pageCount: (n, paper, w, h) => `Prints on ${n} ${paper} pages, plus an overview page. The pattern sheet is ${w} × ${h}.`,
    fabricBuy: 'Fabric to buy', fabricWidth: 'Fabric width',
    extraNote: 'Includes about 10% extra for shrinkage and straightening the ends.',
    cuttingList: 'Cutting list', colPiece: 'Piece', colName: 'Name', colCut: 'Cut',
    alsoNeed: "You'll also need", layoutCaption: 'Suggested layout on fabric folded lengthwise',
    stepsCount: (n) => `${n} steps. Tick each one off as you go.`,
    stepsDone: (d, n) => `${d} of ${n} steps done`,
    markDone: (i) => `Mark step ${i} done`,
    printSteps: 'Print instructions',
    fixErrors: (n) => (n > 1 ? 'Fix the highlighted measurements to update the pattern.' : 'Fix the highlighted measurement to update the pattern.'),
    summarySub: (n, sa) => `${n} pattern pieces · ${sa}`,
    saIncluded: (sa) => `${sa} seam allowance included`,
    saNone: 'no seam allowance included',
    footer: 'Rubikon drafts a basic pattern from your numbers. Sew a quick test version in inexpensive fabric first, then adjust your measurements before cutting your good fabric.',
  },

  garments: {
    dress: ['Dress', 'Bodice and skirt'],
    skirt: ['Skirt', 'With waistband'],
    top: ['Top', 'Blouse with back zip'],
    corset: ['Corset', 'Panelled, boned'],
    trousers: ['Trousers', 'With waistband'],
    blazer: ['Blazer', 'Lapels and facings'],
    coat: ['Coat', 'Long, buttoned'],
  },

  groups: { body: 'Body', lengths: 'Lengths', arms: 'Arms', legs: 'Legs' },
  optional: 'optional',
  advanced: 'More optional measurements',
  notNeeded: 'not needed without sleeves',

  fields: {
    bust: ['Bust', 'Around the fullest part of your bust, keeping the tape level across your back.'],
    waist: ['Waist', 'Around your natural waist, the narrowest part of your torso. Bend to one side: the crease that forms is your waist.'],
    hip: ['Hips', 'Around the fullest part of your hips and seat, with your feet together.'],
    neck: ['Neck', 'Around the base of your neck, where a short necklace chain would sit.'],
    shoulder: ['Shoulder width', 'Across your back from one shoulder tip (the bony point at the top of your arm) to the other.'],
    bustHeight: ['Bust height', 'From the top of your shoulder, next to your neck, straight down to your bust point (nipple).'],
    upperBust: ['Upper bust', 'Around your chest high under your arms, above the bust, with the tape level across your back.'],
    underBust: ['Under bust', 'Around your ribcage, directly under your bust, where a bra band sits.'],
    backLen: ['Back waist length', 'From the bone that sticks out at the base of your neck, straight down your spine to your waist. Tie a ribbon around your waist first to find it.'],
    shoulderWaist: ['Shoulder to waist', 'From the top of your shoulder next to your neck, over your bust point, straight down to your waist.'],
    waistHip: ['Waist to hip', 'Down your side from your waist to the fullest part of your hips.'],
    dressLen: ['Dress length', 'From the top of your shoulder next to your neck, straight down your back to where you want the hem.'],
    topLen: ['Top length', 'From the top of your shoulder next to your neck, straight down to where you want the hem.'],
    jacketLen: ['Blazer length', 'From the top of your shoulder next to your neck, straight down your back to where you want the hem. Hip length is usually 65–72 cm.'],
    coatLen: ['Coat length', 'From the top of your shoulder next to your neck, straight down your back to where you want the hem. Knee length is usually 95–105 cm.'],
    skirtLen: ['Skirt length', 'From your waist down to where you want the hem. Knee length is usually 55–65 cm.'],
    crotchDepth: ['Crotch depth', 'Sit on a hard, flat chair. Measure down your side from your waist to the seat of the chair.'],
    trouserLen: ['Trouser length', 'Down the outside of your leg from your waist to where you want the hem. To the floor in flat shoes is usually 100–110 cm.'],
    kneeCirc: ['Knee', 'Around your knee, with your leg slightly bent.'],
    corsetBelow: ['Length below waist', 'How far the corset goes below your waist, measured down your side. Enter 0 to end it at the waist.'],
    armLen: ['Arm length', 'From your shoulder tip, over a slightly bent elbow, to your wrist bone.'],
    upperArm: ['Upper arm', 'Around the fullest part of your upper arm, with your arm relaxed.'],
    wrist: ['Wrist', 'Around your wrist bone.'],
    acrossBack: ['Across back', 'Across your back between the creases where your arms join your body, about 12 cm below the neck bone.'],
    acrossChest: ['Across chest', 'Across your chest between the creases where your arms join your body, about 7 cm below your collarbone.'],
    bustSpan: ['Bust point to bust point', 'Straight across from one bust point (nipple) to the other.'],
  },
  errors: {
    required: (label) => `Enter your ${label.toLowerCase()}.`,
    range: (min, max) => `Enter a number between ${min} and ${max}.`,
  },

  choices: {
    fit: ['Fit', { fitted: ['Fitted', 'Close to the body'], regular: ['Regular', 'Room to move'], relaxed: ['Relaxed', 'Easy and loose'] }],
    neckline: ['Neckline', { round: ['Round'], scoop: ['Scoop'], v: ['V-neck'] }],
    collar: ['Collar', { notched: ['Lapel collar'], collarless: ['Collarless'] }],
    closure: ['Closure', { single: ['Single-breasted'], double: ['Double-breasted'] }],
    sleeve: ['Sleeves', { none: ['None'], short: ['Short'], threequarter: ['¾'], long: ['Long'] }],
    sleeveType: ['Sleeve cut', { setin: ['Set-in'], raglan: ['Raglan'] }],
    corsetNeck: ['Top edge', { sweetheart: ['Sweetheart'], straight: ['Straight'] }],
    corsetBack: ['Back closure', { lacing: ['Lacing'], zip: ['Zip'] }],
    back: ['Back', { closed: ['Closed'], v: ['V back'], u: ['Low U back'], keyhole: ['Keyhole'] }],
    skirt: ['Skirt shape', { pencil: ['Pencil'], aline: ['A-line'], gathered: ['Gathered'], circle: ['Circle'], pleated: ['Pleated'] }],
    leg: ['Leg shape', { straight: ['Straight'], tapered: ['Tapered'], wide: ['Wide'] }],
    topDarts: ['Bodice darts', {
      sideWaist: ['Side + waist'], waist: ['Waist only'], shoulder: ['Shoulder + waist'], side: ['Side only'], none: ['No darts', 'Looser fit'],
    }],
    skirtDarts: ['Skirt darts', { one: ['1 dart'], two: ['2 darts'], none: ['No darts'] }],
    trouserDarts: ['Waist darts', { one: ['1 dart'], two: ['2 darts'], none: ['No darts'] }],
    sa: ['Seam allowance', { 1.5: ['1.5 cm'], 1: ['1 cm'], 0: ['None', 'Add it as you cut'] }],
  },

  params: {
    pleatCount: ['Number of pleats', 'Total around the skirt. It is rounded to a multiple of 4 so all four quarters match.'],
    pleatDepth: ['Pleat depth', 'How much fabric folds under in each pleat. Each pleat uses twice this amount.'],
    backDepth: ['Opening depth', 'From the bone at the base of your neck straight down to the lowest point of the opening.'],
    keyholeLen: ['Keyhole length', 'From the neckline down to the bottom of the keyhole.'],
  },
  pieces: {
    frontSleeve: 'Front sleeve', backSleeve: 'Back sleeve', corsetFront: 'Centre front', corsetSideFront: 'Side front', corsetSideBack: 'Side back', corsetBack: 'Centre back',
    frontBodice: 'Front bodice', backBodice: 'Back bodice', front: 'Front', back: 'Back', sleeve: 'Sleeve',
    frontSkirt: 'Front skirt', backSkirt: 'Back skirt', waistband: 'Waistband',
    trouserFront: 'Front leg', trouserBack: 'Back leg',
    collar: 'Collar', frontFacing: 'Front facing', backFacing: 'Back neck facing',
  },
  cut: {
    cut1foldLin: 'Cut 1 on fold + 1 lining', cut2pairLin: 'Cut 2 (mirror pair) + 2 lining',
    cut1fold: 'Cut 1 on fold', cut2pair: 'Cut 2 (mirror pair)', cut1IF: 'Cut 1 + 1 interfacing',
    cut2pairIF: 'Cut 2 (mirror pair) + 2 interfacing', cut1foldIF: 'Cut 1 on fold + 1 interfacing', cut2foldIF: 'Cut 2 on fold + 1 interfacing',
  },
  labels: {
    pleatFold: 'Pleat fold line', pleatPlace: 'Placement line',
    eyelet: 'Eyelet',
    placeOnFold: 'Place on fold (grain)', grainline: 'Grainline', bustPoint: 'Bust point', button: 'Button',
    slit: 'Slit opening', gather: 'Gather to fit', hipLine: 'Hip line', bicepLine: 'Bicep line', kneeLine: 'Knee line',
    crotchLine: 'Crotch line', rollLine: 'Roll line', foldLine: 'Fold line',
    tenCm: '10 cm', measure: 'Measure after printing', patternTitle: 'Rubikon sewing pattern',
    cutLine: 'Cutting line', stitchLine: 'Stitching line', notch: 'Notch: match these when sewing',
    saSub: (sa) => `Seam allowance: ${sa}`, saNotIncluded: 'Seam allowance: not included',
    fold: 'Fold', selvedges: 'Selvedges', layoutAria: 'Fabric cutting layout',
  },
  warnings: {
    backDepth: 'The back opening was too deep for your back waist length, so it was raised to leave room for the zip.',
    armhole: 'Your back waist length is short for your bust, so the armhole was made shallower. Check the fit with a test version.',
    cap: 'The sleeve cap could not fully match the armhole for your upper-arm size. Ease it in carefully, or try a different fit.',
    skirtShort: 'The skirt is shorter than your waist-to-hip depth, so the hip shaping was shortened.',
    frontLength: 'Your shoulder-to-waist measurement does not match your other measurements, so a standard front length was used. Measure it again over the bust point.',
    upperBust: 'Your upper bust is larger than your bust, so it was ignored. Measure the upper bust high under your arms.',
    lengthShort: 'The garment length is very short, so it was extended to at least 8 cm below the waist.',
    noDarts: 'Without darts the side seams take all the shaping between waist and hips. Choose 1 or 2 darts for a smoother fit.',
    trouserShort: 'The trouser length is too short for your crotch depth, so it was extended.',
    waistLarge: 'Your waist is much larger than your bust. This draft works best for a waist smaller than or close to the bust.',
  },

  fabricHint: {
    pleated: 'crisp woven that holds a sharp press (wool suiting, polyester crepe, cotton twill)',
    corset: 'firm, non-stretch woven (cotton coutil, brocade, jacquard or twill)',
    pencil: 'medium-weight woven with a little stretch (cotton sateen, stretch twill, suiting)',
    aline: 'light to medium-weight woven (cotton poplin, linen, chambray)',
    gathered: 'light woven that gathers softly (cotton lawn, voile, viscose challis)',
    circle: 'drapey woven (viscose crepe, rayon challis, light crepe) so the skirt falls in soft folds',
    top: 'light woven (cotton lawn, poplin, viscose, crepe de chine)',
    trousers: 'medium-weight woven with body (cotton twill, gabardine, linen, wool suiting)',
    blazer: 'medium-weight wool, wool blend, linen or cotton twill that holds a press',
    coat: 'coat-weight wool, melton, boiled wool or tweed',
  },

  supplies: (c) => {
    const out = [`<strong>${c.fabric}</strong> of ${c.width} cm wide fabric: ${c.hint}.`];
    if (c.zip) out.push(`One <strong>${c.zip} cm invisible zip</strong> and an invisible-zip presser foot.`);
    if (c.g === 'dress' || c.g === 'top') {
      out.push('Fusible interfacing strips, 2 cm wide, twice the zip length, to steady the zip seam.');
      out.push(`Double-fold bias binding, 1.2 cm wide: <strong>${c.binding}</strong>. You can make your own from leftover fabric.`);
      out.push('A hook and eye for the top of the zip.');
    }
    if (c.g === 'skirt' || c.g === 'trousers') {
      out.push(`Fusible interfacing for the waistband: a strip 10 cm × ${c.waistband}.`);
      out.push('One trouser hook and bar, or a button, for the waistband.');
    }
    if (c.corset) {
      out.push(`<strong>${c.corset.boning}</strong> of corset boning: spiral steel (or plastic for a softer corset), 6–7 mm wide, with end caps.`);
      if (c.corset.lacing) out.push(`<strong>${c.corset.eyelets} metal eyelets</strong> (5 mm) with a setting tool, and about 3 m of lacing cord or ribbon.`);
      out.push('Cotton coutil or canvas for the lining: the same amount as the main fabric.');
      out.push(`Bias binding for the bottom edge: <strong>${c.corset.binding}</strong>.`);
    }
    if (c.g === 'blazer' || c.g === 'coat') {
      out.push(`Medium-weight fusible interfacing: <strong>${c.interfacing}</strong>, 90 cm wide.`);
      out.push(`<strong>${c.buttons} buttons</strong>, ${c.g === 'coat' ? '25–30 mm' : '20–23 mm'} across${c.double ? ', plus 1 small inside button' : ''}.`);
      out.push('Shoulder pads (optional), and seam binding to finish the inside seams neatly.');
    }
    out.push('All-purpose polyester thread to match.');
    out.push("Pattern paper or tape, tailor's chalk or a washable marker, pins or pattern weights.");
    if (!c.sa) out.push('Your pattern has no seam allowance. Add 1.5 cm on all seams and the hem allowance with chalk as you cut.');
    return out;
  },

  steps: {
    pleats: { t: 'Fold the pleats', b: (p) => `On the right side of each skirt piece, mark the pleat lines with chalk: the solid lines are fold lines and the dashed lines are placement lines. Fold the fabric along each fold line and bring it over to the next placement line, following the arrows; all ${p.pleatsN} pleats face the same way. Pin, then baste across the waist. Stitch each pleat down from the waist to the hip line close to the fold, so the skirt fits smoothly over the hips. Press the pleats down to the hem with a damp press cloth.`, tip: () => 'Pressing is easier on a long ironing board with the skirt pinned flat to it.' },
    keyhole: { t: 'Finish the keyhole', b: () => 'Bind the curved keyhole edges with bias binding the same way as the neckline, folding the binding ends under at the bottom of the keyhole. At the top, sew a small button on one side of the neckline and a thread or fabric loop on the other.' },
    raglanJoin: { t: 'Sew the raglan seams', b: (p) => `Pin each front sleeve (${p.L.frontSleeve}) to the front (${p.L.front}) along the diagonal raglan seam, right sides together, matching the single notches, and sew with ${seam(p)}. Sew the back sleeves (${p.L.backSleeve}) to the back pieces (${p.L.back}) the same way, matching the double notches. Finish the edges together and press them toward the sleeve.` },
    raglanOverarm: { t: 'Sew the overarm seams', b: () => 'Fold each front sleeve onto its back sleeve, right sides together, and sew the overarm seam from the neckline over the shoulder down to the sleeve hem. Finish and press open.', tip: () => 'This seam replaces the shoulder seam, so keep the curve smooth at the shoulder point.' },
    raglanSides: { t: 'Sew the underarm and side seams', b: (p) => `Pin the front to the back from the sleeve hem, through the underarm and down the side to the ${p.g === 'dress' ? 'waist' : 'hem'}, matching the raglan seams exactly at the underarm. Sew in one continuous seam, clip the curve at the underarm, finish and press.` },
    corsetPanels: { t: 'Sew the corset panels', b: (p) => `Join the centre front (${p.L.corsetCF}) to the side fronts (${p.L.corsetSF}) along the curved seams, right sides together, matching the notches at the bust. Join each centre back (${p.L.corsetCB}) to its side back (${p.L.corsetSB}). Then sew the side seams. Clip the curves and press all seams open over a tailor's ham.`, tip: () => 'Pin the curved seams closely; the bust curve on the side front is meant to be fuller.' },
    corsetLining: { t: 'Make the lining', b: () => 'Sew the lining panels together the same way. The lining carries the boning, so use a firm fabric such as cotton coutil or canvas.' },
    corsetBoning: { t: 'Add the boning channels', b: () => 'On the lining, press each seam allowance to one side and stitch two lines 8 mm apart over it to form a channel, or sew boning tape over the seam. Add channels along the centre front and next to each back edge. Measure each channel, cut the bones 1.5 cm shorter and cap or file the ends. Leave the bones out until the top edge is sewn.', tip: () => 'Spiral steel bones bend with the body; use flat steel next to the back opening.' },
    corsetTop: { t: 'Sew the top edge', b: () => 'Place the corset and lining right sides together and sew along the top edge and the back edges. Trim, clip the curves, turn right side out and press. Understitch the lining so it stays inside. Slide the bones into the channels from the bottom.' },
    corsetLacing: { t: 'Set the eyelets and lace up', b: () => 'Mark the eyelets along each back edge at the marks on the pattern, 1.5 cm in from the edge. Punch the holes and set metal eyelets with a setting tool through all layers. Lace from the waist outward in both directions, so you can tighten at the waist.', tip: () => 'A 6 cm strip of fabric sewn behind the lacing on one side covers the gap.' },
    corsetZip: { t: 'Insert the zip', b: (p) => `Unpick the lining at the centre back. Sew a ${p.zip} cm separating or invisible zip to the corset fabric along the back edges, then fold the lining edges under and hand-stitch them to the zip tape.` },
    corsetBottom: { t: 'Finish the bottom edge', b: () => 'Trim the corset fabric and lining level at the bottom. Bind the edge with bias binding, catching both layers and closing the boning channels.' },
    prepare: { t: 'Prepare your fabric', b: (p) => (p.wool
      ? 'Steam the wool evenly with your iron held just above it, then let it dry flat. This pre-shrinks it so the garment keeps its size when pressed.'
      : 'Wash and dry the fabric the way you will wash the finished garment, then press it. This shrinks it now instead of after you have sewn it.'),
    tip: (p) => (p.g === 'dress' || p.g === 'top' ? 'Pre-wash the bias binding too if it is cotton.' : null) },
    print: { t: 'Print and assemble the pattern', b: () => 'Print the pattern at <strong>100% / actual size</strong> (turn off "fit to page"). Measure the 10 cm test square on the first page. If it is off by more than 1 mm, fix the printer scale and print again. Trim the left and top edge of each page along the grey frame, then butt the pages together in the grid shown on the overview page so the lines continue across, and tape them.', tip: () => 'Lay out all pages before taping so you can see the whole sheet.' },
    cutPaper: { t: 'Cut out the paper pieces', b: (p) => `Cut each piece along the solid outer line. The dashed line is where you will stitch${p.sa ? `; the ${p.sa} between the lines is the seam allowance` : ''}. Keep the darts, notches and grainlines visible.` },
    layout: { t: 'Lay out and cut the fabric', b: (p) => `Fold the fabric lengthwise with right sides together so the selvedges meet. Place pieces marked <em>Place on fold</em> with that edge exactly on the fold. Lay every other piece with its grainline parallel to the selvedge: measure from both ends of the arrow to the selvedge and adjust until the distances match. Pin or weight the pieces and cut along the solid line. The Fabric & cutting tab shows a suggested layout.${p.cut1 ? ' Pieces marked "Cut 1" are cut through one layer only.' : ''}${p.circle ? ' For the circle skirt, cut the waist curve a little small first; you can trim it to fit later.' : ''}${p.lining ? ' Cut the pieces marked "lining" again from the lining fabric.' : ''}${p.interfacing ? ' Cut the pieces marked "interfacing" again from fusible interfacing, without seam allowance at the hem.' : ''}`,
      tip: (p) => (p.oversize ? `Some pieces are wider than your folded fabric (${p.oversize}). Open the fabric out flat and cut them one at a time, flipping the paper over for the second piece.` : 'Cut one piece at a time with long, steady strokes.') },
    transfer: { t: 'Transfer the markings', b: (p) => `Snip 3 mm into the seam allowance at every notch. Mark each dart's legs and point with chalk on the wrong side.${p.upper ? ' Mark the bust point lightly; it helps you check the darts end in the right place.' : ''}${p.g === 'trousers' ? ' Press a crease along the grainline of each leg: it is the centre crease of the finished trousers.' : ''}${p.jacket ? ' Mark the button positions, the roll line and the collar dots with tailor tacks.' : ''}` },
    interfacing: { t: 'Fuse the interfacing', b: (p) => `Fuse interfacing to the wrong side of the front facings (${p.L.facing}), back neck facing (${p.L.backFacing})${p.L.collar ? ` and one collar piece (${p.L.collar}), the under collar` : ''}. Use a press cloth and press without sliding, about 10–15 seconds in each spot. Let the pieces cool flat before you move them.`, tip: () => 'Also fuse a 2 cm strip along the hem fold of the fronts, backs and sleeves for a crisp hem.' },
    staystitch: { t: 'Staystitch the neckline', b: (p) => `On the front and back pieces, stitch around the neckline ${p.sa ? `about ${p.fmt(Math.max(p.saN - 0.3, 0.5))} from the edge` : 'just inside the seam line'}, using a normal stitch length. This stops the curved edge from stretching while you work.` },
    bodiceDarts: { t: 'Sew the bodice darts', b: (p) => {
      let s = "Fold each dart right sides together, matching the legs, and pin. Stitch from the wide end to the point, tapering so the last few stitches run right along the fold. Don't backstitch at the point; leave long thread tails and tie them in a knot.";
      if (p.fisheye) s += ' The long waist darts have two points: start at the widest part at the waist and sew toward one point, then turn the piece and sew from the waist to the other point. Clip the fold at the waist so the dart lies flat.';
      const dir = { sideWaist: 'Press side darts downward and waist darts toward the centre.', waist: 'Press the waist darts toward the centre.', shoulder: 'Press shoulder darts toward the centre and waist darts toward the centre.', side: 'Press the side darts downward.' }[p.darts] || '';
      return `${s} ${dir}`;
    }, tip: () => 'Pressing darts over a rolled towel keeps the curve and avoids a pointed tip.' },
    shoulders: { t: 'Join the shoulders', b: (p) => `Place the front (${p.L.front}) on the back (${p.L.back}) right sides together and sew the shoulder seams with ${seam(p)}. The back shoulder is slightly longer, so ease it in gently. Finish the raw edges with a zigzag or overlocker and press the seams open.` },
    cbSeam: { t: 'Sew the centre back seam', b: (p) => `Pin the two back pieces (${p.L.back}) right sides together along the centre back and sew with ${seam(p)}. Finish the edges and press the seam open.` },
    sides: { t: 'Sew the side seams', b: (p) => `Pin the front and back together at the side seams, right sides together, matching the notches, and sew. Finish the edges and press open.${p.g === 'dress' ? '' : ' Leave the hem unfinished for now.'}` },
    sleevesPrep: { t: 'Prepare the sleeves', b: (p) => `On each sleeve (${p.L.sleeve}), sew two rows of long basting stitches across the cap between the front and back notches, one just inside the seam line and one in the seam allowance. Fold the sleeve right sides together and sew the underarm seam. Finish and press open.`, tip: (p) => `The cap is about ${p.capEase} longer than the armhole on purpose. That ease rounds the sleeve over your shoulder.` },
    sleevesSet: { t: 'Set in the sleeves', b: () => 'Turn the garment inside out and the sleeve right side out. Slip the sleeve into the armhole so the right sides face. Match the underarm seams, the single notch to the front armhole, the double notch to the back, and the top notch to the shoulder seam. Gently pull the basting threads to ease the cap until it fits, spreading the fullness evenly with no tucks. Sew with the sleeve on top, remove the basting and finish the edges together.', tip: (p) => (p.jacket ? 'If you are using shoulder pads, hand-stitch them to the shoulder seam allowance now, extending 1 cm into the sleeve cap.' : 'Check that the left sleeve goes in the left armhole: the single notch always faces the front.') },
    bindArmholes: { t: 'Bind the armholes', b: () => 'Open one fold of the bias binding and pin it right sides together around the armhole, starting at the side seam. Stitch in the fold line, trim the seam allowance to 5 mm, then wrap the binding to the inside and topstitch it down close to the edge. Overlap the binding ends by 1 cm at the side seam.', tip: () => 'Press the binding into a curve before pinning it. It will sit much flatter.' },
    skirtDarts: { t: 'Sew the skirt darts', b: (p) => `Sew the ${p.skirtDartsN === 2 ? 'two darts on each side' : 'darts'} of the front skirt (${p.L.frontSkirt}) and back skirt (${p.L.backSkirt}) from the waist to the point, tapering off at the fold. Press them toward the centre.` },
    gather: { t: 'Gather the skirt', b: () => "Sew two rows of long basting stitches along the waist edge of each skirt piece, within the seam allowance. Leave long thread tails and don't backstitch." },
    circleHang: { t: 'Let the circle skirt hang', b: () => 'Hang the skirt pieces for 24 hours before hemming. Parts of a circle skirt are cut on the bias and will stretch and drop, so hemming too early gives an uneven hem.' },
    skirtSides: { t: 'Sew the skirt side seams', b: (p) => `Place the front skirt (${p.L.frontSkirt}) on the back skirt pieces (${p.L.backSkirt}), right sides together, and sew the side seams. Finish the edges and press open. Leave the centre back open for now.` },
    joinWaist: { t: 'Join the bodice to the skirt', b: (p) => (p.gathered
      ? 'Pin the skirt to the bodice at the waist, right sides together, matching side seams, centre front and the centre notches. Pull the basting threads to gather the skirt until it fits the bodice exactly, spreading the gathers evenly. Sew with the gathered side up, remove the basting, finish the edges together and press the seam toward the bodice.'
      : 'Pin the skirt to the bodice at the waist, right sides together, matching the side seams, centre front and the darts. Sew, finish the edges together and press the seam toward the bodice.'),
    tip: (p) => (p.circle ? 'If the skirt waist has stretched, ease it back in before joining.' : null) },
    zipBack: { t: 'Insert the invisible zip', b: (p) => `Fuse the interfacing strips to the centre back seam allowances and finish both centre back edges. Open the zip and pin one side face-down to the right side of the left back, with the teeth on the seam line and the top stop 1 cm below the neckline seam. Stitch close to the teeth with the invisible zip foot, then repeat on the other side. Close the zip and sew the rest of the centre back seam from just below the zip to the hem${p.slit ? `, stopping ${p.slit} above the hem to leave a walking slit (notch on piece ${p.L.backSkirt})` : ''}.`, tip: (p) => (p.g === 'dress' ? 'Match the waist seams on both sides of the zip before you sew the second side.' : null) },
    zipSkirt: { t: 'Insert the zip', b: (p) => `Finish the centre back edges of the back skirt (${p.L.backSkirt}). Open the ${p.zip} cm invisible zip and stitch each side face-down to the right side of the back skirt, teeth on the seam line and the top stop at the waist seam line. Close the zip and sew the rest of the centre back seam to the hem${p.slit ? `, stopping ${p.slit} above the hem to leave a walking slit` : ''}.` },
    bindNeck: { t: 'Bind the neckline', b: () => 'Fold the ends of the bias binding under at the zip. Open one fold and pin it right sides together around the neckline. Stitch in the fold line, trim the seam allowance to 5 mm and clip the curve. Wrap the binding to the inside, press, and topstitch close to the edge. Sew a hook and eye above the zip.', tip: (p) => [p.neckV ? 'At the V point, stop with the needle down, clip almost to the stitching, pivot, and continue.' : '', p.openBack ? 'On an open back, stretch the binding very slightly as you pin it so the edge hugs your back instead of gaping.' : ''].filter(Boolean).join(' ') || null },
    waistbandPrep: { t: 'Prepare the waistband', b: (p) => `Fuse interfacing to the wrong side of the waistband (${p.L.waistband}). Press it in half lengthwise along the fold line, wrong sides together. Open it out and press under the seam allowance along one long edge.` },
    waistbandAttach: { t: 'Attach the waistband', b: (p) => `Pin the unpressed long edge of the waistband to the waist, right sides together, matching the side seams. Let one end extend 3 cm past the ${p.g === 'trousers' ? 'back edge of the zip opening' : 'zip on the left back'} as an underlap and the other end extend by just the seam allowance. Sew, then press the seam into the waistband. Fold the waistband right sides together at the ends and sew across each end. Turn it right side out, fold the pressed edge just over the seam on the inside, pin, and stitch in the ditch of the seam from the right side to catch it. Sew a hook and bar or a buttonhole and button on the ends.` },
    trouserDarts: { t: 'Sew the darts', b: (p) => `Sew the waist darts on the front (${p.L.trouserFront}) and back legs (${p.L.trouserBack}), from the waist to the point. Press them toward the centre.` },
    trouserSides: { t: 'Sew the side seams', b: (p) => `Place each front leg on its back leg, right sides together, matching the notches. Sew the side seams. On the left leg, leave the top ${p.zip} cm open for the zip. Finish the edges and press the seams open.` },
    zipSide: { t: 'Insert the side zip', b: (p) => `Finish the edges of the opening. Open the ${p.zip} cm invisible zip and stitch each side face-down to the right side of the opening, teeth on the seam line and the top stop at the waist seam line. Close the zip and stitch the last few centimetres of seam below it.` },
    inseams: { t: 'Sew the inside leg seams', b: () => 'Fold each leg right sides together and sew the inside leg seam from hem to crotch, matching the knee notches. The back is slightly shorter, so stretch it gently to fit. Finish and press open.' },
    crotch: { t: 'Sew the crotch seam', b: () => 'Turn one leg right side out and slip it inside the other, so the right sides face. Match the inside leg seams and pin the crotch curve from the front waist to the back waist. Sew in one go, then sew a second row on top through the lower curve for strength. Trim the curve to 1 cm, finish the edges together and press the upper part open.' },
    collarSew: { t: 'Make the collar', b: (p) => `Place the upper and under collar (${p.L.collar}) right sides together and sew along the outer edge and both ends, leaving the neck edge open. Trim the corners, grade the seam, turn right side out and press, rolling the seam slightly to the under side.` },
    joinFacings: { t: 'Join the facings', b: (p) => `Sew the front facings (${p.L.facing}) to the back neck facing (${p.L.backFacing}) at the shoulders, right sides together. Press the seams open and finish the inner edge of the facing.` },
    collarAttach: { t: 'Attach the collar', b: () => 'Pin the under collar to the jacket neckline, right sides together, matching the centre back and the shoulder notches. Sew from one collar dot to the other, stopping exactly at the dots. Sew the upper collar to the facing neckline the same way. Clip the neckline curves almost to the stitching.' },
    facingAttach: { t: 'Sew on the facing', b: (p) => (p.collar === 'notched'
      ? "Place the facing unit on the jacket right sides together, matching the collar, lapels and hems. Sew from the hem up the front edge and around the lapel to the collar dot. Stop with the needle down, lift the collar out of the way, and continue around the collar to the other dot and down the other front. Trim the corners, clip into the notches, grade the seams, turn and press. Press the lapels gently along the roll line; don't make a sharp crease."
      : 'Place the facing unit on the jacket right sides together and sew from one hem, up the front edge, around the neckline and down the other front. Trim, grade and clip the curves, turn the facing to the inside and press.'),
    tip: () => 'Understitch the facing where you can, so it stays hidden inside.' },
    hemSleeves: { t: 'Hem the sleeves', b: (p) => `Press the sleeve hem up ${p.sleeveHem}, tuck the raw edge under 1 cm, and stitch by machine or by hand.` },
    hemSkirt: { t: 'Hem the skirt', b: (p) => (p.pleated ? `Let the pleats out at the hem. Press the hem up ${p.hem}, tuck the raw edge under 1 cm and stitch, then press the pleats back in place.` : p.circle
      ? 'Put the garment on and have someone mark an even hem with a ruler from the floor. Trim along the marks, then sew a narrow hem: press up 5 mm, then 5 mm again, and stitch.'
      : `Try it on and check the length. Press the hem up ${p.hem}, tuck the raw edge under 1 cm, and stitch.${p.aline ? ' The A-line hem is curved, so ease the extra fullness in as you press.' : ''}`) },
    hemTop: { t: 'Hem the top', b: (p) => `Try it on and check the length. Press the hem up ${p.hem}, tuck the raw edge under 1 cm, and stitch.` },
    hemTrousers: { t: 'Hem the trousers', b: (p) => `Try the trousers on with the shoes you will wear and check the length. Finish the raw edge, press the hem up ${p.hem} and hand-stitch it with a blind hem stitch. Press the centre crease again.` },
    hemJacket: { t: 'Hem the garment', b: (p) => `Press the hem of the body and sleeves up ${p.hem}. At the front, fold the facing back over the hem, right sides together, and stitch across along the hem line; trim and turn. Hand-stitch the hem with a catch stitch so nothing shows on the outside, and tack the facing edge to the seams inside.` },
    buttons: { t: 'Make buttonholes and sew on buttons', b: (p) => (p.closure === 'double'
      ? 'On a double-breasted closure, make horizontal buttonholes in the outer row of the right front, starting 0.3 cm outside the button mark. Sew the working buttons on the left front where the holes land, and the decorative buttons on the outer row of the right front. Sew a small button inside the left front to hold the under layer.'
      : 'Make horizontal buttonholes on the right front at the button marks, starting 0.3 cm outside the centre front toward the edge. Lap right over left and sew the buttons on the left front where the holes land, with a thread shank as tall as the fabric is thick.') },
    finalPress: { t: 'Final press and fit check', b: (p) => `Press the whole garment, using a press cloth on the right side${p.jacket ? ' and a tailor\'s ham for the shoulders and chest' : ''}. Try it on and check that the seams sit straight, the darts point to the right places and the closure lies flat.`, tip: () => 'Save your measurements in this app. Small changes, like adding 1 cm to a length, are easy to try for your next garment.' },
  },

  print: {
    overviewTitle: 'Rubikon sewing pattern',
    li1: 'Print every page at <b>100% / actual size</b>. Turn off "fit to page".',
    li2: (page) => `Measure the 10 cm square on page ${page}. It must be exactly 10 cm.`,
    li3: 'Trim the left and top edges of each page along the grey frame. Lay the pages out in this grid, butt each trimmed edge against the frame of its neighbour so the lines continue, and tape. Grey "skip" squares have no pattern and are not printed.',
    skip: 'skip', startHere: 'start here', tapeLeft: (x) => `tape to ${x} on the left`, tapeAbove: (x) => `tape to ${x} above`, printAt: 'Print at 100% · Rubikon',
  },
};
