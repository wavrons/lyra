import { useState, useRef, useCallback } from 'react';
const UploadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);
const ImageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp'];

interface ImageUploadProps {
  /** Called when an image file is selected and ready for upload */
  onUpload: (file: File) => Promise<void>;
  /** Current trip storage used in bytes */
  storageUsed: number;
  /** Max storage per trip in bytes */
  storageLimit: number;
  disabled?: boolean;
}

export function ImageUpload({ onUpload, storageUsed, storageLimit, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB per file.`);
      return;
    }

    if (storageUsed + file.size > storageLimit) {
      const remaining = Math.max(0, storageLimit - storageUsed);
      setError(`Not enough storage. ${(remaining / 1024 / 1024).toFixed(1)}MB remaining.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload, storageUsed, storageLimit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const limitMB = (storageLimit / (1024 * 1024)).toFixed(0);
  const usedPct = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  return (
    <div className="image-upload">
      <div
        className={`image-upload__dropzone ${dragOver ? 'image-upload__dropzone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <div className="image-upload__status">
            <LoaderIcon className="h-5 w-5 animate-spin" />
            <span>Encrypting & uploading… {progress}%</span>
          </div>
        ) : (
          <div className="image-upload__status">
            {dragOver ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <UploadIcon className="h-5 w-5" />
            )}
            <span>{dragOver ? 'Drop image here' : 'Drag & drop or click to upload'}</span>
          </div>
        )}
      </div>

      {error && <p className="image-upload__error">{error}</p>}

      <div className="image-upload__meter">
        <div className="image-upload__meter-bar">
          <div
            className="image-upload__meter-fill"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <span className="image-upload__meter-label">{usedMB} / {limitMB} MB</span>
      </div>
    </div>
  );
}
