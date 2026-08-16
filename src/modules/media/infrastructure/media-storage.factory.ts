import { MediaStorageProvider } from '../domain/media-storage-provider.interface';
import { LocalStorageProvider } from './local-storage.provider';

/**
 * Media storage provider factory — keyed off MEDIA_STORAGE_PROVIDER env var.
 * Switching providers requires only an env change + restart, no code changes. (Phase 8.3)
 * 
 * CloudinaryProvider is loaded lazily to avoid build errors when the `cloudinary` 
 * npm package is not installed.
 */
let _provider: MediaStorageProvider | null = null;

export function getMediaStorageProvider(): MediaStorageProvider {
  if (_provider) return _provider;

  const providerKey = process.env.MEDIA_STORAGE_PROVIDER || 'local';

  switch (providerKey) {
    case 'cloudinary':
      // Lazy import to avoid build errors if cloudinary package is missing
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CloudinaryProvider } = require('./cloudinary.provider');
        _provider = new CloudinaryProvider();
      } catch {
        console.error('Failed to load CloudinaryProvider. Falling back to local storage.');
        _provider = new LocalStorageProvider();
      }
      break;
    case 'local':
    default:
      _provider = new LocalStorageProvider();
      break;
  }

  return _provider as MediaStorageProvider;
}
