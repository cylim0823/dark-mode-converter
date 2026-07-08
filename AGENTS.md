# AGENTS.md

Guidance for Codex or future AI coding agents working on this repository.

## Project Overview

This project is a free browser-only PDF Light Mode to Dark Mode Converter.

The app allows a user to upload a PDF, preview it, convert it to dark mode locally in the browser, and download the converted PDF.

The MVP should be simple, private, reliable, and free to use.

## MVP First Rule

The project must focus on the core PDF dark mode converter MVP before becoming a larger PDF toolbox.

For the MVP, stay focused on:

* Upload PDF
* Preview first page
* Convert PDF to dark mode
* Download converted PDF
* Browser-only processing
* No server upload
* No login
* No backend
* No database
* No analytics
* No tracking
* No ads
* No donations
* No payment features
* Free public tool

Agents must not expand the project into many tools before the dark mode converter MVP is stable.

## Core Rules

* Always read `README.md`, `ROADMAP.md`, and `AGENTS.md` before making changes.
* Inspect the existing project structure before editing.
* Keep changes scoped to the current task.
* Do not add unrelated features.
* Do not add backend services unless explicitly requested and approved.
* Do not add database logic.
* Do not add login or account systems.
* Do not add analytics or tracking.
* Do not add ads.
* Do not add donation flows.
* Do not add payment features or commercial upgrade flows.
* Do not add API keys, secrets, or environment secrets.
* Do not copy UI, text, branding, or source code from other websites.
* External websites may only be used as functional references.

## Future Tool Boundaries

Future ideas may include:

* PDF text extractor
* Image to PDF
* Batch PDF tools
* Word to PDF
* PowerPoint to PDF

Do not implement these tools unless explicitly requested later.

Word to PDF and PowerPoint to PDF conversion must not be implemented unless explicitly requested later. Accurate conversion may require backend/server processing, external document engines, or platform-specific tools.

Backend/server processing must not be added unless explicitly approved.

The project remains free and browser-only for the MVP.

## Recommended Stack

Use:

* TypeScript
* Vite
* HTML
* CSS
* PDF.js
* pdf-lib

Avoid:

* Backend server for MVP
* Database
* Heavy frontend framework unless specifically requested
* Authentication
* Cloud PDF processing
* File upload to server
* Payment features
* Ads
* Donation flows

## Privacy Requirement

The PDF must be processed locally in the browser.

The MVP must not upload the user's PDF to any server.

The UI should clearly communicate:

"Your PDF is processed locally in your browser and is not uploaded."

## MVP Conversion Approach

For Version 1, use a rasterized conversion approach:

1. Load PDF using PDF.js.
2. Render each page to a canvas.
3. Apply dark mode pixel transformation.
4. Export each converted page as an image.
5. Create a new PDF using pdf-lib.
6. Download the converted PDF using a Blob URL.

This approach may lose selectable text and searchable text. This limitation must be documented in the UI and README.

## Code Organization

Prefer modular code.

Suggested structure:

```text
src/
  main.ts
  styles.css
  pdf/
    loadPdf.ts
    renderPage.ts
    convertCanvas.ts
    createDarkPdf.ts
  ui/
    state.ts
```

Keep PDF logic separate from UI logic where practical.

## UI Requirements

The MVP UI should include:

* App title
* Short explanation
* Privacy message
* Upload area
* File picker
* Drag-and-drop upload
* Selected file name
* File size
* Page count
* First page preview
* Conversion style selector
* Strength slider
* Render quality selector
* Convert button
* Progress text
* Download button
* Error messages
* Limitation note

The layout should work on desktop and mobile.

## Conversion Settings

Support these conversion styles:

* Classic Invert
* Soft Dark
* High Contrast
* Warm Dark

Support these quality options:

* Low
* Balanced
* High

Support these output modes:

* Image-based PDF, stable
* Experimental structure-preserving mode

Image-based PDF must remain the default stable mode. Experimental structure-preserving mode must stay clearly labeled, optional, and safe to fall back to the stable image-based export.

The exact visual algorithm can be improved over time. Prioritize readability and reliability first.

## Advanced PDF Support Status

Structure-preserving dark-mode conversion is experimental only.

Do not promise perfect preservation of selectable text, searchable text, links, annotations, forms, bookmarks, or embedded structure.

Do not replace the stable rasterized conversion flow unless explicitly requested and proven safe.

Browser-only libraries can load, render, copy, and create PDF files, but reliable structure-preserving recoloring may require careful low-level PDF content stream rewriting. Keep this work modular and easy to disable.

## Download Requirement

The download must be reliable.

Use a Blob URL and an anchor element with the `download` attribute.

Clean up old Blob URLs when a new conversion is created.

Do not depend on server-side file generation.

## Error Handling

Handle these cases clearly:

* No file selected
* Non-PDF file selected
* Invalid PDF
* Encrypted or password-protected PDF
* Very large PDF
* Conversion failure
* Browser memory limitation

Error messages should be friendly and understandable.

## Performance Rules

* Use async/await.
* Show progress during conversion.
* Avoid freezing the UI where possible.
* Release canvas memory when practical.
* Avoid keeping unnecessary large objects in memory.
* Process pages sequentially for MVP unless parallel processing is proven safe.

## Testing

Add tests for pure conversion functions if a test framework exists.

If no test framework exists, do not over-engineer a test setup. Add clear manual testing steps instead.

Manual tests should include:

* 1-page PDF
* Multi-page PDF
* PDF with images
* PDF with highlights
* PDF with colored charts
* Scanned PDF
* Large PDF
* Download behavior
* Mobile browser behavior
* Warm Dark style
* Experimental mode warning and safe fallback behavior

## Deployment

The app should be deployable to GitHub Pages.

If using Vite for a project site, configure the base path correctly.

Do not break local development while preparing GitHub Pages deployment.

## Definition of Done for MVP

The MVP is done when:

* The app loads in the browser.
* User can upload a PDF.
* First page preview works.
* User can choose dark mode settings.
* User can convert the PDF.
* Progress is shown during conversion.
* User can download the converted PDF.
* The downloaded PDF opens correctly.
* The app works without a backend.
* Privacy and limitations are clearly documented.
