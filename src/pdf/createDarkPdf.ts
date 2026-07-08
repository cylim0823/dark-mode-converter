import { PDFDocument } from "pdf-lib";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { applyDarkModeToCanvas, getQualityScale, type ConversionSettings } from "./convertCanvas";
import { getPdfPageSize, renderPdfPageToCanvas } from "./renderPage";

export type ProgressCallback = (currentPage: number, totalPages: number) => void;

export async function createDarkPdf(
  pdf: PDFDocumentProxy,
  settings: ConversionSettings,
  onProgress: ProgressCallback,
): Promise<Blob> {
  const outputPdf = await PDFDocument.create();
  const scale = getQualityScale(settings.quality);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress(pageNumber, pdf.numPages);

    let canvas: HTMLCanvasElement | null = null;

    try {
      const pageSize = await getPdfPageSize(pdf, pageNumber);
      canvas = await renderPdfPageToCanvas(pdf, pageNumber, scale);

      applyDarkModeToCanvas(canvas, settings);

      const imageBlob = await canvasToBlob(canvas);
      const imageBytes = await imageBlob.arrayBuffer();
      const image = await outputPdf.embedJpg(imageBytes);
      const page = outputPdf.addPage([pageSize.width, pageSize.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageSize.width,
        height: pageSize.height,
      });
    } catch (error) {
      throw new Error(getPageConversionError(pageNumber, error));
    } finally {
      if (canvas) {
        releaseCanvas(canvas);
      }
    }

    await yieldToBrowser();
  }

  const bytes = await outputPdf.save();
  const pdfBytes = new Uint8Array(bytes.byteLength);
  pdfBytes.set(bytes);

  return new Blob([pdfBytes], { type: "application/pdf" });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("The browser could not export one of the converted pages."));
      },
      "image/jpeg",
      0.92,
    );
  });
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}

function getPageConversionError(pageNumber: number, error: unknown): string {
  if (error instanceof Error) {
    return `Conversion failed on page ${pageNumber}: ${error.message}`;
  }

  return `Conversion failed on page ${pageNumber}.`;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}
