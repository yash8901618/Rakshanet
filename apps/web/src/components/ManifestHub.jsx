import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Crown
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';

export const ManifestHub = () => {
  const { manifest } = useCrisisStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredManifest = manifest.filter(item => {
    const matchesSearch = 
      item.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.guests.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalGuests = manifest.reduce((acc, curr) => acc + (curr.count || 1), 0);
  const inRoomCount = manifest.filter(m => m.status === 'in_room').reduce((acc, curr) => acc + (curr.count || 1), 0);
  const evacuatingCount = manifest.filter(m => m.status === 'evacuating').reduce((acc, curr) => acc + (curr.count || 1), 0);
  const safeCount = manifest.filter(m => m.status === 'safe').reduce((acc, curr) => acc + (curr.count || 1), 0);
  const unaccountedCount = manifest.filter(m => m.status === 'trapped' || m.status === 'unaccounted').reduce((acc, curr) => acc + (curr.count || 1), 0);

  const handleStatusChange = (room, newStatus) => {
    socket.emit('manifest:update_status', { room, status: newStatus });
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full animate-panel-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)]">
              GUEST & STAFF MANIFEST
            </h2>
            <p className="font-sans text-xs text-[var(--text-muted)] mt-0.5">
              Occupant headcount & evacuation tracking
            </p>
          </div>
        </div>

        <span className="glass-pill font-mono text-[11px] text-[var(--text-primary)]">
          {totalGuests} Souls
        </span>
      </div>

      {/* Headcount Stat Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="glass-card p-2 text-center">
          <div className="text-[10px] font-sans text-[var(--text-muted)]">In Room</div>
          <div className="font-display font-bold text-base text-[var(--text-primary)] mt-0.5">{inRoomCount}</div>
        </div>
        <div className="glass-card p-2 text-center border-b-2 border-b-[var(--warn)]">
          <div className="text-[10px] font-sans text-[var(--warn)]">Evac</div>
          <div className="font-display font-bold text-base text-[var(--warn)] mt-0.5">{evacuatingCount}</div>
        </div>
        <div className="glass-card p-2 text-center border-b-2 border-b-[var(--safe)]">
          <div className="text-[10px] font-sans text-[var(--safe)]">Safe</div>
          <div className="font-display font-bold text-base text-[var(--safe)] mt-0.5">{safeCount}</div>
        </div>
        <div className="glass-card p-2 text-center border-b-2 border-b-[var(--crisis)]">
          <div className="text-[10px] font-sans text-[var(--crisis)]">Trapped</div>
          <div className="font-display font-bold text-base text-[var(--crisis)] mt-0.5">{unaccountedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search room or guest..."
            className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-sans focus:outline-none focus:border-[var(--mesh)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#06080B] border border-[var(--border)] rounded-[8px] px-2.5 py-1.5 text-xs text-[var(--text-muted)] font-sans focus:outline-none"
        >
          <option value="ALL">All</option>
          <option value="in_room">In Room</option>
          <option value="evacuating">Evac</option>
          <option value="safe">Safe</option>
          <option value="trapped">Trapped</option>
        </select>
      </div>

      {/* Manifest Entries List */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-[160px]">
        {filteredManifest.map((item) => (
          <div
            key={item.room}
            className="glass-card p-2.5 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-12 text-center py-1 rounded-[6px] bg-white/[0.04] border border-[var(--border)] font-mono font-bold text-[var(--text-primary)] text-xs flex-shrink-0">
                {item.room}
              </div>
              <div className="truncate">
                <div className="font-sans font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                  {item.guests}
                  {item.vip && (
                    <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-[var(--warn)]/20 text-[var(--warn)] text-[10px] font-sans">
                      <Crown className="w-2.5 h-2.5" /> VIP
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-[var(--text-faint)]">
                  {item.count} Occupant{item.count > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Quick Status Toggle Buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {[
                { status: 'in_room', label: 'Room' },
                { status: 'evacuating', label: 'Evac' },
                { status: 'safe', label: 'Safe' },
                { status: 'trapped', label: 'Trap' }
              ].map(s => {
                const isCurrent = item.status === s.status;
                return (
                  <button
                    key={s.status}
                    onClick={() => handleStatusChange(item.room, s.status)}
                    className={`px-2 py-0.5 rounded-[4px] text-[10px] font-sans transition-all ${
                      isCurrent
                        ? s.status === 'trapped' ? 'bg-[var(--crisis)] text-white font-semibold' :
                          s.status === 'safe' ? 'bg-[var(--safe)] text-[#06080B] font-semibold' :
                          s.status === 'evacuating' ? 'bg-[var(--warn)] text-[#06080B] font-semibold' :
                          'bg-white/[0.12] text-white font-semibold'
                        : 'text-[var(--text-faint)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
