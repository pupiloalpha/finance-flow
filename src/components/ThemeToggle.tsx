import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-all duration-200 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        isDark
          ? 'bg-slate-900/90 text-amber-300 border-slate-700/80 hover:bg-slate-800 hover:text-amber-200 shadow-sm'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
      } ${className}`}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 text-amber-400" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 text-indigo-600" />
        )}
      </div>
      {showLabel && (
        <span className="font-semibold text-xs select-none">
          {isDark ? 'Tema Claro' : 'Tema Escuro'}
        </span>
      )}
    </button>
  );
}
