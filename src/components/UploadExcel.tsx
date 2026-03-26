'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface UploadExcelProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export default function UploadExcel({ onSuccess, onError, onClose }: UploadExcelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.match(/\.(xlsx|xls)$/i)) {
      setFile(droppedFile);
    } else {
      onError?.('Please upload a valid Excel file (.xlsx or .xls)');
    }
  }, [onError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/excel', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        onSuccess?.(data.message || `Successfully processed ${data.households?.length || 0} households`);
        setFile(null);
        onClose?.();
      } else {
        onError?.(data.error || 'Upload failed');
      }
    } catch {
      onError?.('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'border-2 border-dashed rounded-lg px-6 py-8 text-center transition-all duration-150',
          isDragging ? 'border-brand bg-[#EFF6FF]' : 'border-border-mid bg-bg-secondary',
        ].join(' ')}
      >
        <FileSpreadsheet size={36} className="text-brand mx-auto mb-3" />
        <div className="text-[14px] font-medium text-text-primary mb-1">
          Drop your Excel file here
        </div>
        <div className="text-[12px] text-text-secondary mb-4">
          Supports .xlsx and .xls — column names may vary
        </div>

        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.75 bg-bg-primary border border-border-mid rounded-md text-[12px] font-medium text-text-primary cursor-pointer">
          <Upload size={14} />
          Choose file
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Selected file */}
      {file && (
        <div className="mt-3 flex items-center gap-2.5 px-3.5 py-2.5 bg-bg-secondary rounded-md border border-border-subtle">
          <FileSpreadsheet size={16} className="text-brand shrink-0" />
          <div className="flex-1 text-[13px] text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
            {file.name}
          </div>
          <button
            onClick={() => setFile(null)}
            className="bg-transparent border-0 cursor-pointer text-text-secondary p-0.5 flex"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={[
            'mt-4 w-full py-2.5 rounded-md text-[13px] font-medium text-white border-0',
            'transition-colors duration-150 disabled:cursor-not-allowed',
            isUploading ? 'bg-[#7ab3e0]' : 'bg-brand cursor-pointer',
          ].join(' ')}
        >
          {isUploading ? 'Processing...' : 'Upload & Process'}
        </button>
      )}
    </div>
  );
}
