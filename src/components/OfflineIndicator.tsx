import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl">
      <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
      <span>Modo Offline — Seus lançamentos estão salvos localmente e serão sincronizados ao reconectar.</span>
    </div>
  );
};
