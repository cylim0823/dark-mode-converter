import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export async function loadPdfFromFile(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  validatePdfFile(file);

  let task: pdfjsLib.PDFDocumentLoadingTask | null = null;

  try {
    const data = await file.arrayBuffer();
    task = pdfjsLib.getDocument({
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    return await task.promise;
  } catch (error) {
    if (task) {
      await task.destroy().catch(() => undefined);
    }

    throw new Error(getFriendlyPdfError(error));
  }
}

export function validatePdfFile(file: File): void {
  const looksLikePdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!looksLikePdf) {
    throw new Error("Please choose a PDF file.");
  }

  if (file.size === 0) {
    throw new Error("This PDF appears to be empty. Please choose another file.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      "This PDF is very large for browser memory. Try a smaller file, or close other tabs and try again.",
    );
  }
}

function getFriendlyPdfError(error: unknown): string {
  const name = getErrorText(error, "name").toLowerCase();
  const message = getErrorText(error, "message").toLowerCase();
  const code = getErrorText(error, "code").toLowerCase();

  if (error instanceof Error && isValidationErrorMessage(message)) {
    return error.message;
  }

  if (name.includes("password") || message.includes("password") || code.includes("password")) {
    return "This PDF appears to be password-protected. Please unlock it and try again.";
  }

  if (
    name.includes("invalid") ||
    message.includes("invalid") ||
    message.includes("corrupt") ||
    message.includes("damaged") ||
    message.includes("missing") ||
    message.includes("unexpected")
  ) {
    return "This PDF could not be opened. It may be damaged or unsupported.";
  }

  return "The PDF could not be loaded. Please try another file.";
}

function isValidationErrorMessage(message: string): boolean {
  return (
    message.includes("please choose a pdf") ||
    message.includes("appears to be empty") ||
    message.includes("very large for browser memory")
  );
}

function getErrorText(error: unknown, key: "name" | "message" | "code"): string {
  if (error && typeof error === "object" && key in error) {
    const value = (error as Record<string, unknown>)[key];
    return String(value);
  }

  return "";
}
