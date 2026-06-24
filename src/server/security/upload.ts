export const PDF_MAX_BYTES = 5 * 1024 * 1024;

export class UploadValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

export function assertPdfFile(file: File) {
  if (file.type && file.type !== "application/pdf") {
    throw new UploadValidationError("Upload a PDF file.");
  }
  if (file.size > PDF_MAX_BYTES) {
    throw new UploadValidationError("PDF is too large. Keep it under 5 MB.", 413);
  }
}
