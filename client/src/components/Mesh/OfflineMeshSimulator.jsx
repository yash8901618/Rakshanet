import React from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';

/**
 * OfflineMeshSimulator Component
 * Manages mesh network resiliency, network outage simulation toggle,
 * and IndexedDB queue reconciliation.
 */
export default function OfflineMeshSimulator() {
  const {
    isOfflineMode,
    toggleOfflineMode,
    offlineQueue,
    flushOfflineQueue,
    lastSyncNotice,
    isSocketConnected
  } = useCrisisStore();

  const pendingCount = offlineQueue.length;

  return (
    <div className="glass-card p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      {/* Network Status & Toggle */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
            isOfflineMode
              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
              : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
          }`}
        >
          {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-200">
              TACTICAL MESH NETWORK:
            </span>
            <span
              className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-extrabold tracking-wider uppercase ${
                isOfflineMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isOfflineMode ? 'OFFLINE (ISOLATED)' : 'ONLINE (HUB SYNCED)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {isOfflineMode
              ? 'Zero-connectivity mode. Reports & rescues buffer to IndexedDB.'
              : `Gravity Hub connected via WebSocket (${isSocketConnected ? 'Live' : 'Connecting'}).`}
          </p>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2.5">
        {/* Sync Toast Notice */}
        {lastSyncNotice && (
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 text-xs font-mono flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{lastSyncNotice}</span>
          </div>
        )}

        {/* IndexedDB Queue Badge */}
        <div
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono ${
            pendingCount > 0
              ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 animate-pulse'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
          title="Actions queued in local IndexedDB"
        >
          <Database className="w-3.5 h-3.5" />
          <span>IndexedDB:</span>
          <span className="font-bold text-white">{pendingCount} queued</span>
        </div>

        {/* Manual Sync Button if pending actions */}
        {!isOfflineMode && pendingCount > 0 && (
          <button
            type="button"
            onClick={flushOfflineQueue}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-sky-950 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Now</span>
          </button>
        )}

        {/* Network Toggle Button */}
        <button
          type="button"
          onClick={toggleOfflineMode}
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-md ${
            isOfflineMode
              ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500/60 shadow-emerald-950'
              : 'bg-amber-600/90 hover:bg-amber-500 text-black border-amber-400 shadow-amber-950'
          }`}
        >
          {isOfflineMode ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Restore Network Signal</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Simulate Network Outage</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
