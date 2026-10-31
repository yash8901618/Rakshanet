import React, { useState } from 'react';
import { 
  Shield, 
  Hotel, 
  Smartphone, 
  Crosshair, 
  Sliders, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { useCrisisStore } from '../store/crisisStore';
import { socket } from '../socket';
import { audioEngine } from '../utils/audioEngine';

const ROLES_INFO = [
  {
    role: 'Floor Staff',
    badge: 'MOBILE STAFF',
    icon: Smartphone,
    desc: 'Mobile floor patrol on handheld device. Sweeps guest corridors, clears rooms, and guides occupants along safe exits.'
  },
  {
    role: 'Reception',
    badge: 'DESK TERMINAL',
    icon: Hotel,
    desc: 'Front desk command. Controls guest manifest, manages check-in freeze, and broadcasts soft evacuation chimes.'
  },
  {
    role: 'Security',
    badge: 'CONTROL ROOM',
    icon: Shield,
    desc: 'CCTV surveillance & security. Isolates elevator banks, triggers fire dampers, and secures perimeter cordons.'
  },
  {
    role: 'Responder',
    badge: 'TACTICAL UNIT',
    icon: Crosshair,
    desc: 'Arriving First Responder / EMT / Fire unit. Executes rapid breach, search & rescue, and life-safety extraction.'
  },
  {
    role: 'Admin',
    badge: 'INCIDENT COMMAND',
    icon: Sliders,
    desc: 'Venue Incident Commander. Full administrative override, municipal 911 dispatch liaison, and mesh governance.'
  }
];

export const RoleSelectorModal = ({ isOpen, onClose }) => {
  const { currentNode, zones, setCurrentNode, setEnrolled } = useCrisisStore();

  const [selectedRole, setSelectedRole] = useState(currentNode.role || 'Floor Staff');
  const [selectedZone, setSelectedZone] = useState(currentNode.zone || 'zone-lobby');
  const [name, setName] = useState(currentNode.name || `Node-${Math.floor(Math.random() * 900 + 100)}`);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    audioEngine.init();

    const updatedNode = {
      role: selectedRole,
      name: name.trim() || `Node-${Math.floor(Math.random() * 900 + 100)}`,
      zone: selectedZone,
      isEnrolled: true
    };

    setCurrentNode(updatedNode);
    setEnrolled(true);

    socket.emit('join:node', {
      role: updatedNode.role,
      name: updatedNode.name,
      zone: updatedNode.zone
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl border border-[var(--border-bright)] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--mesh)]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[var(--text-primary)] tracking-tight">
                MESH NODE ENROLLMENT
              </h2>
              <p className="font-sans text-xs text-[var(--text-muted)]">
                Select your operational role to enter the crisis mesh
              </p>
            </div>
          </div>
          <span className="glass-pill font-mono text-[10px] text-[var(--mesh)]">
            ZERO-LOGIN
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans text-xs">
          {/* Identity Name & Starting Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[var(--text-muted)] mb-1.5">
                Node Identifier / Call-Sign
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Staff-Alpha, Desk-01"
                className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--mesh)] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[var(--text-muted)] mb-1.5">
                Starting Station / Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-[#06080B] border border-[var(--border)] rounded-[8px] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--mesh)]"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.floor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Selection Cards */}
          <div>
            <label className="block text-[var(--text-muted)] mb-2.5">
              Select Operational Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ROLES_INFO.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => setSelectedRole(item.role)}
                    className={`glass-card p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--mesh)] bg-white/[0.06] shadow-sm'
                        : 'hover:border-[var(--border-bright)]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                          isSelected ? 'bg-[var(--mesh)]/20 text-[var(--mesh)]' : 'bg-white/[0.04] text-[var(--text-muted)]'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-sans font-semibold text-xs text-[var(--text-primary)]">{item.role}</div>
                          <div className="text-[9px] font-mono text-[var(--text-faint)] uppercase">
                            {item.badge}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--mesh)] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-2">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <div className="text-[11px] font-sans text-[var(--text-faint)]">
              Audio cues will calibrate on entry
            </div>
            <button
              type="submit"
              className="btn-crisis bg-[var(--mesh)] text-[#06080B] hover:brightness-110 shadow-none font-bold"
            >
              Enroll in Mesh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
