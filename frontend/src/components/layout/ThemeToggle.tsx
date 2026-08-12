import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-reader-surface hover:bg-reader-hover border border-reader-border text-reader-text transition-colors flex items-center justify-center ${className}`}
      title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
      aria-label="تبديل مظهر التطبيق"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-reader-metric-goldText" />
      ) : (
        <Moon className="w-4 h-4 text-reader-text" />
      )}
    </motion.button>
  );
}
