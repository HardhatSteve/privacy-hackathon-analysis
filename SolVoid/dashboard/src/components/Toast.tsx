"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
        case 'success':
            return <CheckCircle2 className="w-4 h-4 text-tactical-green" />;
        case 'error':
            return <AlertCircle className="w-4 h-4 text-tactical-red" />;
        case 'warning':
            return <Zap className="w-4 h-4 text-tactical-orange" />;
        default:
            return <Info className="w-4 h-4 text-tactical-cyan" />;
    }
};

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return 'border-tactical-green/20 bg-tactical-green/5';
        case 'error':
            return 'border-tactical-red/20 bg-tactical-red/5';
        case 'warning':
            return 'border-tactical-orange/20 bg-tactical-orange/5';
        default:
            return 'border-tactical-cyan/20 bg-tactical-cyan/5';
    }
};

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-xl shadow-lg ${getToastStyles(toast.type)}`}
        >
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90">{toast.title}</p>
                {toast.message && (
                    <p className="text-xs text-white/50 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
            >
                <X className="w-3 h-3 text-white/40" />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration || 4000;
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast({ type: 'error', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                <AnimatePresence mode="sync">
                    {toasts.map(toast => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem toast={toast} onRemove={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
