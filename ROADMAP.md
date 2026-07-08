# Roadmap

This roadmap keeps the project focused on the PDF dark mode converter.

## Current Implementation Status

The current app includes:

* Browser-based PDF upload.
* Batch PDF selection.
* Clickable and removable selected-file list.
* Word and PowerPoint file selection.
* File name, file size, and page count display.
* Dark preview for any PDF page with previous/next controls and page number entry.
* Live preview updates for conversion style, strength, and quality.
* Classic Invert, Soft Dark, High Contrast, and Warm Dark styles.
* Low and High render quality.
* Sequential PDF conversion.
* Blob URL downloads.
* GitHub Pages build support.

## Phase 1: Project Setup

Goal: Create the basic web app foundation.

Tasks:

* Set up Vite with TypeScript.
* Create basic HTML/CSS layout.
* Add upload area.
* Add drag-and-drop support.
* Add normal file picker support.
* Add basic app state.
* Add clear error display area.
* Add privacy message.

Success criteria:

* The app runs locally.
* User can select or drop a PDF.
* The UI shows the selected file name and file size.
* Non-PDF files are rejected with a clear message.

## Phase 2: PDF Loading and Preview

Goal: Load PDFs in the browser and preview the first page.

Tasks:

* Add PDF.js.
* Load uploaded PDF from an ArrayBuffer.
* Detect page count.
* Render first page to a preview canvas.
* Show page count in the UI.
* Handle invalid or encrypted PDFs gracefully.

Success criteria:

* A normal PDF can be loaded.
* The first page is previewed.
* Page count is shown.
* Broken or unsupported PDFs show useful errors.

## Phase 3: Dark Mode Conversion

Goal: Convert PDF pages to dark mode.

Tasks:

* Render each PDF page to a canvas.
* Add color conversion functions.
* Support conversion styles:
  * Classic Invert
  * Soft Dark
  * High Contrast
  * Warm Dark
* Add strength slider.
* Add render quality selector:
  * Low
  * High
* Show conversion progress.

Success criteria:

* A multi-page PDF can be converted page by page.
* Progress updates while converting.
* Converted pages look readable in dark mode.

## Phase 4: PDF Export and Download

Goal: Create and download the converted PDF reliably.

Tasks:

* Add pdf-lib.
* Create a new PDF.
* Embed converted page canvases as images.
* Preserve page aspect ratio as closely as possible.
* Generate a Blob URL.
* Trigger download using an `<a download>` element.
* Clean up Blob URLs after use.

Success criteria:

* User can download the converted PDF.
* Download works consistently after conversion.
* Output PDF opens correctly in common PDF readers.

## Phase 5: UX Polish

Goal: Make the app feel clean and trustworthy.

Tasks:

* Improve layout spacing.
* Add responsive mobile design.
* Add loading state.
* Add disabled states for buttons.
* Add clear success message after conversion.
* Keep supporting copy compact and avoid extra footer clutter.

Success criteria:

* App looks presentable.
* User understands the privacy model.
* User can complete the core conversion flow.
* App works on desktop and mobile.

## Phase 6: GitHub Pages Deployment

Goal: Publish the MVP online.

Tasks:

* Configure Vite build for GitHub Pages.
* Add deployment instructions.
* Test production build locally.
* Deploy to GitHub Pages.
* Verify upload, preview, convert, and download on the live site.

Success criteria:

* Live website is accessible.
* PDF conversion works on the live website.
* Download works on the live website.

## Phase 7: Better Conversion Quality

Goal: Improve output quality after the MVP conversion flow is working.

Implemented foundation:

* Improved Classic Invert, Soft Dark, and High Contrast heuristics.
* Added Warm Dark mode.
* Added reusable luminance, brightness, chroma, contrast, and HSL helper functions.
* Improved black text on white background readability.
* Improved colored highlight handling.
* Reduced harsh image inversion where practical.

Ongoing improvements:

* Keep complex images closer to original colors.
* Improve scanned PDF readability across more source quality levels.
* Add background-only darkening experiments.

## Phase 8: UI Simplification

Goal: Keep the converter easy to use.

Implemented:

* Removed the output mode selector.
* Kept render quality to Low and High.
* Removed extra footer and long explanatory copy from the main page.

## Phase 9: Preview Improvements

Goal: Make preview match the actual conversion result.

Implemented:

* Preview supports any page in the PDF.
* Preview uses previous/next controls to avoid long scrolling.
* Preview renders one selected page at a time to keep large PDFs responsive.
* Small PDFs can be previewed completely when they are 10 pages or fewer.
* Preview updates when conversion style changes.
* Preview updates when strength changes.
* Preview updates when quality changes.

## Phase 10: File Type Handling

Goal: Accept the file types users are likely to try.

Implemented:

* PDF files are converted.
* Word and PowerPoint files are accepted by the picker.
* Unsupported files are listed clearly.

## Phase 11: Batch PDF Tools

Goal: Support multiple PDF files or repeated PDF tasks.

Implemented:

* Combined batch conversion into the main converter.
* Supports multiple selected PDF files.
* Lets users switch the active preview between selected PDFs.
* Lets users remove unwanted files before conversion.
* Processes PDFs sequentially to reduce browser memory risk.
* Creates a separate Blob download link for each converted PDF.

## Phase 12: Word and PowerPoint File Support

Goal: Let users select Word and PowerPoint files without breaking the converter flow.

Implemented:

* Allows Word and PowerPoint files in the main file picker.
* Detects Office file types locally.
* Keeps the main PDF conversion flow working when mixed file types are selected.
