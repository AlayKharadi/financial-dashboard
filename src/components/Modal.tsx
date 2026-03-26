// components/Modal.tsx
'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 p-4">
      <div className="bg-bg-primary rounded-lg border border-border-subtle shadow-xl w-full max-w-120 overflow-hidden">

        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-0 p-1 cursor-pointer text-text-secondary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
