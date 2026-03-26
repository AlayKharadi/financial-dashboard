'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const typeStyles: Record<ToastType, { wrapper: string; iconCls: string; Icon: typeof CheckCircle }> = {
  success: { wrapper: 'bg-bg-primary border-border-mid',   iconCls: 'text-green',     Icon: CheckCircle  },
  error:   { wrapper: 'bg-[#fef2f2] border-[#fecaca]',    iconCls: 'text-red',        Icon: XCircle      },
  info:    { wrapper: 'bg-bg-info   border-border-mid',    iconCls: 'text-text-info',  Icon: AlertCircle  },
};

export default function Toast({ message, type, duration = 4500, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { wrapper, iconCls, Icon } = typeStyles[type];

  return (
    <div
      className={[
        'fixed bottom-6 right-6 flex items-start gap-3 px-4 py-[14px]',
        'rounded-lg border shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
        'z-[9999] max-w-[380px] min-w-[260px]',
        'transition-[opacity,transform] duration-[250ms]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        wrapper,
      ].join(' ')}
    >
      <Icon size={18} className={`${iconCls} shrink-0 mt-px`} />

      <p className="flex-1 text-[13px] leading-[1.5] text-text-primary">
        {message}
      </p>

      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 250); }}
        className="bg-transparent border-0 cursor-pointer text-text-secondary p-px shrink-0 mt-px"
      >
        <X size={14} />
      </button>
    </div>
  );
}
