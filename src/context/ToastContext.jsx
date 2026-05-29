import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX } from 'react-icons/hi';

const ToastContext = createContext();

const departmentColors = {
  CSE: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  ECE: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  Sports: 'border-green-500 bg-green-50 dark:bg-green-900/20',
  Cultural: 'border-pink-500 bg-pink-50 dark:bg-pink-900/20',
  Management: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
  default: 'border-gu-500 bg-gu-50 dark:bg-gu-900/20',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const colorClass = departmentColors[toast.department] || departmentColors.default;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className={`pointer-events-auto p-4 rounded-xl border-l-4 shadow-lg backdrop-blur-sm ${colorClass}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{toast.icon || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm text-dark-900 dark:text-white truncate">{toast.title}</p>
                      {toast.department && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-dark-200 dark:bg-dark-600 text-dark-500 dark:text-dark-300 font-medium flex-shrink-0">{toast.department}</span>
                      )}
                    </div>
                    <p className="text-xs text-dark-500 dark:text-dark-400 line-clamp-2">{toast.message}</p>
                  </div>
                  <button onClick={() => removeToast(toast.id)} className="text-dark-400 hover:text-dark-600 flex-shrink-0">
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
