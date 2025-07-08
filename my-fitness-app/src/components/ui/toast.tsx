'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${typeClasses[type]} max-w-sm`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-lg font-bold">
          ×
        </button>
      </div>
    </div>
  );
}

// Hook para usar Toast
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type as any}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { addToast, ToastContainer };
}
