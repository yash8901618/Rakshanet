import { create } from 'zustand';
import { socket, emitIncidentReport, emitRescueStep, emitOfflineBatch } from '../services/socket';
import { offlineStore } from '../services/offlineStore';
import { audioHaptics } from '../services/audioHaptics';

export const useCrisisStore = create((set, get) => {
  const initialMarker = {
    id: 'MK-INC-F3-304',
    incidentId: 'INC-L5-304-01',
    floorNumber: 3,
    roomNumber: '304',
    trappedCount: 2,
    hazardType: 'FIRE',
    severity: 5,
    coordinatesOffset: [0, 3.25, 0],
    status: 'TRAPPED',
    timestamp: Date.now() - 45000
  };

  const initialIncidents = [
    {
      id: 'INC-L5-304-01',
      markerId: 'MK-INC-F3-304',
      rawText: 'Active electrical fire in Room 304 with 2 guests trapped behind fire door, heavy toxic smoke spreading.',
      floorNumber: 3,
      roomNumber: '304',
      trappedCount: 2,
      initialTrapped: 2,
      hazardType: 'FIRE',
      severity: 5,
      status: 'ACTIVE',
      reporterRole: 'Citizen BLE Node #304',
      languageDetected: 'Hinglish (Hindi + English)',
      confidenceScore: '98.6%',
      timestamp: Date.now() - 45000,
      dispatch: {
        Responder: 'CRITICAL LEVEL 5: Breach Floor 3 (Room 304). 2 souls trapped. Deploy suppression & trauma extraction immediately.',
        FloorStaff: 'CRITICAL LEVEL 5: Evacuate Floor 3 immediately via Stairwell B. Clear corridor 304.',
        Medical: 'CRITICAL LEVEL 5: Emergency Relief Hub on standby for incoming Floor 3 casualties.'
      }
    },
    {
      id: 'INC-L5-304-02',
      markerId: 'MK-INC-F3-304',
      rawText: 'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 2 log andar trapped hain, please jaldi rescue team bhejo!',
      floorNumber: 3,
      roomNumber: '304',
      trappedCount: 2,
      initialTrapped: 2,
      hazardType: 'FIRE',
      severity: 5,
      status: 'ACTIVE',
      reporterRole: 'Floor Staff #03',
      languageDetected: 'Hinglish (Detected)',
      confidenceScore: '97.2%',
      timestamp: Date.now() - 15000,
      dispatch: {
        Responder: 'CRITICAL LEVEL 5: Breach Floor 3 (Room 304). 2 souls trapped. Deploy suppression & trauma extraction immediately.',
        FloorStaff: 'CRITICAL LEVEL 5: Evacuate Floor 3 immediately via Stairwell B. Clear corridor 304.',
        Medical: 'CRITICAL LEVEL 5: Emergency Relief Hub on standby for incoming Floor 3 casualties.'
      }
    }
  ];

  return {
  // Building and Spatial Digital Twin state
  buildingState: {
    id: 'vortex-sentinel-tower-01',
    name: 'Vortex Sentinel Sky-Rise Complex',
    totalFloors: 6,
    severity: 5,
    totalTrapped: 2,
    floorData: {
      '1': { floorNumber: 1, trappedCount: 0, hazardLevel: 'LOW', activeHazard: null },
      '2': { floorNumber: 2, trappedCount: 0, hazardLevel: 'LOW', activeHazard: null },
      '3': { floorNumber: 3, trappedCount: 2, hazardLevel: 'HIGH', activeHazard: 'FIRE' },
      '4': { floorNumber: 4, trappedCount: 0, hazardLevel: 'LOW', activeHazard: null },
      '5': { floorNumber: 5, trappedCount: 0, hazardLevel: 'LOW', activeHazard: null },
      '6': { floorNumber: 6, trappedCount: 0, hazardLevel: 'LOW', activeHazard: null }
    },
    markers: [initialMarker]
  },
  markers: [initialMarker],

  // Hospital Telemetry state
  hospitalState: {
    id: 'relief-hub-01',
    name: 'General Medical Relief Pavilion & ICU Core',
    totalBeds: 40,
    occupiedBeds: 14,
    erCapacity: 16,
    erOccupied: 6,
    icuCapacity: 8,
    icuOccupied: 3,
    oxygenLevelPercent: 94,
    bloodUnitsAvailable: 65,
    traumaKitsAvailable: 28,
    traumaTeamsActive: 2
  },

  // Incident Feed
  incidents: initialIncidents,

  // UI States
  selectedFloor: null, // null for all floors, or 1-6
  activeRole: 'home', // 'home', 'citizen', 'authority', 'responder', 'hospital'
  activeTab: 'home', // 'home', 'twin', 'tactical', 'telemetry', 'incidents', 'command'
  isReportModalOpen: false,
  isAudioMuted: false,

  // Force Priority Emergency Lockout Modal (Level 4/5)
  forcePriorityLock: false,
  activeCrisisEvent: null,

  // Offline Mesh Simulator & IndexedDB Queue
  isOfflineMode: false,
  offlineQueue: [],
  lastSyncNotice: null,
  isSocketConnected: false,

  // --- ACTIONS ---

  initStore: async () => {
    // 1. Load pending offline queue from IndexedDB
    try {
      const storedQueue = await offlineStore.getQueue();
      if (storedQueue && storedQueue.length > 0) {
        set({ offlineQueue: storedQueue });
      }
    } catch (e) {
      console.warn('Failed to load initial offline queue', e);
    }

    // 2. Set up Socket.io event listeners
    socket.on('connect', () => {
      set({ isSocketConnected: true });
      // If returning online and not manually in offline simulation mode, flush queue
      if (!get().isOfflineMode && get().offlineQueue.length > 0) {
        get().flushOfflineQueue();
      }
    });

    socket.on('disconnect', () => {
      set({ isSocketConnected: false });
    });

    socket.on('init:state', (data) => {
      if (data) {
        if (data.buildingState) {
          set({
            buildingState: data.buildingState,
            markers: data.markers || data.buildingState.markers || []
          });
          offlineStore.cacheVenueState('buildingState', data.buildingState);
        }
        if (data.hospital) {
          set({ hospitalState: data.hospital });
          offlineStore.cacheVenueState('hospitalState', data.hospital);
        }
        if (data.incidents) {
          set({ incidents: data.incidents });
        }
      }
    });

    const handleBuildingUpdate = (bState) => {
      if (!get().isOfflineMode && bState) {
        set({
          buildingState: bState,
          markers: bState.markers || get().markers
        });
        offlineStore.cacheVenueState('buildingState', bState);
      }
    };
    socket.on('BUILDING_STATE_UPDATED', handleBuildingUpdate);
    socket.on('building:update', handleBuildingUpdate);

    const handleHospitalUpdate = (hState) => {
      if (!get().isOfflineMode && hState) {
        set({ hospitalState: hState });
        offlineStore.cacheVenueState('hospitalState', hState);
      }
    };
    socket.on('HOSPITAL_UPDATED', handleHospitalUpdate);
    socket.on('hospital:update', handleHospitalUpdate);

    const handleIncidentUpdate = (incident) => {
      if (!get().isOfflineMode && incident) {
        set((state) => {
          const index = state.incidents.findIndex((i) => i.id === incident.id);
          let nextIncidents;
          if (index >= 0) {
            nextIncidents = [...state.incidents];
            nextIncidents[index] = incident;
          } else {
            nextIncidents = [incident, ...state.incidents];
          }
          return { incidents: nextIncidents };
        });

        // Trigger chime/sound if new high priority incident
        if (incident.severity >= 4) {
          audioHaptics.playAlert(incident.severity);
        }
      }
    };
    socket.on('INCIDENT_UPDATED', handleIncidentUpdate);
    socket.on('incident:update', handleIncidentUpdate);

    socket.on('markers:update', (markers) => {
      if (!get().isOfflineMode && markers) {
        set({ markers });
      }
    });

    const handleCrisisEvent = (crisis) => {
      if (crisis) {
        get().triggerCrisisEvent(crisis);
      }
    };
    socket.on('FORCE_OVERRIDE_ALERT', handleCrisisEvent);
    socket.on('CRISIS_EVENT', handleCrisisEvent);

    socket.on('rescue:saved', (data) => {
      audioHaptics.playRescueChime();
    });

    socket.on('batch:synced', ({ count }) => {
      set({
        lastSyncNotice: `Reconciled ${count} offline emergency actions with Gravity Hub!`
      });
      setTimeout(() => set({ lastSyncNotice: null }), 4000);
    });
  },

  setBuildingState: (bState) => set({ buildingState: bState }),
  setHospitalState: (hState) => set({ hospitalState: hState }),
  setMarkers: (markers) => set({ markers }),
  setIncidents: (incidents) => set({ incidents }),
  setSelectedFloor: (floor) => set({ selectedFloor: floor }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveRole: (role) => set({ activeRole: role, activeTab: 'home' }),
  setIsReportModalOpen: (isOpen) => set({ isReportModalOpen: isOpen }),

  runLiveDemoScenario: () => {
    try {
      audioHaptics.playAlert(5);
    } catch (e) {
      // ignore
    }

    const demoIncidentId = `DEMO-${Date.now()}`;
    const demoIncident = {
      id: demoIncidentId,
      markerId: `MK-${demoIncidentId}`,
      rawText: 'CRITICAL EMERGENCY SCENARIO: 4th floor Room 402 severe structural fire & collapse. 5 persons trapped behind fire door. Air supply depleting.',
      floorNumber: 4,
      roomNumber: '402',
      trappedCount: 5,
      initialTrapped: 5,
      hazardType: 'FIRE',
      severity: 5,
      status: 'ACTIVE',
      reporterRole: 'BLE Mesh Citizen Node #402',
      timestamp: Date.now()
    };

    const demoMarker = {
      id: `MK-${demoIncidentId}`,
      incidentId: demoIncidentId,
      floorNumber: 4,
      roomNumber: '402',
      trappedCount: 5,
      hazardType: 'FIRE',
      severity: 5,
      coordinatesOffset: [0.6, 3 * 1.5 + 0.35, -0.4],
      status: 'TRAPPED',
      timestamp: Date.now()
    };

    set((state) => {
      const nextFloorData = { ...state.buildingState.floorData };
      nextFloorData['4'] = {
        floorNumber: 4,
        trappedCount: 5,
        hazardLevel: 'HIGH',
        activeHazard: 'FIRE'
      };

      const totalTrapped = Object.values(nextFloorData).reduce(
        (acc, cur) => acc + (cur.trappedCount || 0),
        0
      );

      const nextHospital = {
        ...state.hospitalState,
        erOccupied: Math.min(state.hospitalState.erCapacity, (state.hospitalState.erOccupied || 6) + 4),
        icuOccupied: Math.min(state.hospitalState.icuCapacity, (state.hospitalState.icuOccupied || 3) + 2),
        oxygenLevelPercent: 88,
        bloodUnitsAvailable: 58
      };

      return {
        buildingState: {
          ...state.buildingState,
          totalTrapped,
          severity: 5,
          floorData: nextFloorData
        },
        hospitalState: nextHospital,
        markers: [demoMarker, ...state.markers],
        incidents: [demoIncident, ...state.incidents],
        activeCrisisEvent: {
          incidentId: demoIncidentId,
          severity: 5,
          floorNumber: 4,
          roomNumber: '402',
          hazard: demoIncident.rawText,
          hazardType: 'FIRE',
          trapped: 5,
          forcePriority: true,
          timestamp: Date.now()
        }
      };
    });
  },

  toggleMute: () => {
    const nextMuted = !get().isAudioMuted;
    audioHaptics.setMuted(nextMuted);
    set({ isAudioMuted: nextMuted });
  },

  // Floor-Level Precision Rescue Step Action ("Rescued -1")
  rescueFloorStepAction: async (floorNumber) => {
    const { isOfflineMode, offlineQueue } = get();
    const targetFloor = Number(floorNumber);

    // Audio & Haptic confirmation
    audioHaptics.playRescueChime();

    // Optimistic update for all roles
    set((state) => {
      let savedOne = false;
      const updatedMarkers = state.markers.map((m) => {
        if (m.floorNumber === targetFloor && m.trappedCount > 0 && !savedOne) {
          savedOne = true;
          const nextCount = Math.max(0, m.trappedCount - 1);
          return {
            ...m,
            trappedCount: nextCount,
            status: nextCount === 0 ? 'RESCUED' : 'RESCUE_IN_PROGRESS'
          };
        }
        return m;
      });

      const currentFloorData = { ...state.buildingState.floorData };
      const fKey = String(targetFloor);
      if (currentFloorData[fKey]) {
        const nextFCount = Math.max(0, (currentFloorData[fKey].trappedCount || 0) - 1);
        currentFloorData[fKey] = {
          ...currentFloorData[fKey],
          trappedCount: nextFCount,
          hazardLevel: nextFCount >= 4 ? 'HIGH' : nextFCount > 0 ? (currentFloorData[fKey].activeHazard === 'FIRE' ? 'HIGH' : 'MEDIUM') : 'LOW'
        };
      }

      const totalTrapped = Object.values(currentFloorData).reduce(
        (acc, cur) => acc + (cur.trappedCount || 0),
        0
      );

      // Decrement on matching incidents too
      const nextIncidents = state.incidents.map((inc) => {
        if (inc.floorNumber === targetFloor && inc.trappedCount > 0) {
          const nextCount = Math.max(0, inc.trappedCount - 1);
          return {
            ...inc,
            trappedCount: nextCount,
            status: nextCount === 0 ? 'SECURED' : 'EN_ROUTE'
          };
        }
        return inc;
      });

      // Update hospital intake
      const updatedHospital = {
        ...state.hospitalState,
        occupiedBeds: Math.min(state.hospitalState.totalBeds, state.hospitalState.occupiedBeds + 1),
        erOccupied: Math.min(state.hospitalState.erCapacity, state.hospitalState.erOccupied + 1),
        bloodUnitsAvailable: Math.max(8, state.hospitalState.bloodUnitsAvailable - 1)
      };

      return {
        incidents: nextIncidents,
        markers: updatedMarkers,
        hospitalState: updatedHospital,
        buildingState: {
          ...state.buildingState,
          totalTrapped,
          floorData: currentFloorData,
          markers: updatedMarkers
        }
      };
    });

    if (isOfflineMode) {
      const action = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'RESCUE_STEP',
        timestamp: Date.now(),
        payload: { floorNumber: targetFloor }
      };

      await offlineStore.enqueueAction(action);
      set({ offlineQueue: [...offlineQueue, action] });
      return;
    }

    emitRescueStep(targetFloor);
  },

  // Report Incident action with offline queue fallback
  reportIncidentAction: async (reportData) => {
    const { isOfflineMode, offlineQueue } = get();

    if (reportData.severity >= 4) {
      audioHaptics.playAlert(reportData.severity);
    }

    if (isOfflineMode) {
      const tempId = `OFFLINE-INC-${Date.now()}`;
      const floor = reportData.floorNumber || 1;
      const trapped = reportData.trappedCount || 0;

      const optimisticIncident = {
        id: tempId,
        markerId: `MK-${tempId}`,
        rawText: reportData.rawText,
        floorNumber: floor,
        roomNumber: reportData.roomNumber || `${floor}02`,
        trappedCount: trapped,
        initialTrapped: trapped,
        hazardType: reportData.hazardType || 'FIRE',
        severity: reportData.severity || 3,
        status: trapped > 0 ? 'ACTIVE' : 'SECURED',
        reporterRole: reportData.reporterRole || 'Local Offline Node',
        timestamp: Date.now()
      };

      const optimisticMarker = {
        id: `MK-${tempId}`,
        incidentId: tempId,
        floorNumber: floor,
        roomNumber: optimisticIncident.roomNumber,
        trappedCount: trapped,
        hazardType: optimisticIncident.hazardType,
        severity: optimisticIncident.severity,
        coordinatesOffset: [
          (Math.random() - 0.5) * 3,
          (floor - 1) * 1.5 + 0.35,
          (Math.random() - 0.5) * 2.5
        ],
        status: trapped > 0 ? 'TRAPPED' : 'RESCUED',
        timestamp: Date.now()
      };

      set((state) => {
        const nextFloorData = { ...state.buildingState.floorData };
        const fKey = String(floor);
        if (nextFloorData[fKey]) {
          const nextCount = (nextFloorData[fKey].trappedCount || 0) + trapped;
          nextFloorData[fKey] = {
            ...nextFloorData[fKey],
            trappedCount: nextCount,
            hazardLevel: nextCount >= 4 || reportData.hazardType === 'FIRE' ? 'HIGH' : 'MEDIUM',
            activeHazard: reportData.hazardType
          };
        }

        const totalTrapped = Object.values(nextFloorData).reduce(
          (acc, cur) => acc + (cur.trappedCount || 0),
          0
        );

        return {
          incidents: [optimisticIncident, ...state.incidents],
          markers: [...state.markers, optimisticMarker],
          buildingState: {
            ...state.buildingState,
            totalTrapped,
            floorData: nextFloorData
          }
        };
      });

      const action = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'REPORT_SUBMITTED',
        timestamp: Date.now(),
        payload: reportData
      };

      await offlineStore.enqueueAction(action);
      set({ offlineQueue: [...offlineQueue, action] });

      if (reportData.severity >= 5) {
        get().triggerCrisisEvent({
          incidentId: tempId,
          severity: 5,
          floorNumber: floor,
          roomNumber: optimisticIncident.roomNumber,
          hazard: reportData.rawText,
          hazardType: reportData.hazardType,
          trapped,
          forcePriority: true,
          timestamp: Date.now()
        });
      }
      return;
    }

    emitIncidentReport(reportData);
  },

  // Toggle Network Outage Simulation
  toggleOfflineMode: async () => {
    const nextState = !get().isOfflineMode;
    set({ isOfflineMode: nextState });

    if (!nextState) {
      await get().flushOfflineQueue();
    }
  },

  // Reconcile buffered offline actions to Gravity Hub
  flushOfflineQueue: async () => {
    const queue = await offlineStore.getQueue();
    if (!queue || queue.length === 0) {
      set({ offlineQueue: [] });
      return;
    }

    emitOfflineBatch(queue);
    const count = queue.length;
    await offlineStore.clearQueue();

    set({
      offlineQueue: [],
      lastSyncNotice: `Reconciled ${count} offline emergency actions with Gravity Hub!`
    });

    setTimeout(() => {
      set({ lastSyncNotice: null });
    }, 4000);
  },

  // Force Priority Emergency Screen Lockout Controls
  triggerCrisisEvent: (crisis) => {
    if (!crisis) return;

    const floor = Number(crisis.floorNumber) || 3;
    const room = String(crisis.roomNumber || `${floor}04`);
    const trapped = Number(crisis.trapped) || 2;
    const hazard = crisis.hazard || 'Floor 3 pe Room 304 ke paas electrical wiring mein aag lag gayi hai aur heavy smoke hai! Hum 2 log andar trapped hain, please jaldi rescue team bhejo!';
    const hazardType = crisis.hazardType || 'FIRE';
    const incidentId = crisis.incidentId || `SOS-${Date.now()}`;

    // 1. Create 3D spatial marker for Building3DTwin
    const newMarker = {
      id: `MK-${incidentId}`,
      incidentId,
      floorNumber: floor,
      roomNumber: room,
      trappedCount: trapped,
      hazardType,
      severity: crisis.severity || 5,
      coordinatesOffset: [0.75, (floor - 1) * 1.45 + 0.35, -0.5],
      status: 'TRAPPED',
      timestamp: Date.now()
    };

    // 2. Create Incident Feed item with AI entity extraction
    const newIncident = {
      id: incidentId,
      markerId: `MK-${incidentId}`,
      rawText: hazard,
      floorNumber: floor,
      roomNumber: room,
      trappedCount: trapped,
      initialTrapped: trapped,
      hazardType,
      severity: crisis.severity || 5,
      status: 'ACTIVE',
      reporterRole: crisis.reporterRole || 'Citizen BLE Mesh Node #304',
      languageDetected: 'Hinglish (Hindi + English)',
      confidenceScore: '98.6%',
      timestamp: Date.now()
    };

    set((state) => {
      // 3. Update floor-by-floor building state
      const nextFloorData = { ...state.buildingState.floorData };
      const fKey = String(floor);
      const prevFloor = nextFloorData[fKey] || { floorNumber: floor, trappedCount: 0 };
      const newFloorTrapped = (prevFloor.trappedCount || 0) + trapped;
      nextFloorData[fKey] = {
        ...prevFloor,
        floorNumber: floor,
        trappedCount: newFloorTrapped,
        hazardLevel: 'HIGH',
        activeHazard: hazardType
      };

      // 4. Calculate total trapped across building
      const totalTrapped = Object.values(nextFloorData).reduce(
        (acc, cur) => acc + (cur.trappedCount || 0),
        0
      );

      // 5. Update hospital telemetry intake
      const nextHospital = {
        ...state.hospitalState,
        erOccupied: Math.min(state.hospitalState.erCapacity, (state.hospitalState.erOccupied || 6) + trapped),
        icuOccupied: Math.min(state.hospitalState.icuCapacity, (state.hospitalState.icuOccupied || 3) + 1)
      };

      const enrichedCrisis = {
        ...crisis,
        floorNumber: floor,
        roomNumber: room,
        trapped,
        hazard,
        hazardType,
        languageDetected: 'Hinglish (Hindi + English)',
        confidenceScore: '98.6%',
        exitDirection: 'Stairwell B (South Exit)',
        exitDistance: '45m (East corridor)'
      };

      return {
        activeCrisisEvent: enrichedCrisis,
        forcePriorityLock: crisis.forcePriority === true,
        markers: [newMarker, ...state.markers.filter(m => m.id !== newMarker.id)],
        incidents: [newIncident, ...state.incidents.filter(i => i.id !== newIncident.id)],
        buildingState: {
          ...state.buildingState,
          totalTrapped,
          severity: Math.max(state.buildingState.severity || 1, crisis.severity || 5),
          floorData: nextFloorData
        },
        hospitalState: nextHospital
      };
    });

    audioHaptics.startSiren();
  },

  dismissCrisisLock: () => {
    audioHaptics.stopSiren();
    set({ forcePriorityLock: false });
  },

  dispatchIncidentAction: (incidentId) => {
    set((state) => {
      let targetMarkerId = null;
      let targetFloor = null;
      let targetRoom = null;

      const targetInc = state.incidents.find(i => i.id === incidentId);
      if (targetInc) {
        targetMarkerId = targetInc.markerId;
        targetFloor = targetInc.floorNumber;
        targetRoom = targetInc.roomNumber;
      }

      const nextIncidents = state.incidents.map((inc) => {
        if (
          inc.id === incidentId ||
          (targetMarkerId && inc.markerId === targetMarkerId) ||
          (targetFloor && targetRoom && inc.floorNumber === targetFloor && inc.roomNumber === targetRoom)
        ) {
          return { ...inc, status: 'EN_ROUTE' };
        }
        return inc;
      });

      const nextMarkers = state.markers.map((m) => {
        if (
          m.incidentId === incidentId ||
          m.id === targetMarkerId ||
          (targetFloor && targetRoom && m.floorNumber === targetFloor && m.roomNumber === targetRoom)
        ) {
          return { ...m, status: 'RESCUE_IN_PROGRESS' };
        }
        return m;
      });

      return {
        incidents: nextIncidents,
        markers: nextMarkers
      };
    });

    socket.emit('dispatch:rescue', { incidentId });
  },

  resolveIncidentAction: (incidentId) => {
    audioHaptics.playRescueChime();

    set((state) => {
      let targetMarkerId = null;
      let targetFloor = 3;
      let targetRoom = null;
      let freedSouls = 0;

      const targetInc = state.incidents.find(i => i.id === incidentId);
      if (targetInc) {
        targetMarkerId = targetInc.markerId;
        targetFloor = targetInc.floorNumber || 3;
        targetRoom = targetInc.roomNumber;
        freedSouls = targetInc.trappedCount || 2;
      }

      const nextIncidents = state.incidents.map((inc) => {
        if (
          inc.id === incidentId ||
          (targetMarkerId && inc.markerId === targetMarkerId) ||
          (targetFloor && targetRoom && inc.floorNumber === targetFloor && inc.roomNumber === targetRoom)
        ) {
          freedSouls = Math.max(freedSouls, inc.trappedCount || 0);
          return { ...inc, status: 'SECURED', trappedCount: 0 };
        }
        return inc;
      });

      const nextMarkers = state.markers.map((m) => {
        if (
          m.incidentId === incidentId ||
          m.id === targetMarkerId ||
          (targetFloor && targetRoom && m.floorNumber === targetFloor && m.roomNumber === targetRoom)
        ) {
          return { ...m, status: 'RESCUED', trappedCount: 0 };
        }
        return m;
      });

      const nextFloorData = { ...state.buildingState.floorData };
      const fKey = String(targetFloor);
      if (nextFloorData[fKey]) {
        nextFloorData[fKey] = {
          ...nextFloorData[fKey],
          trappedCount: 0,
          hazardLevel: 'LOW',
          activeHazard: null
        };
      }

      const totalTrapped = Object.values(nextFloorData).reduce(
        (acc, cur) => acc + (cur.trappedCount || 0),
        0
      );

      const nextHospital = {
        ...state.hospitalState,
        occupiedBeds: Math.min(state.hospitalState.totalBeds, state.hospitalState.occupiedBeds + (freedSouls || 1)),
        erOccupied: Math.min(state.hospitalState.erCapacity, state.hospitalState.erOccupied + (freedSouls || 1))
      };

      return {
        incidents: nextIncidents,
        markers: nextMarkers,
        hospitalState: nextHospital,
        buildingState: {
          ...state.buildingState,
          totalTrapped,
          floorData: nextFloorData,
          markers: nextMarkers
        }
      };
    });

  socket.emit('resolve:incident', { incidentId });
  }
};
});

if (typeof window !== 'undefined') {
  window.__CRISIS_STORE__ = useCrisisStore;
}

