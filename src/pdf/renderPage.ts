import type { PDFDocumentProxy } from "pdfjs-dist";

const MAX_CANVAS_PIXELS = 32_000_000;

export async function renderPdfPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const canvasWidth = Math.ceil(viewport.width);
  const canvasHeight = Math.ceil(viewport.height);

  try {
    if (canvasWidth * canvasHeight > MAX_CANVAS_PIXELS) {
      throw new Error("This page is too large for the selected render quality. Try Low quality.");
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      throw new Error("The browser could not create a canvas for this PDF page.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas;
  } catch (error) {
    canvas.width = 0;
    canvas.height = 0;
    throw error;
  } finally {
    page.cleanup();
  }
}

export async function getPdfPageSize(pdf: PDFDocumentProxy, pageNumber: number): Promise<{ width: number; height: number }> {
  const page = await pdf.getPage(pageNumber);

  try {
    const viewport = page.getViewport({ scale: 1 });

    return {
      width: viewport.width,
      height: viewport.height,
    };
  } finally {
    page.cleanup();
  }
}
