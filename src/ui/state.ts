import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ConversionSettings } from "../pdf/convertCanvas";

export interface AppState {
  file: File | null;
  pdf: PDFDocumentProxy | null;
  pageCount: number;
  isConverting: boolean;
  settings: ConversionSettings;
}

export const initialState: AppState = {
  file: null,
  pdf: null,
  pageCount: 0,
  isConverting: false,
  settings: {
    style: "classic",
    strength: 85,
    quality: "high",
  },
};
