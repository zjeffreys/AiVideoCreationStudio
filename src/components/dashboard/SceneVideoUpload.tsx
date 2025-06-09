import React, { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../utils/cn';

type SceneVideoUploadProps = {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  existingVideoUrl?: string;
};

export const SceneVideoUpload: React.FC<SceneVideoUploadProps> = ({
  onFileUpload,
  isUploading,
  existingVideoUrl,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);

  const handleContainerClick = useCallback(() => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Upload AI Generated Scene Video (Optional)</label>
      <div
        className={cn(
          "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200",
          isDragOver ? "border-purple-500 bg-purple-900/10" : "border-slate-700 hover:border-purple-600",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleContainerClick}
      >
        {isUploading ? (
          <p className="text-sm text-slate-400">Uploading video...</p>
        ) : (
          <>
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-400 text-center">
              Drag and drop your video here, or <span className="text-purple-400 font-medium">click to browse</span>
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
              ref={fileInputRef}
            />
          </>
        )}
      </div>
      {existingVideoUrl && !isUploading && (
        <div className="mt-4 rounded-lg overflow-hidden border border-slate-700">
          <video controls src={existingVideoUrl} className="w-full h-auto"></video>
        </div>
      )}
    </div>
  );
}; 