'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, File as FileIcon, FileText } from 'lucide-react';

interface ImageUploaderProps {
  /** Media document _ids (not URLs — every schema this feeds, e.g. Product.imageMediaIds, GardenerProfile.cvMediaId, stores ids). */
  value: string[];
  onChange: (mediaIds: string[]) => void;
  maxFiles?: number;
  folder?: string;
  /** File picker `accept` filter. Defaults to images only; pass e.g. "image/*,application/pdf" for document uploads (CV, ID scans). */
  accept?: string;
  /** Label shown in the helper line under the tiles. */
  hint?: string;
}

/**
 * Reusable file uploader (Phase 8.6). Images are compressed client-side via
 * canvas before upload; non-image files (e.g. PDFs, allowed when `accept`
 * is widened) skip compression and upload as-is, since canvas compression
 * assumes an `<img>`-loadable source.
 * Tracks id -> {url, mimeType} locally for previews of files uploaded in
 * this session; pre-existing ids passed in via `value` (edit mode) render a
 * generic file tile since their metadata isn't known without an extra fetch.
 */
export function ImageUploader({ value, onChange, maxFiles = 5, folder = '', accept = 'image/*', hint }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, { url: string; mimeType: string }>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = (height / width) * MAX_DIM;
            width = MAX_DIM;
          } else {
            width = (width / height) * MAX_DIM;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/jpeg',
          0.85
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = maxFiles - value.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    const newIds: string[] = [];
    const newPreviews: Record<string, { url: string; mimeType: string }> = {};

    for (const file of toUpload) {
      try {
        const isImage = file.type.startsWith('image/');
        const uploadBody = isImage ? await compressImage(file) : file;
        const formData = new FormData();
        formData.append('file', uploadBody, file.name);
        if (folder) formData.append('folder', folder);

        const res = await fetch('/api/v1/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newIds.push(data.data._id);
          newPreviews[data.data._id] = { url: data.data.url, mimeType: data.data.mimeType };
        }
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    setPreviews((prev) => ({ ...prev, ...newPreviews }));
    onChange([...value, ...newIds]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {value.map((id, i) => {
          const preview = previews[id];
          const isImage = preview?.mimeType.startsWith('image/');
          return (
            <div key={id} className="relative aspect-square rounded-xl border border-gray-200 dark:border-input overflow-hidden group bg-gray-50 dark:bg-muted">
              {preview ? (
                <a href={preview.url} target="_blank" rel="noreferrer" className="block w-full h-full">
                  {isImage ? (
                    <img src={preview.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-1">
                      <FileText className="w-6 h-6" />
                      <span className="text-[10px] font-medium">PDF</span>
                    </div>
                  )}
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                  <FileIcon className="w-6 h-6" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-input hover:border-emerald-400 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">Upload</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleUpload}
        className="hidden"
      />
      <p className="text-xs text-muted-foreground">
        {hint || `${value.length}/${maxFiles} files • Max 5MB each`}
      </p>
    </div>
  );
}
