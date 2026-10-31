import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  CloudUpload, 
  ShieldCheck, 
  CheckCircle 
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';

export function OfflineSimulator() {
  const { isOfflineMode, toggleOfflineMode, offlineQueue, flushOfflineQueue, lastSyncNotice } = useCrisisStore();

  return (
    <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in border-amber-500/30">
      {/* Left: Outage Simulator Status */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
          isOfflineMode 
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-xs tracking-wider uppercase text-white">
              OFFLINE RESILIENCY SIMULATOR
            </h3>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              isOfflineMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {isOfflineMode ? 'NETWORK DISCONNECTED (OFFLINE)' : 'ONLINE / MESH CONNECTED'}
            </span>
          </div>
          <p className="font-sans text-[11px] text-[var(--text-muted)]">
            {isOfflineMode 
              ? 'Local IndexedDB/Storage buffer active. Incidents & rescues will queue locally.' 
              : 'Direct Socket.io real-time streaming active.'}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Mode Button */}
        <button
          onClick={toggleOfflineMode}
          className={`btn-secondary text-xs px-3 py-1.5 font-sans font-semibold ${
            isOfflineMode ? 'bg-amber-500/20 border-amber-400 text-amber-200' : ''
          }`}
        >
          {isOfflineMode ? 'Restore Connection' : 'Simulate Network Outage'}
        </button>

        {/* Sync Offline Queue Button */}
        {offlineQueue.length > 0 && (
          <button
            onClick={flushOfflineQueue}
            className="btn-primary text-xs px-3 py-1.5"
            title="Flush local offline queue to Gravity Hub"
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Flush Queue ({offlineQueue.length})</span>
          </button>
        )}
      </div>

      {/* Toast Notice */}
      {lastSyncNotice && (
        <div className="w-full mt-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{lastSyncNotice}</span>
        </div>
      )}
    </div>
  );
}
