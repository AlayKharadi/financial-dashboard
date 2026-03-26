'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mic, Upload, X } from 'lucide-react';

interface Household {
  id: number;
  name: string;
}

interface UploadAudioProps {
  householdId?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onClose?: () => void;
}

export default function UploadAudio({ householdId, onSuccess, onError, onClose }: UploadAudioProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(householdId || '');

  // Only fetch household list if no householdId is pre-provided
  useEffect(() => {
    if (!householdId) {
      fetch('/api/households')
        .then(res => res.json())
        .then(data => setHouseholds(data))
        .catch(() => {});
    }
  }, [householdId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('audio/')) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    } else {
      onError?.('Please upload a valid audio file');
    }
  }, [onError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!selectedHouseholdId) {
      onError?.('Please select a household first');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('household_id', selectedHouseholdId);
    try {
      const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        // onSuccess?.(data.summary || 'Audio processed successfully');
        onSuccess?.("✅ Audio processed successfully! Insights have been generated.");
        setFile(null);
        setPreviewUrl(null);
        onClose?.();
      } else {
        onError?.(data.error || 'Upload failed');
      }
    } catch {
      onError?.('Network error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* Household selector — only shown when not pre-selected */}
      {!householdId && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '11px', fontWeight: 500,
            color: 'var(--color-text-secondary)', marginBottom: '6px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Select Household
          </label>
          <select
            value={selectedHouseholdId}
            onChange={e => setSelectedHouseholdId(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px', color: 'var(--color-text-primary)',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">— Choose a household —</option>
            {households.map(h => (
              <option key={h.id} value={String(h.id)}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

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
          background: isDragging ? '#EBF5FF' : 'var(--color-background-secondary)',
          transition: 'all 0.15s',
        }}
      >
        <Mic size={36} style={{ color: '#378ADD', margin: '0 auto 12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
          Upload Audio Recording
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Drop client conversation audio here
        </div>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)',
          fontSize: '12px', fontWeight: 500, cursor: 'pointer', color: 'var(--color-text-primary)',
        }}>
          <Upload size={14} />
          Choose Audio File
          <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        </label>
      </div>

      {/* Audio preview */}
      {file && previewUrl && (
        <div style={{ marginTop: '12px', background: 'var(--color-background-secondary)', padding: '12px', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {file.name}
            </div>
            <button
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', marginLeft: '8px' }}
            >
              <X size={16} />
            </button>
          </div>
          <audio controls style={{ width: '100%' }} src={previewUrl} />
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading || (!householdId && !selectedHouseholdId)}
          style={{
            marginTop: '16px', width: '100%', padding: '10px',
            background: isUploading ? '#93c5fd' : '#378ADD',
            color: 'white', border: 'none', borderRadius: 'var(--border-radius-md)',
            fontSize: '13px', fontWeight: 500,
            cursor: (isUploading || (!householdId && !selectedHouseholdId)) ? 'not-allowed' : 'pointer',
            opacity: (!householdId && !selectedHouseholdId) ? 0.5 : 1,
            transition: 'background 0.15s',
          }}
        >
          {isUploading ? 'Processing with Gemini...' : 'Upload & Generate Insights'}
        </button>
      )}
    </div>
  );
}