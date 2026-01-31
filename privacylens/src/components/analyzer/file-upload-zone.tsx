'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
  onRemove: () => void;
}

export function FileUploadZone({
  onFileUpload,
  uploadedFile,
  onRemove,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.name.endsWith('.so') || file.name.endsWith('.wasm')) {
          onFileUpload(file);
        } else {
          alert('Please upload a .so or .wasm file');
        }
      }
    },
    [onFileUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (uploadedFile) {
    return (
      <div className="rounded-lg border bg-muted/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileCode className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".so,.wasm"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleFileInput}
      />
      <Upload
        className={cn(
          'mx-auto h-12 w-12',
          isDragging ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      <h3 className="mt-4 font-medium">
        {isDragging ? 'Drop your file here' : 'Upload Program Bytecode'}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Drag and drop a .so or .wasm file, or click to browse
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Maximum file size: 10MB
      </p>
    </div>
  );
}
