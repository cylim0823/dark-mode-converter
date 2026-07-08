import "./styles.css";
import { createDarkPdf } from "./pdf/createDarkPdf";
import { applyDarkModeToCanvas, type ConversionStyle, type RenderQuality } from "./pdf/convertCanvas";
import { createDownloadUrl, formatFileSize, getBaseFileName, revokeDownloadUrls } from "./pdf/downloadUtils";
import { loadPdfFromFile } from "./pdf/loadPdf";
import { renderPdfPageToCanvas } from "./pdf/renderPage";
import { initialState, type AppState } from "./ui/state";

type FileKind = "pdf" | "office" | "unsupported";

const state: AppState = { ...initialState, settings: { ...initialState.settings } };

const dropZone = getElement<HTMLDivElement>("dropZone");
const fileInput = getElement<HTMLInputElement>("fileInput");
const browseButton = getElement<HTMLButtonElement>("browseButton");
const fileName = getElement<HTMLElement>("fileName");
const fileSize = getElement<HTMLElement>("fileSize");
const pageCount = getElement<HTMLElement>("pageCount");
const styleSelect = getElement<HTMLSelectElement>("styleSelect");
const strengthSlider = getElement<HTMLInputElement>("strengthSlider");
const strengthValue = getElement<HTMLElement>("strengthValue");
const qualitySelect = getElement<HTMLSelectElement>("qualitySelect");
const convertButton = getElement<HTMLButtonElement>("convertButton");
const downloadLink = getElement<HTMLAnchorElement>("downloadLink");
const downloadList = getElement<HTMLDivElement>("downloadList");
const progressText = getElement<HTMLElement>("progressText");
const successText = getElement<HTMLElement>("successText");
const errorText = getElement<HTMLElement>("errorText");
const previewFrame = getElement<HTMLDivElement>("previewFrame");
const previewStatus = getElement<HTMLElement>("previewStatus");
const previousPreviewButton = getElement<HTMLButtonElement>("previousPreviewButton");
const nextPreviewButton = getElement<HTMLButtonElement>("nextPreviewButton");
const previewPageInput = getElement<HTMLInputElement>("previewPageInput");
const previewPageTotalText = getElement<HTMLElement>("previewPageTotalText");
const selectedFileList = getElement<HTMLUListElement>("selectedFileList");
const initialConvertButtonText = convertButton.textContent ?? "Convert";

let selectedFiles: File[] = [];
let selectedPdfFiles: File[] = [];
let selectedOfficeFiles: File[] = [];
let selectedUnsupportedFiles: File[] = [];
let downloadUrls: string[] = [];
let previewRenderToken = 0;
let activePreviewPage = 1;
let previewPageTotal = 0;

setupFileUpload();

styleSelect.addEventListener("change", () => {
  state.settings.style = styleSelect.value as ConversionStyle;
  resetDownloads();
  void refreshPreview();
});
qualitySelect.addEventListener("change", () => {
  state.settings.quality = qualitySelect.value as RenderQuality;
  resetDownloads();
  void refreshPreview();
});
strengthSlider.addEventListener("input", () => {
  state.settings.strength = Number(strengthSlider.value);
  strengthValue.textContent = `${state.settings.strength}%`;
  resetDownloads();
  void refreshPreview();
});
convertButton.addEventListener("click", () => {
  void convertSelectedPdfs();
});
previousPreviewButton.addEventListener("click", () => {
  void goToPreviewPage(activePreviewPage - 1);
});
nextPreviewButton.addEventListener("click", () => {
  void goToPreviewPage(activePreviewPage + 1);
});
previewPageInput.addEventListener("change", () => {
  void goToPreviewPage(Number(previewPageInput.value));
});
previewPageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    previewPageInput.blur();
    void goToPreviewPage(Number(previewPageInput.value));
  }
});
downloadLink.addEventListener("click", (event) => {
  if (!downloadUrls[0]) {
    event.preventDefault();
    showError(new Error("Convert a PDF before downloading."));
  }
});

window.addEventListener("beforeunload", () => {
  resetDownloads();
  releasePreviewCanvases();

  if (state.pdf) {
    void destroyPdf(state.pdf);
  }
});

function setupFileUpload(): void {
  browseButton.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("click", (event) => {
    if (event.target !== browseButton) {
      fileInput.click();
    }
  });
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => {
    void handleSelectedFiles(Array.from(fileInput.files ?? []));
  });
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-dragging");
  });
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
    void handleSelectedFiles(Array.from(event.dataTransfer?.files ?? []));
  });
}

async function handleSelectedFiles(files: File[]): Promise<void> {
  clearMessages();
  resetDownloads();
  resetPreview();
  await resetLoadedPreviewPdf();

  selectedFiles = files;
  syncSelectedFileGroups();
  renderSelectedFiles();
  updateFileDetails();

  if (files.length === 0) {
    convertButton.disabled = true;
    return;
  }

  if (selectedPdfFiles.length === 0) {
    convertButton.disabled = selectedOfficeFiles.length === 0;
    if (selectedOfficeFiles.length > 0) {
      progressText.textContent = "Word or PowerPoint selected.";
    } else {
      showError(new Error("No convertible PDF files were found."));
    }
    return;
  }

  await previewSelectedPdf(selectedPdfFiles[0], "Loading first PDF preview...");
}

async function renderPreviewPage(pdf: NonNullable<AppState["pdf"]>, pageNumber: number): Promise<void> {
  const renderToken = ++previewRenderToken;
  const hasExistingPreview = Boolean(previewFrame.querySelector("canvas"));

  updatePreviewControls();
  previewStatus.textContent = `Rendering page ${pageNumber}...`;
  previewFrame.classList.toggle("is-rendering", hasExistingPreview);

  if (!hasExistingPreview) {
    previewFrame.replaceChildren();
  }

  let canvas: HTMLCanvasElement;

  try {
    canvas = await renderPdfPageToCanvas(pdf, pageNumber, getPreviewScale());
  } catch (error) {
    previewFrame.classList.remove("is-rendering");
    throw error;
  }

  if (renderToken !== previewRenderToken) {
    canvas.width = 0;
    canvas.height = 0;
    return;
  }

  applyDarkModeToCanvas(canvas, state.settings);
  releasePreviewCanvases();
  canvas.className = "preview-canvas is-entering";
  previewFrame.replaceChildren(canvas);
  requestAnimationFrame(() => {
    canvas.classList.remove("is-entering");
  });
  previewStatus.textContent = "Preview ready";
  previewFrame.classList.remove("is-rendering");
  updatePreviewControls();
}

async function refreshPreview(): Promise<void> {
  if (!state.pdf || state.isConverting) {
    return;
  }

  try {
    await renderPreviewPage(state.pdf, activePreviewPage);
  } catch (error) {
    showError(error);
  }
}

async function goToPreviewPage(pageNumber: number): Promise<void> {
  if (!state.pdf) {
    return;
  }

  const requestedPage = Number.isFinite(pageNumber) ? Math.trunc(pageNumber) : activePreviewPage;
  const nextPage = Math.min(Math.max(requestedPage, 1), previewPageTotal);

  if (nextPage === activePreviewPage) {
    updatePreviewControls();
    return;
  }

  activePreviewPage = nextPage;
  await renderPreviewPage(state.pdf, activePreviewPage);
}

async function previewSelectedPdf(file: File, loadingMessage = "Loading PDF preview..."): Promise<void> {
  if (getFileKind(file) !== "pdf" || state.isConverting) {
    return;
  }

  clearMessages();
  setBusy(true, loadingMessage);
  if (!state.pdf) {
    resetPreview();
  } else {
    previewRenderToken += 1;
    previewStatus.textContent = loadingMessage;
    previewFrame.classList.add("is-rendering");
  }
  await resetLoadedPreviewPdf();
  renderSelectedFiles();

  try {
    const pdf = await loadPdfFromFile(file);

    state.file = file;
    state.pdf = pdf;
    state.pageCount = pdf.numPages;
    activePreviewPage = 1;
    previewPageTotal = pdf.numPages;
    updatePageCountForPreview(pdf.numPages);
    renderSelectedFiles();
    await renderPreviewPage(pdf, activePreviewPage);

    convertButton.disabled = false;
    progressText.textContent =
      selectedOfficeFiles.length > 0 || selectedUnsupportedFiles.length > 0 ? "Ready." : "";
  } catch (error) {
    resetPreview();
    await resetLoadedPreviewPdf();
    renderSelectedFiles();
    convertButton.disabled = true;
    showError(error);
  } finally {
    setBusy(false);
  }
}

async function removeSelectedFile(indexToRemove: number): Promise<void> {
  if (state.isConverting) {
    return;
  }

  const removedFile = selectedFiles[indexToRemove];

  if (!removedFile) {
    return;
  }

  clearMessages();
  resetDownloads();
  selectedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
  syncSelectedFileGroups();
  renderSelectedFiles();
  updateFileDetails();

  const previewWasRemoved = state.file === removedFile;
  const previewStillSelected = state.file ? selectedFiles.includes(state.file) : false;

  if (selectedFiles.length === 0) {
    resetPreview();
    await resetLoadedPreviewPdf();
    return;
  }

  if (previewWasRemoved || !previewStillSelected) {
    if (selectedPdfFiles.length > 0) {
      const nextPdf = selectedPdfFiles[Math.min(indexToRemove, selectedPdfFiles.length - 1)] ?? selectedPdfFiles[0];
      await previewSelectedPdf(nextPdf);
    } else {
      resetPreview();
      await resetLoadedPreviewPdf();
      convertButton.disabled = selectedOfficeFiles.length === 0;
      progressText.textContent = selectedOfficeFiles.length > 0 ? "Word or PowerPoint selected." : "";
    }
    return;
  }

  if (state.pdf) {
    updatePageCountForPreview(state.pdf.numPages);
  }
  convertButton.disabled = selectedPdfFiles.length === 0 && selectedOfficeFiles.length === 0;
  renderSelectedFiles();
}

async function convertSelectedPdfs(): Promise<void> {
  if (selectedPdfFiles.length === 0) {
    showError(
      selectedOfficeFiles.length > 0
        ? new Error("Word and PowerPoint files are accepted, but this browser tool currently converts PDF files.")
        : new Error("Choose at least one PDF before converting."),
    );
    return;
  }

  clearMessages();
  resetDownloads();
  setBusy(true, "Preparing conversion...");

  try {
    for (let index = 0; index < selectedPdfFiles.length; index += 1) {
      const file = selectedPdfFiles[index];
      let pdf: Awaited<ReturnType<typeof loadPdfFromFile>> | null = null;

      try {
        progressText.textContent = `Loading ${file.name} (${index + 1} of ${selectedPdfFiles.length})...`;
        pdf = await loadPdfFromFile(file);

        const blob = await createDarkPdf(pdf, state.settings, (currentPage, totalPages) => {
          progressText.textContent = `Converting ${file.name}: page ${currentPage} of ${totalPages}...`;
        });
        const url = createDownloadUrl(blob);
        const downloadName = `${getBaseFileName(file.name)}-dark.pdf`;

        downloadUrls.push(url);
        if (index === 0) {
          enableDownload(downloadLink, url, downloadName);
        }

        appendDownloadLink(downloadList, url, downloadName, file.name);
      } finally {
        if (pdf) {
          await destroyPdf(pdf);
        }
      }
    }

    progressText.textContent = "Conversion complete.";
    successText.textContent =
      selectedPdfFiles.length === 1
        ? "Success: your converted PDF is ready to download."
        : "Success: converted PDFs are ready to download.";
  } catch (error) {
    resetDownloads();
    showError(new Error(getFriendlyConversionError(error)));
  } finally {
    setBusy(false);
  }
}

function getFileKind(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx") ||
    type.includes("word") ||
    type.includes("powerpoint") ||
    type.includes("presentation")
  ) {
    return "office";
  }

  return "unsupported";
}

function syncSelectedFileGroups(): void {
  selectedPdfFiles = selectedFiles.filter((file) => getFileKind(file) === "pdf");
  selectedOfficeFiles = selectedFiles.filter((file) => getFileKind(file) === "office");
  selectedUnsupportedFiles = selectedFiles.filter((file) => getFileKind(file) === "unsupported");
}

function renderSelectedFiles(): void {
  const items = selectedFiles.map((file, index) => {
    const item = document.createElement("li");
    const selectButton = document.createElement("button");
    const removeButton = document.createElement("button");
    const text = document.createElement("span");
    const name = document.createElement("span");
    const meta = document.createElement("span");
    const kind = getFileKind(file);
    const isActivePreview = state.file === file;

    selectButton.type = "button";
    selectButton.className = "file-select-button";
    selectButton.disabled = state.isConverting || kind !== "pdf";
    selectButton.addEventListener("click", () => {
      void previewSelectedPdf(file);
    });
    name.textContent = file.name;
    meta.textContent =
      kind === "pdf" ? `PDF, ${formatFileSize(file.size)}` : `${getKindLabel(kind)}, ${formatFileSize(file.size)}`;
    text.className = "file-text";
    text.append(name, meta);
    selectButton.append(text);
    removeButton.type = "button";
    removeButton.className = "file-remove-button";
    removeButton.disabled = state.isConverting;
    removeButton.textContent = "X";
    removeButton.title = `Remove ${file.name}`;
    removeButton.setAttribute("aria-label", `Remove ${file.name}`);
    removeButton.addEventListener("click", () => {
      void removeSelectedFile(index);
    });
    item.classList.toggle("is-active", isActivePreview);
    item.classList.toggle("is-muted", kind !== "pdf");
    if (isActivePreview) {
      selectButton.setAttribute("aria-current", "true");
    }
    item.append(selectButton, removeButton);
    return item;
  });

  selectedFileList.replaceChildren(...items);
}

function appendDownloadLink(container: HTMLElement, url: string, downloadName: string, sourceName: string): void {
  const wrapper = document.createElement("div");
  const label = document.createElement("span");
  const link = document.createElement("a");

  wrapper.className = "download-row";
  label.textContent = sourceName;
  link.className = "button download";
  link.href = url;
  link.download = downloadName;
  link.textContent = "Download";
  wrapper.append(label, link);
  container.append(wrapper);
}

function updateFileDetails(): void {
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  if (selectedFiles.length === 0) {
    fileName.textContent = "No files selected";
    fileSize.textContent = "-";
    pageCount.textContent = "-";
    return;
  }

  fileName.textContent =
    selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files (${selectedPdfFiles.length} PDFs)`;
  fileSize.textContent = formatFileSize(totalSize);
  pageCount.textContent = selectedPdfFiles.length ? "Loading..." : "-";
}

function updatePageCountForPreview(totalPages: number): void {
  const pageLabel = totalPages === 1 ? "1 page" : `${totalPages} pages`;
  pageCount.textContent = selectedPdfFiles.length === 1 ? pageLabel : `Preview PDF: ${pageLabel}`;
}

function getKindLabel(kind: FileKind): string {
  if (kind === "office") {
    return "Word/PPT";
  }

  if (kind === "unsupported") {
    return "Unsupported";
  }

  return "PDF";
}

async function resetLoadedPreviewPdf(): Promise<void> {
  const pdf = state.pdf;

  state.file = null;
  state.pdf = null;
  state.pageCount = 0;
  fileInput.value = "";
  convertButton.disabled = true;

  if (pdf) {
    await destroyPdf(pdf);
  }
}

function resetPreview(): void {
  previewRenderToken += 1;
  activePreviewPage = 1;
  previewPageTotal = 0;
  releasePreviewCanvases();
  previewFrame.classList.remove("is-rendering");
  previewStatus.textContent = "Waiting for files";
  updatePreviewControls();
  previewFrame.replaceChildren(createPreviewEmptyMessage());
}

function createPreviewEmptyMessage(): HTMLParagraphElement {
  const message = document.createElement("p");
  message.className = "preview-empty";
  message.textContent = "Dark preview appears after a valid PDF is loaded.";
  return message;
}

function resetDownloads(): void {
  revokeDownloadUrls(downloadUrls);
  downloadUrls = [];
  downloadList.replaceChildren();
  disableDownload(downloadLink);
  clearText(successText);
}

function setBusy(isBusy: boolean, message?: string): void {
  state.isConverting = isBusy;
  convertButton.disabled = isBusy || (selectedPdfFiles.length === 0 && selectedOfficeFiles.length === 0);
  browseButton.disabled = isBusy;
  fileInput.disabled = isBusy;
  dropZone.classList.toggle("is-busy", isBusy);
  document.body.classList.toggle("is-working", isBusy);
  convertButton.textContent = isBusy ? "Working..." : initialConvertButtonText;

  if (message) {
    progressText.textContent = message;
  }
  renderSelectedFiles();
}

function enableDownload(link: HTMLAnchorElement, url: string, fileNameToDownload: string): void {
  link.href = url;
  link.download = fileNameToDownload;
  link.classList.remove("is-disabled");
  link.setAttribute("aria-disabled", "false");
}

function disableDownload(link: HTMLAnchorElement): void {
  link.href = "#";
  link.removeAttribute("download");
  link.classList.add("is-disabled");
  link.setAttribute("aria-disabled", "true");
}

function updatePreviewControls(): void {
  const hasPreview = Boolean(state.pdf && previewPageTotal > 0);

  previousPreviewButton.disabled = !hasPreview || activePreviewPage <= 1;
  nextPreviewButton.disabled = !hasPreview || activePreviewPage >= previewPageTotal;
  previewPageInput.disabled = !hasPreview;
  previewPageInput.max = hasPreview ? String(previewPageTotal) : "";
  previewPageInput.value = hasPreview ? String(activePreviewPage) : "1";
  previewPageTotalText.textContent = hasPreview ? `of ${previewPageTotal}` : "of -";
}

function showError(error: unknown): void {
  errorText.textContent = error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function clearMessages(): void {
  clearText(errorText);
  clearText(successText);
  clearText(progressText);
}

function clearText(target: HTMLElement): void {
  target.textContent = "";
}

function getFriendlyConversionError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("memory") || message.includes("allocation") || message.includes("canvas")) {
      return "The browser ran into a memory limit while converting. Try Low quality or fewer files.";
    }

    return error.message;
  }

  return "The files could not be converted. Try Low quality or fewer files.";
}

function releasePreviewCanvases(): void {
  previewFrame.querySelectorAll("canvas").forEach((canvas) => {
    canvas.width = 0;
    canvas.height = 0;
  });
}

function getPreviewScale(): number {
  return state.settings.quality === "high" ? 2 : 1.25;
}

async function destroyPdf(pdf: NonNullable<AppState["pdf"]>): Promise<void> {
  await pdf.destroy().catch(() => undefined);
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }

  return element as T;
}

resetDownloads();
