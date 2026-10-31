// Facility Data Store & Spatial State Engine
// Manages BuildingState, FloorData, TrappedMarkers, and HospitalTelemetry

import { extractAiTriage, generateRoleDispatch } from './dispatcher.js';

class Store {
  constructor() {
    this.totalFloors = 6;
    this.markers = new Map(); // id -> TrappedMarker
    this.incidents = [];
    this.nodes = new Map();

    // Initial hospital telemetry state
    this.hospital = {
      id: 'relief-hub-01',
      name: 'General Medical Relief Pavilion & ICU Core',
      totalBeds: 40,
      occupiedBeds: 12,
      erCapacity: 15,
      erOccupied: 4,
      icuCapacity: 8,
      icuOccupied: 3,
      oxygenLevelPercent: 94,
      bloodUnitsAvailable: 68,
      traumaTeamsActive: 2,
      lastUpdated: Date.now()
    };

    // Pre-populate realistic incident
    this.createIncident({
      rawText: 'Active electrical flash fire in Suite 204 with 2 guests trapped in room',
      reporterRole: 'Floor Staff'
    });
  }

  getHospitalTelemetry() {
    return this.hospital;
  }

  updateHospitalTelemetry(updates = {}) {
    this.hospital = {
      ...this.hospital,
      ...updates,
      lastUpdated: Date.now()
    };
    return this.hospital;
  }

  getBuildingState() {
    const floorData = {};
    for (let i = 1; i <= this.totalFloors; i++) {
      floorData[String(i)] = {
        trappedCount: 0,
        hazardLevel: 'LOW',
        activeHazard: null
      };
    }

    let totalTrapped = 0;
    let maxSeverity = 1;

    // Aggregate from active markers
    for (const marker of this.markers.values()) {
      if (marker.status !== 'RESCUED') {
        const fKey = String(marker.floorNumber);
        if (floorData[fKey]) {
          floorData[fKey].trappedCount += marker.trappedCount;
          totalTrapped += marker.trappedCount;
          if (marker.trappedCount >= 3) {
            floorData[fKey].hazardLevel = 'HIGH';
          } else if (marker.trappedCount > 0) {
            floorData[fKey].hazardLevel = 'MEDIUM';
          }
          floorData[fKey].activeHazard = marker.hazardType;
        }
      }
    }

    for (const inc of this.incidents) {
      if (inc.status !== 'RESOLVED' && inc.severity > maxSeverity) {
        maxSeverity = inc.severity;
      }
    }

    return {
      id: 'vortex-sentinel-facility-01',
      name: 'Vortex Sentinel Sky-Rise Resort & Medical Complex',
      totalFloors: this.totalFloors,
      severity: maxSeverity,
      totalTrapped,
      floorData,
      markers: Array.from(this.markers.values()),
      hospital: this.hospital
    };
  }

  createIncident({ rawText, floorNumber, roomNumber, trappedCount, hazardType, severity, reporterRole = 'Floor Staff' }) {
    const triage = extractAiTriage(rawText || '');

    const resolvedFloor = floorNumber !== undefined ? Number(floorNumber) : triage.floorNumber;
    const resolvedRoom = roomNumber || triage.roomNumber;
    const resolvedTrapped = trappedCount !== undefined ? Number(trappedCount) : triage.trappedCount;
    const resolvedHazard = hazardType || triage.hazardType;
    const resolvedSeverity = severity !== undefined ? Number(severity) : triage.severity;

    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`;
    const markerId = `MK-${incidentId}`;

    const marker = {
      id: markerId,
      incidentId,
      floorNumber: Math.max(1, Math.min(this.totalFloors, resolvedFloor)),
      roomNumber: resolvedRoom,
      trappedCount: resolvedTrapped,
      hazardType: resolvedHazard,
      coordinatesOffset: [
        (Math.random() - 0.5) * 4,
        (resolvedFloor - 1) * 1.4 + 0.3,
        (Math.random() - 0.5) * 3
      ],
      status: resolvedTrapped > 0 ? 'TRAPPED' : 'RESCUED'
    };

    this.markers.set(markerId, marker);

    const incident = {
      id: incidentId,
      markerId,
      rawText: rawText || `Emergency reported on Floor ${resolvedFloor}`,
      floorNumber: marker.floorNumber,
      roomNumber: marker.roomNumber,
      trappedCount: resolvedTrapped,
      initialTrapped: resolvedTrapped,
      hazardType: resolvedHazard,
      severity: resolvedSeverity,
      status: resolvedTrapped > 0 ? 'ACTIVE' : 'SECURED',
      reporterRole,
      timestamp: Date.now(),
      dispatch: {
        Responder: generateRoleDispatch(marker, 'Responder'),
        FloorStaff: generateRoleDispatch(marker, 'Floor Staff'),
        Medical: generateRoleDispatch(marker, 'Medical')
      }
    };

    this.incidents.unshift(incident);

    return {
      incident,
      marker,
      buildingState: this.getBuildingState()
    };
  }

  rescueFloorStep(floorNumber) {
    const targetFloor = Number(floorNumber);
    const activeMarkersOnFloor = Array.from(this.markers.values()).filter(
      m => m.floorNumber === targetFloor && m.trappedCount > 0
    );

    let updatedIncident = null;

    if (activeMarkersOnFloor.length > 0) {
      const marker = activeMarkersOnFloor[0];
      marker.trappedCount = Math.max(0, marker.trappedCount - 1);
      
      if (marker.trappedCount === 0) {
        marker.status = 'RESCUED';
      } else {
        marker.status = 'RESCUE_IN_PROGRESS';
      }

      const matchingInc = this.incidents.find(i => i.id === marker.incidentId);
      if (matchingInc) {
        matchingInc.trappedCount = marker.trappedCount;
        if (matchingInc.trappedCount === 0) {
          matchingInc.status = 'SECURED';
        } else {
          matchingInc.status = 'EN_ROUTE';
        }
        updatedIncident = matchingInc;
      }

      // Update Hospital Telemetry intake
      if (this.hospital.occupiedBeds < this.hospital.totalBeds) {
        this.hospital.occupiedBeds += 1;
        this.hospital.erOccupied = Math.min(this.hospital.erCapacity, this.hospital.erOccupied + 1);
        this.hospital.bloodUnitsAvailable = Math.max(10, this.hospital.bloodUnitsAvailable - 1);
      }
    }

    return {
      buildingState: this.getBuildingState(),
      markers: Array.from(this.markers.values()),
      hospital: this.hospital,
      updatedIncident,
      floorNumber: targetFloor
    };
  }

  dispatchRescue(incidentId) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'EN_ROUTE';
      const marker = this.markers.get(incident.markerId);
      if (marker && marker.status === 'TRAPPED') {
        marker.status = 'RESCUE_IN_PROGRESS';
      }
    }
    return {
      incident,
      buildingState: this.getBuildingState()
    };
  }

  resolveIncident(incidentId) {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (incident) {
      incident.status = 'RESOLVED';
      incident.trappedCount = 0;
      const marker = this.markers.get(incident.markerId);
      if (marker) {
        marker.status = 'RESCUED';
        marker.trappedCount = 0;
      }
    }
    return {
      incident,
      buildingState: this.getBuildingState()
    };
  }

  syncOfflineBatch(batch = []) {
    const syncedResults = [];
    for (const action of batch) {
      if (action.type === 'REPORT_INCIDENT') {
        const res = this.createIncident(action.payload);
        syncedResults.push(res.incident);
      } else if (action.type === 'RESCUE_FLOOR_STEP') {
        this.rescueFloorStep(action.payload.floorNumber);
      } else if (action.type === 'DISPATCH_RESCUE') {
        this.dispatchRescue(action.payload.incidentId);
      } else if (action.type === 'RESOLVE_INCIDENT') {
        this.resolveIncident(action.payload.incidentId);
      }
    }
    return {
      count: syncedResults.length,
      buildingState: this.getBuildingState()
    };
  }
}

export const store = new Store();
