import { MediaStorageProvider, MediaUploadParams, MediaUploadResult, TransformOptions } from '../domain/media-storage-provider.interface';

/**
 * CloudinaryProvider — stores files on Cloudinary.
 * Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * Also requires `cloudinary` npm package to be installed.
 */
export class CloudinaryProvider implements MediaStorageProvider {
  readonly key = 'cloudinary';

  private get cloudName() { return process.env.CLOUDINARY_CLOUD_NAME || ''; }
  private get apiKey() { return process.env.CLOUDINARY_API_KEY || ''; }
  private get apiSecret() { return process.env.CLOUDINARY_API_SECRET || ''; }

  private async getCloudinary() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
      });
      return cloudinary;
    } catch {
      throw new Error(
        'Cloudinary package not installed. Run: npm install cloudinary'
      );
    }
  }

  async upload(params: MediaUploadParams): Promise<MediaUploadResult> {
    const cloudinary = await this.getCloudinary();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: params.folder || 'plants-care', resource_type: 'auto' },
        (error: any, result: any) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      );
      uploadStream.end(params.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    const cloudinary = await this.getCloudinary();
    await cloudinary.uploader.destroy(publicId);
  }

  getTransformationUrl(publicId: string, options: TransformOptions): string {
    const transforms: string[] = [];
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);
    if (options.quality) transforms.push(`q_${options.quality}`);
    
    const transformStr = transforms.length > 0 ? transforms.join(',') + '/' : '';
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformStr}${publicId}`;
  }
}
