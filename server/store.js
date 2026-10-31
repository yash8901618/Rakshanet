// Facility Data Store & Spatial State Engine (Gravity Hub)
// Manages BuildingState, FloorData, TrappedMarkers, and HospitalTelemetry

import { extractAiTriage, generateRoleDispatch } from './aiTriage.js';

export class GravityStore {
  constructor() {
    this.totalFloors = 6;
    this.markers = new Map(); // id -> TrappedMarker
    this.incidents = [];

    // Hospital Telemetry metrics
    this.hospital = {
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
      traumaTeamsActive: 2,
      lastUpdated: Date.now()
    };

    // Pre-populate duplicate Level-5 emergencies on Floor 3 Room 304 for AI Ghost Triage Deduplication
    const markerId = 'MK-INC-F3-304';
    const marker = {
      id: markerId,
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
    this.markers.set(markerId, marker);

    this.incidents.push({
      id: 'INC-L5-304-01',
      markerId,
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
    });

    this.incidents.push({
      id: 'INC-L5-304-02',
      markerId,
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
        floorNumber: i,
        trappedCount: 0,
        hazardLevel: 'LOW',
        activeHazard: null
      };
    }

    let totalTrapped = 0;
    let maxSeverity = 1;

    // Aggregate from active spatial markers
    for (const marker of this.markers.values()) {
      if (marker.status !== 'RESCUED') {
        const fKey = String(marker.floorNumber);
        if (floorData[fKey]) {
          floorData[fKey].trappedCount += marker.trappedCount;
          totalTrapped += marker.trappedCount;

          if (marker.trappedCount >= 4 || marker.hazardType === 'FIRE') {
            floorData[fKey].hazardLevel = 'HIGH';
          } else if (marker.trappedCount >= 1) {
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
      id: 'vortex-sentinel-tower-01',
      name: 'Vortex Sentinel Sky-Rise Tactical Complex',
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

    const clampedFloor = Math.max(1, Math.min(this.totalFloors, resolvedFloor));

    // Spatial coordinate offset for 3D digital twin rendering
    const marker = {
      id: markerId,
      incidentId,
      floorNumber: clampedFloor,
      roomNumber: resolvedRoom,
      trappedCount: resolvedTrapped,
      hazardType: resolvedHazard,
      severity: resolvedSeverity,
      coordinatesOffset: [
        (Math.random() - 0.5) * 3.6,
        (clampedFloor - 1) * 1.5 + 0.35,
        (Math.random() - 0.5) * 2.8
      ],
      status: resolvedTrapped > 0 ? 'TRAPPED' : 'RESCUED',
      timestamp: Date.now()
    };

    this.markers.set(markerId, marker);

    const incident = {
      id: incidentId,
      markerId,
      rawText: rawText || `Emergency reported at Floor ${clampedFloor} Room ${resolvedRoom}`,
      floorNumber: clampedFloor,
      roomNumber: resolvedRoom,
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
        this.hospital.bloodUnitsAvailable = Math.max(8, this.hospital.bloodUnitsAvailable - 1);
        this.hospital.traumaKitsAvailable = Math.max(4, this.hospital.traumaKitsAvailable - 1);
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
      // Update any duplicate/merged reports with same marker or same floor & room
      for (const otherInc of this.incidents) {
        if (otherInc.markerId === incident.markerId || (otherInc.floorNumber === incident.floorNumber && otherInc.roomNumber === incident.roomNumber)) {
          otherInc.status = 'EN_ROUTE';
        }
      }
    }
    return {
      incident,
      buildingState: this.getBuildingState(),
      markers: Array.from(this.markers.values())
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
      // Update any duplicate/merged reports with same marker or same floor & room
      for (const otherInc of this.incidents) {
        if (otherInc.markerId === incident.markerId || (otherInc.floorNumber === incident.floorNumber && otherInc.roomNumber === incident.roomNumber)) {
          otherInc.status = 'RESOLVED';
          otherInc.trappedCount = 0;
        }
      }
    }
    return {
      incident,
      buildingState: this.getBuildingState(),
      markers: Array.from(this.markers.values())
    };
  }

  syncOfflineBatch(batch = []) {
    const syncedResults = [];
    for (const action of batch) {
      if (action.type === 'REPORT_INCIDENT' || action.type === 'REPORT_SUBMITTED') {
        const res = this.createIncident(action.payload);
        syncedResults.push(res.incident);
      } else if (action.type === 'RESCUE_FLOOR_STEP' || action.type === 'RESCUE_STEP') {
        this.rescueFloorStep(action.payload.floorNumber);
      } else if (action.type === 'DISPATCH_RESCUE') {
        this.dispatchRescue(action.payload.incidentId);
      } else if (action.type === 'RESOLVE_INCIDENT') {
        this.resolveIncident(action.payload.incidentId);
      }
    }
    return {
      count: syncedResults.length,
      buildingState: this.getBuildingState(),
      hospital: this.hospital
    };
  }
}

export const store = new GravityStore();
