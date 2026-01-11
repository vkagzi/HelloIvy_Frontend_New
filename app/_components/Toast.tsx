'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { FiIcon as Icons } from '@/app/_components/Icons';
import { Button } from '@/app/_components/Button';
import { Paragraph } from '@/app/_components/Typography';

interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  addToast: (
    message: string,
    options?: Omit<ToastMessage, 'id' | 'message'>
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProps extends ToastMessage {
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300); // wait for animation
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, onDismiss]);

  const handleDismiss = (): void => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); // wait for animation
  };

  const iconMap = {
    success: 'check-circle',
    error: 'cross-circle',
    warning: 'triangle-warning',
    info: 'info',
  };

  const colorMap = {
    success: 'bg-teal-100 text-teal-800',
    error: 'bg-orange-100 text-orange-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div
      className={`flex max-w-sm items-center gap-4 rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out ${
        colorMap[type]
      } ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      role="alert"
    >
      <Icons name={iconMap[type]} />
      <Paragraph size="sm" className="flex-1">
        {message}
      </Paragraph>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        aria-label="Dismiss"
        label=""
        iconLeft={<Icons name="cross-small" />}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addToast = useCallback(
    (message: string, options?: Omit<ToastMessage, 'id' | 'message'>): void => {
      const id = new Date().toISOString();
      setToasts((prevToasts) => [...prevToasts, { id, message, ...options }]);
    },
    []
  );

  const removeToast = useCallback((id: string): void => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {isMounted &&
        createPortal(
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4"
            style={{ isolation: 'isolate' }}
          >
            {toasts.map((toast) => (
              <Toast key={toast.id} {...toast} onDismiss={removeToast} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
