import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Instalar no iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 mb-4">
                <span>1. Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) no Safari.</span>
                <br />
                <span>2. Role a lista e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                <br />
                <span>3. O FinanFlow funcionará em tela cheia como um app nativo, mesmo offline!</span>
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
