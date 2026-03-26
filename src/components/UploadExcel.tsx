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
        style={{
          border: `2px dashed ${isDragging ? '#378ADD' : 'var(--color-border-secondary)'}`,
          borderRadius: 'var(--border-radius-lg)',
          padding: '32px 24px',
          textAlign: 'center',
          background: isDragging ? '#EFF6FF' : 'var(--color-background-secondary)',
          transition: 'all 0.15s',
        }}
      >
        <FileSpreadsheet
          size={36}
          style={{ color: '#378ADD', margin: '0 auto 12px' }}
        />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          Drop your Excel file here
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Supports .xlsx and .xls — column names may vary
        </div>

        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
        }}>
          <Upload size={14} />
          Choose file
          <input
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Selected file */}
      {file && (
        <div style={{
          marginTop: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-tertiary)',
        }}>
          <FileSpreadsheet size={16} style={{ color: '#378ADD', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <button
            onClick={() => setFile(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '2px', display: 'flex' }}
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
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            background: isUploading ? '#7ab3e0' : '#378ADD',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
        >
          {isUploading ? 'Processing...' : 'Upload & Process'}
        </button>
      )}
    </div>
  );
}