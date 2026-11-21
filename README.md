# ZenTools

A browser-first toolkit for QR/barcode scanning, image/PDF conversion, image adjustments and generators.

## Requirements
- Node.js 18.18+ (Node 20 LTS recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```
The production site is generated in `dist/`.

## Deploy
### Netlify
1. Push this folder to a GitHub repository.
2. Import the repository in Netlify.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add your custom domain in Domain settings and follow the DNS instructions.

### Cloudflare Pages
1. Connect the Git repository to Cloudflare Pages.
2. Framework preset: Vite
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Add your custom domain in Pages > Custom domains.

### cPanel / shared hosting
1. Run `npm install` and `npm run build` on your computer.
2. Upload the **contents** of `dist/` into `public_html/`.
3. Ensure the host serves `index.html` for the root path.
4. For SPA route fallback (if you add routes later), configure rewrites to `index.html`.

## Important implementation notes
- QR image decoding uses jsQR. Barcode decoding uses ZXing Browser.
- Camera access requires HTTPS or localhost and user permission.
- PDF generation uses jsPDF; merge/reorder/structural optimization uses pdf-lib; PDF page rendering uses PDF.js.
- Files are processed locally in the browser. No application backend or upload endpoint is included.
- Browser-only PDF "compression" re-saves document structures and may not reduce every PDF. It does not promise aggressive image recompression.
- Image export quality is limited by the original image. Upscaling pixels does not recreate missing detail; no AI upscaler is included.
- PDF to image exports one PNG per page. Very large PDFs can use substantial device memory.
- Google Fonts are loaded remotely for typography; replace the @import in `src/styles.css` with local fonts if you need a fully offline UI.
- For a stricter production release, add automated tests, file-size/page-count limits, accessibility testing and cross-browser QA.
