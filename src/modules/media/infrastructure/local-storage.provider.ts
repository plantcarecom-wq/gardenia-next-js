import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MediaStorageProvider, MediaUploadParams, MediaUploadResult, TransformOptions } from '../domain/media-storage-provider.interface';

/**
 * LocalStorageProvider — stores files on the local filesystem under /public/uploads.
 * Emits a loud warning if running on Vercel (ephemeral filesystem).
 */
export class LocalStorageProvider implements MediaStorageProvider {
  readonly key = 'local';
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // Loud warning if deployed on Vercel
    if (process.env.VERCEL) {
      console.warn(
        '\n⚠️  WARNING: LocalStorageProvider is active on a Vercel deployment!\n' +
        '   Files stored locally will be LOST on each deployment.\n' +
        '   Set MEDIA_STORAGE_PROVIDER=cloudinary for production use.\n'
      );
    }
  }

  async upload(params: MediaUploadParams): Promise<MediaUploadResult> {
    const ext = path.extname(params.filename) || '.bin';
    const publicId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const folder = params.folder || '';
    const dir = folder ? path.join(this.uploadDir, folder) : this.uploadDir;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, publicId);
    fs.writeFileSync(filePath, params.buffer);

    const url = `/uploads/${folder ? folder + '/' : ''}${publicId}`;
    return {
      url,
      publicId,
      bytes: params.buffer.length,
    };
  }

  async delete(publicId: string): Promise<void> {
    const filePath = path.join(this.uploadDir, publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getTransformationUrl(publicId: string, _options: TransformOptions): string {
    // Local storage doesn't support transformations — return the original URL
    return `/uploads/${publicId}`;
  }
}
