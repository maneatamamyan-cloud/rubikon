# Rubikon

Sewing patterns drafted to your measurements, in English, Armenian and Russian. Choose what to sew, enter your measurements in centimetres, pick the style, and Rubikon draws a full-scale pattern with step-by-step sewing instructions.

## What it does

- **Seven garments:** dress, skirt, top, corset, trousers, blazer and coat. Each has its own measurements, style options, pattern pieces and steps.
- **Styles:** fit (fitted, regular, relaxed), neckline, sleeves (set-in or raglan), back (closed, V, low U or keyhole, with your own opening depth), skirt shape (pencil, A-line, gathered, circle or pleated with your own pleat count and depth), leg shape, lapel collar or collarless, single- or double-breasted.
- **Corset:** four boned panels per side with curved bust seams, sweetheart or straight top edge, back lacing with eyelet marks or a zip.
- **Dart options:** bodice darts (side + waist, waist only, shoulder + waist, side only, none) and skirt or trouser darts (1, 2 or none).
- **Prints at true scale** on A4 or US Letter pages, with a 10 cm test square and an overview page showing how to tape the pages together. You can also download one full-size SVG for a print shop or plotter.
- **Fabric & cutting:** fabric amount for 110, 140 or 150 cm fabric, a cutting list, supplies and a suggested layout.
- **Sewing steps** tailored to the chosen options, which you can tick off as you sew.
- Remembers your measurements and choices in the browser.

## Run it locally

It's a static site with no build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly from disk won't work, because browsers block JavaScript modules on `file://`.)

## Deploy to Netlify

1. Push this repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick the repository.
3. Leave the build command empty and the publish directory as `.` (already set in `netlify.toml`), then deploy.

Every push to the main branch redeploys the site automatically.

## Project layout

All files sit in one folder:

```
index.html            page structure
style.css             styles (white, navy #043069 and rose)
app.js                form, tabs, preview, printing and downloads
draft.js              pattern drafting from measurements
geometry.js           curves, seam-allowance offsetting, helpers
render.js             SVG drawing, sheet layout and fabric layout
instructions.js       supplies, cutting list and sewing steps
en.js, hy.js, ru.js   English, Armenian and Russian text
favicon.svg           browser tab icon
netlify.toml          Netlify settings
```

## A note on fit

Rubikon drafts a basic pattern from standard drafting proportions. Bodies vary, so sew a quick test version (a toile) in inexpensive fabric, adjust your measurements, and then cut your good fabric.
