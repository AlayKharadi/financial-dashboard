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

  const isDisabled = isUploading || (!householdId && !selectedHouseholdId);

  return (
    <div>
      {/* Household selector — only shown when not pre-selected */}
      {!householdId && (
        <div className="mb-4">
          <label className="block text-[11px] font-medium text-text-secondary mb-1.5 uppercase tracking-[0.5px]">
            Select Household
          </label>
          <select
            value={selectedHouseholdId}
            onChange={e => setSelectedHouseholdId(e.target.value)}
            className="w-full px-3 py-2 bg-bg-secondary border border-border-mid rounded-md text-[13px] text-text-primary outline-none cursor-pointer"
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
        className={[
          'border-2 border-dashed rounded-lg px-6 py-8 text-center transition-all duration-150',
          isDragging ? 'border-brand bg-[#EBF5FF]' : 'border-border-mid bg-bg-secondary',
        ].join(' ')}
      >
        <Mic size={36} className="text-brand mx-auto mb-3" />
        <div className="text-[14px] font-medium text-text-primary mb-1">
          Upload Audio Recording
        </div>
        <div className="text-[12px] text-text-secondary mb-4">
          Drop client conversation audio here
        </div>
        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.75 bg-bg-primary border border-border-mid rounded-md text-[12px] font-medium text-text-primary cursor-pointer">
          <Upload size={14} />
          Choose Audio File
          <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {/* Audio preview */}
      {file && previewUrl && (
        <div className="mt-3 bg-bg-secondary p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[13px] text-text-primary overflow-hidden text-ellipsis whitespace-nowrap flex-1">
              {file.name}
            </div>
            <button
              onClick={() => { setFile(null); setPreviewUrl(null); }}
              className="bg-transparent border-0 cursor-pointer text-text-secondary ml-2"
            >
              <X size={16} />
            </button>
          </div>
          <audio controls className="w-full" src={previewUrl} />
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={isDisabled}
          className={[
            'mt-4 w-full py-2.5 rounded-md text-[13px] font-medium text-white border-0',
            'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
            isUploading ? 'bg-[#93c5fd]' : 'bg-brand cursor-pointer',
          ].join(' ')}
        >
          {isUploading ? 'Processing with Gemini...' : 'Upload & Generate Insights'}
        </button>
      )}
    </div>
  );
}
