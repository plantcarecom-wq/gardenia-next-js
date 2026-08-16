/**
 * MediaStorageProvider interface — abstracts file storage behind a common contract.
 * Phase 8 ships with LocalStorageProvider and CloudinaryProvider.
 */
export interface MediaStorageProvider {
  /** Unique provider key */
  readonly key: string;

  /**
   * Upload a file buffer. Returns the public URL of the uploaded file.
   */
  upload(params: MediaUploadParams): Promise<MediaUploadResult>;

  /**
   * Delete a file by its public ID or URL.
   */
  delete(publicId: string): Promise<void>;

  /**
   * Generate a transformation URL for an image (resize, crop, etc.).
   * Returns the original URL if transformations are not supported.
   */
  getTransformationUrl(publicId: string, options: TransformOptions): string;
}

export interface MediaUploadParams {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string;
}

export interface MediaUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: number;
}
