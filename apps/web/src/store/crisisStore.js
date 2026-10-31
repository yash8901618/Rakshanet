import { create } from 'zustand';
import { socket } from '../socket';

const OFFLINE_STORAGE_KEY = 'vortex_sentinel_offline_queue';

const loadSavedOfflineQueue = () => {
  try {
    const saved = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const persistOfflineQueue = (queue) => {
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline queue to localStorage', e);
  }
};

export const useCrisisStore = create((set, get) => ({
  // Node Identity & Enrollment
  currentNode: {
    id: null,
    role: 'Floor Staff',
    name: 'Staff-Alpha',
    zone: 'zone-lobby',
    isEnrolled: false
  },

  // Connected Mesh Nodes
  nodes: [],

  // Hotel Zones
  zones: [],
  selectedZoneId: null,

  // Guest Manifest
  manifest: [],

  // Live Incidents
  incidents: [],

  // Spatial Building State & Trapped Markers
  buildingState: {
    id: 'vortex-sentinel-facility-01',
    name: 'Vortex Sentinel Facility & Medical Mesh',
    totalFloors: 6,
    severity: 1,
    totalTrapped: 0,
    floorData: {
      '1': { trappedCount: 0, hazardLevel: 'LOW' },
      '2': { trappedCount: 0, hazardLevel: 'LOW' },
      '3': { trappedCount: 0, hazardLevel: 'LOW' },
      '4': { trappedCount: 0, hazardLevel: 'LOW' },
      '5': { trappedCount: 0, hazardLevel: 'LOW' },
      '6': { trappedCount: 0, hazardLevel: 'LOW' }
    },
    markers: []
  },
  markers: [],

  // Force Priority Emergency Lockout
  forcePriorityLock: false,
  activeCrisisEvent: null,
  acknowledgedIncidentIds: new Set(),

  // SLA & Escalation
  slaCountdown: null,
  escalationNotice: null,

  // Audio / Sound state
  isAudioMuted: false,

  // Offline Resiliency Simulator
  isOfflineMode: false,
  offlineQueue: loadSavedOfflineQueue(),
  isSyncing: false,
  lastSyncNotice: null,

  // UI state
  activeTab: 'twin',
  isReportModalOpen: false,

  // --- ACTIONS ---

  setCurrentNode: (updates) => set((state) => ({
    currentNode: { ...state.currentNode, ...updates }
  })),

  setEnrolled: (isEnrolled) => set((state) => ({
    currentNode: { ...state.currentNode, isEnrolled }
  })),

  setNodes: (nodes) => set({ nodes }),

  setZones: (zones) => set({ zones }),

  updateZoneSeverity: (zoneId, severity) => set((state) => ({
    zones: state.zones.map((z) => (z.id === zoneId ? { ...z, hazardSeverity: severity } : z))
  })),

  setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),

  setManifest: (manifest) => set({ manifest }),

  setIncidents: (incidents) => set({ incidents }),

  setBuildingState: (buildingState) => set({
    buildingState: buildingState || get().buildingState,
    markers: buildingState?.markers || get().markers
  }),

  setMarkers: (markers) => set((state) => ({
    markers: markers || [],
    buildingState: {
      ...state.buildingState,
      markers: markers || []
    }
  })),

  addOrUpdateIncident: (incident) => set((state) => {
    const existingIndex = state.incidents.findIndex((i) => i.id === incident.id);
    let updatedIncidents;
    if (existingIndex >= 0) {
      updatedIncidents = [...state.incidents];
      updatedIncidents[existingIndex] = { ...updatedIncidents[existingIndex], ...incident };
    } else {
      updatedIncidents = [incident, ...state.incidents];
    }

    const updatedZones = state.zones.map((z) => {
      if (z.id === incident.zoneId) {
        return { ...z, hazardSeverity: incident.status === 'RESOLVED' ? 0 : incident.severity };
      }
      return z;
    });

    return { incidents: updatedIncidents, zones: updatedZones };
  }),

  // Dispatch Rescue Team action (with offline fallback)
  dispatchRescueAction: (incidentId, teamName = 'Alpha Strike Rescue Unit') => {
    const { isOfflineMode, offlineQueue } = get();

    if (isOfflineMode) {
      set((state) => ({
        incidents: state.incidents.map(inc => 
          inc.id === incidentId ? { ...inc, status: 'EN_ROUTE', dispatchTeam: teamName } : inc
        ),
        markers: state.markers.map(m =>
          m.incidentId === incidentId ? { ...m, status: 'RESCUE_IN_PROGRESS' } : m
        )
      }));

      const queuedEvent = {
        id: `offline-${Date.now()}`,
        type: 'DISPATCH_RESCUE',
        timestamp: Date.now(),
        payload: { incidentId, teamName }
      };
      const updatedQueue = [...offlineQueue, queuedEvent];
      persistOfflineQueue(updatedQueue);
      set({ offlineQueue: updatedQueue });
      return;
    }

    socket.emit('dispatch:rescue', { incidentId, teamName });
  },

  // Rescue Step (+1 Saved) action (with offline fallback)
  rescueStepAction: (incidentId) => {
    const { isOfflineMode, offlineQueue } = get();

    if (isOfflineMode) {
      set((state) => {
        const updatedIncidents = state.incidents.map(inc => {
          if (inc.id === incidentId && inc.trapped > 0) {
            const nextTrapped = inc.trapped - 1;
            return {
              ...inc,
              trapped: nextTrapped,
              status: nextTrapped === 0 ? 'SECURED' : 'EN_ROUTE'
            };
          }
          return inc;
        });

        const updatedMarkers = state.markers.map(m => {
          if (m.incidentId === incidentId) {
            const nextTrapped = Math.max(0, m.trappedCount - 1);
            return {
              ...m,
              trappedCount: nextTrapped,
              status: nextTrapped === 0 ? 'RESCUED' : 'RESCUE_IN_PROGRESS'
            };
          }
          return m;
        });

        return {
          incidents: updatedIncidents,
          markers: updatedMarkers
        };
      });

      const queuedEvent = {
        id: `offline-${Date.now()}`,
        type: 'RESCUE_STEP',
        timestamp: Date.now(),
        payload: { incidentId }
      };
      const updatedQueue = [...offlineQueue, queuedEvent];
      persistOfflineQueue(updatedQueue);
      set({ offlineQueue: updatedQueue });
      return;
    }

    socket.emit('rescue:step', { incidentId });
  },

  // Rescue Floor Step action (by floor number)
  rescueFloorStepAction: (floorNumber) => {
    const { isOfflineMode, offlineQueue } = get();

    if (isOfflineMode) {
      const targetFloor = Number(floorNumber);
      set((state) => {
        let oneRescued = false;
        const updatedMarkers = state.markers.map(m => {
          if (Number(m.floorNumber) === targetFloor && m.trappedCount > 0 && !oneRescued) {
            oneRescued = true;
            const nextTrapped = Math.max(0, m.trappedCount - 1);
            return {
              ...m,
              trappedCount: nextTrapped,
              status: nextTrapped === 0 ? 'RESCUED' : 'RESCUE_IN_PROGRESS'
            };
          }
          return m;
        });

        const updatedIncidents = state.incidents.map(inc => {
          if (Number(inc.floorLevel) === targetFloor && inc.trapped > 0) {
            const nextTrapped = Math.max(0, inc.trapped - 1);
            return {
              ...inc,
              trapped: nextTrapped,
              status: nextTrapped === 0 ? 'SECURED' : 'EN_ROUTE'
            };
          }
          return inc;
        });

        const currentFloorData = { ...state.buildingState.floorData };
        const fKey = String(targetFloor);
        if (currentFloorData[fKey]) {
          const nextFCount = Math.max(0, currentFloorData[fKey].trappedCount - 1);
          currentFloorData[fKey] = {
            ...currentFloorData[fKey],
            trappedCount: nextFCount,
            hazardLevel: nextFCount >= 3 ? 'HIGH' : nextFCount > 0 ? 'MEDIUM' : 'LOW'
          };
        }

        const totalTrapped = Object.values(currentFloorData).reduce((acc, curr) => acc + (curr.trappedCount || 0), 0);

        return {
          markers: updatedMarkers,
          incidents: updatedIncidents,
          buildingState: {
            ...state.buildingState,
            totalTrapped,
            floorData: currentFloorData,
            markers: updatedMarkers
          }
        };
      });

      const queuedEvent = {
        id: `offline-${Date.now()}`,
        type: 'RESCUE_FLOOR_STEP',
        timestamp: Date.now(),
        payload: { floorNumber }
      };
      const updatedQueue = [...offlineQueue, queuedEvent];
      persistOfflineQueue(updatedQueue);
      set({ offlineQueue: updatedQueue });
      return;
    }

    socket.emit('rescue:step_floor', { floorNumber });
  },

  // Report Incident action (with offline fallback)
  reportIncidentAction: (reportData) => {
    const { isOfflineMode, offlineQueue, currentNode } = get();

    if (isOfflineMode) {
      const tempId = `OFFLINE-INC-${Date.now()}`;
      const optimisticIncident = {
        id: tempId,
        markerId: `MK-${tempId}`,
        zoneId: reportData.zoneId,
        zoneName: reportData.zoneName || 'Sector Alert',
        floorLevel: reportData.floorLevel || 0,
        text: reportData.text,
        hazard: reportData.text,
        hazardType: reportData.hazardType || 'FIRE',
        severity: reportData.severity || 3,
        trapped: reportData.trappedGuess || 0,
        reporterRole: currentNode.role,
        status: 'ACTIVE',
        timestamp: Date.now(),
        acks: []
      };

      const optimisticMarker = {
        id: `MK-${tempId}`,
        incidentId: tempId,
        floorNumber: reportData.floorLevel || 0,
        roomNumber: reportData.roomNumber,
        trappedCount: reportData.trappedGuess || 0,
        hazardType: reportData.hazardType || 'FIRE',
        coordinatesOffset: [0, (reportData.floorLevel || 0) * 3 + 2, 0],
        status: (reportData.trappedGuess || 0) > 0 ? 'TRAPPED' : 'RESCUED'
      };

      set((state) => ({
        incidents: [optimisticIncident, ...state.incidents],
        markers: [...state.markers, optimisticMarker]
      }));

      const queuedEvent = {
        id: `offline-${Date.now()}`,
        type: 'REPORT_INCIDENT',
        timestamp: Date.now(),
        payload: {
          ...reportData,
          reporterRole: currentNode.role
        }
      };
      const updatedQueue = [...offlineQueue, queuedEvent];
      persistOfflineQueue(updatedQueue);
      set({ offlineQueue: updatedQueue });
      return;
    }

    socket.emit('report:incident', {
      ...reportData,
      reporterRole: currentNode.role
    });
  },

  toggleOfflineMode: () => {
    const nextState = !get().isOfflineMode;
    set({ isOfflineMode: nextState });

    if (!nextState) {
      get().flushOfflineQueue();
    }
  },

  flushOfflineQueue: () => {
    const queue = get().offlineQueue;
    if (queue.length === 0) return;

    set({ isSyncing: true });
    socket.emit('sync:offline_batch', { batch: queue });

    const syncedCount = queue.length;
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    set({
      offlineQueue: [],
      isSyncing: false,
      lastSyncNotice: `Successfully reconciled ${syncedCount} queued actions to Gravity Hub.`
    });

    setTimeout(() => {
      set({ lastSyncNotice: null });
    }, 4000);
  },

  resolveIncidentInStore: (incidentId, zoneId) => {
    const { isOfflineMode, offlineQueue } = get();

    if (isOfflineMode) {
      set((state) => ({
        incidents: state.incidents.map((inc) => 
          inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc
        ),
        markers: state.markers.map((m) =>
          m.incidentId === incidentId ? { ...m, status: 'RESCUED', trappedCount: 0 } : m
        ),
        zones: state.zones.map((z) => 
          z.id === zoneId ? { ...z, hazardSeverity: 0 } : z
        ),
        forcePriorityLock: false
      }));

      const queuedEvent = {
        id: `offline-${Date.now()}`,
        type: 'RESOLVE_INCIDENT',
        timestamp: Date.now(),
        payload: { incidentId }
      };
      const updatedQueue = [...offlineQueue, queuedEvent];
      persistOfflineQueue(updatedQueue);
      set({ offlineQueue: updatedQueue });
      return;
    }

    socket.emit('resolve:incident', { incidentId });
  },

  triggerCrisisEvent: (crisisPayload) => set((state) => {
    const acks = state.acknowledgedIncidentIds;
    const isAlreadyAcked = acks.has(crisisPayload.incidentId);

    return {
      activeCrisisEvent: crisisPayload,
      forcePriorityLock: crisisPayload.forcePriority && !isAlreadyAcked
    };
  }),

  acknowledgeCrisis: (incidentId) => set((state) => {
    const updatedAcks = new Set(state.acknowledgedIncidentIds);
    updatedAcks.add(incidentId);
    return {
      acknowledgedIncidentIds: updatedAcks,
      forcePriorityLock: false
    };
  }),

  setSlaCountdown: (sla) => set({ slaCountdown: sla }),

  setEscalationNotice: (notice) => set({ escalationNotice: notice }),

  clearEscalationNotice: () => set({ escalationNotice: null }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setIsReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),

  toggleAudioMute: () => set((state) => ({ isAudioMuted: !state.isAudioMuted }))
}));
