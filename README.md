# Dark Mode Converter

A simple web app for turning PDFs into dark-mode PDFs in the browser.

Live website:

```text
https://cylim0823.github.io/dark-mode-converter/
```

The app runs entirely in the browser. PDF conversion happens locally on the user's device, with no backend server, login, account, or upload step.

## Core Features

The main page includes:

* Drag-and-drop file upload
* Normal file picker upload
* Batch PDF selection
* Clickable and removable selected-file list
* Word and PowerPoint file acceptance
* Selected file name
* File size
* Page count
* Dark preview for any PDF page with previous/next controls and page number entry
* Dark mode conversion settings
* Live preview updates when style, strength, or quality changes
* Convert button
* Progress display
* Download button
* Per-file downloads for batch conversion
* Clear error messages
* Mobile-friendly layout

Current conversion settings include:

* Classic Invert
* Soft Dark
* High Contrast
* Warm Dark
* Low and High render quality

## Conversion Method

Flow:

1. User uploads one or more files.
2. PDF.js loads the PDF files.
3. The preview renders the selected page with the chosen dark mode settings.
4. Each PDF page is rendered to a canvas.
5. A dark mode pixel transformation is applied.
6. Each converted page is embedded into a new PDF using pdf-lib.
7. The final PDF downloads using a Blob URL.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

The local development server normally prints a URL like:

```text
http://localhost:5173/
```

Type-check the TypeScript code:

```bash
npm run typecheck
```

Build production version:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

The preview server normally prints a URL like:

```text
http://localhost:4173/
```

## Deployment

The app is published as a GitHub Pages static website:

```text
https://cylim0823.github.io/dark-mode-converter/
```

Deployment is handled by GitHub Actions from the `main` branch. For a GitHub Pages project-site build, use:

```bash
npm run build:pages
```

This outputs the static site to:

```text
dist/
```

The Pages build uses relative asset paths, so it works under any repository name. For local production checks, use the normal build:

```bash
npm run build
```

After pushing to `main`, check the GitHub Actions deployment run and then verify the live URL above.

## Manual Testing Checklist

Test with:

* 1-page PDF
* Multi-page PDF
* PDF with images
* PDF with colored highlights
* PDF with black text on white background
* PDF with scanned pages
* PDF with colored charts
* Large PDF
* Mobile browser
* Download behavior after conversion
* Warm Dark style
* Batch dark conversion with multiple PDFs
* Switching preview between selected PDFs
* Removing a selected file before conversion
* Word/PPT file selection
