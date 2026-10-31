// In-memory data store for Vortex Sentinel Gravity Hub
// Implements BuildingState and TrappedMarker data contracts

import { extractTelemetryFromReport } from './dispatcher.js';

export const initialZones = [
  {
    id: 'zone-lobby',
    name: 'Grand Lobby & Atrium',
    floor: 'Ground Floor (L0)',
    level: 0,
    nodeType: 'facility',
    position: [0, 0, 0],
    dimensions: [14, 2.5, 10],
    capacity: 120,
    currentOccupancy: 38,
    hazardSeverity: 0,
    safeExit: 'North Main Portico Exit',
    safeVector: [0, 0, -8],
    cameraSnapshot: 'LOBBY_CAM_01',
    assignedResponders: ['Security Alpha']
  },
  {
    id: 'zone-dining',
    name: 'Oceanview Bistro & Terrace',
    floor: 'Ground Floor (L0 - East)',
    level: 0,
    nodeType: 'facility',
    position: [11, 0, 0],
    dimensions: [8, 2.5, 10],
    capacity: 85,
    currentOccupancy: 42,
    hazardSeverity: 0,
    safeExit: 'East Garden Terrace Exit',
    safeVector: [12, 0, 0],
    cameraSnapshot: 'BISTRO_CAM_03',
    assignedResponders: []
  },
  {
    id: 'zone-kitchen',
    name: 'Main Culinary Hub & BOH',
    floor: 'Ground Floor (L0 - North East)',
    level: 0,
    nodeType: 'facility',
    position: [11, 0, -8],
    dimensions: [8, 2.5, 6],
    capacity: 30,
    currentOccupancy: 18,
    hazardSeverity: 0,
    safeExit: 'Loading Bay 2 Service Egress',
    safeVector: [10, 0, -12],
    cameraSnapshot: 'KITCHEN_CAM_04',
    assignedResponders: []
  },
  {
    id: 'zone-ballroom',
    name: 'Grand Ballroom & Conference Hub',
    floor: 'Ground Floor (L0 - West)',
    level: 0,
    nodeType: 'facility',
    position: [-11, 0, 0],
    dimensions: [8, 2.5, 10],
    capacity: 220,
    currentOccupancy: 65,
    hazardSeverity: 0,
    safeExit: 'West Pavilion Double Egress',
    safeVector: [-14, 0, 0],
    cameraSnapshot: 'BALLROOM_CAM_02',
    assignedResponders: []
  },
  {
    id: 'zone-fl1',
    name: 'Floor 1 - Guest Suites 101–124 & Spa',
    floor: 'Level 1',
    level: 1,
    nodeType: 'facility',
    position: [0, 3.5, 0],
    dimensions: [20, 2.2, 10],
    capacity: 60,
    currentOccupancy: 28,
    hazardSeverity: 0,
    safeExit: 'Stairwell A (North Core)',
    safeVector: [0, 3.5, -8],
    cameraSnapshot: 'FL1_CORRIDOR_CAM_11',
    assignedResponders: []
  },
  {
    id: 'zone-fl2',
    name: 'Floor 2 - Guest Suites 201–224',
    floor: 'Level 2',
    level: 2,
    nodeType: 'facility',
    position: [0, 6.5, 0],
    dimensions: [20, 2.2, 10],
    capacity: 60,
    currentOccupancy: 34,
    hazardSeverity: 0,
    safeExit: 'Stairwell B (South Wing)',
    safeVector: [0, 6.5, 8],
    cameraSnapshot: 'FL2_CORRIDOR_CAM_21',
    assignedResponders: []
  },
  {
    id: 'zone-fl3',
    name: 'Floor 3 - Executive Suites 301–318',
    floor: 'Level 3',
    level: 3,
    nodeType: 'facility',
    position: [0, 9.5, 0],
    dimensions: [18, 2.2, 10],
    capacity: 45,
    currentOccupancy: 22,
    hazardSeverity: 0,
    safeExit: 'Stairwell A (North Core)',
    safeVector: [0, 9.5, -8],
    cameraSnapshot: 'FL3_CORRIDOR_CAM_31',
    assignedResponders: []
  },
  {
    id: 'zone-penthouse',
    name: 'Sky Lounge & Presidential Penthouse',
    floor: 'Level 4 (Rooftop)',
    level: 4,
    nodeType: 'facility',
    position: [0, 12.5, 0],
    dimensions: [14, 2.2, 8],
    capacity: 35,
    currentOccupancy: 14,
    hazardSeverity: 0,
    safeExit: 'Rooftop Sky-Chute & Helipad Egress',
    safeVector: [0, 12.5, 6],
    cameraSnapshot: 'PENTHOUSE_CAM_41',
    assignedResponders: []
  },
  {
    id: 'zone-parking',
    name: 'Sub-Level Parking & Utility Plant',
    floor: 'Basement (-L1)',
    level: -1,
    nodeType: 'facility',
    position: [0, -3.2, 0],
    dimensions: [26, 2.2, 14],
    capacity: 40,
    currentOccupancy: 9,
    hazardSeverity: 0,
    safeExit: 'Vehicular Ramp West to Outer Perimeter',
    safeVector: [-12, -3.2, 0],
    cameraSnapshot: 'BASEMENT_CAM_00',
    assignedResponders: []
  },
  {
    id: 'zone-hospital',
    name: 'Triage Hospital & Emergency Relief Hub',
    floor: 'Ground Level - Medical Wing',
    level: 0,
    nodeType: 'hospital',
    position: [18, 0, -4],
    dimensions: [10, 3.0, 10],
    capacity: 50,
    currentOccupancy: 8,
    hazardSeverity: 0,
    safeExit: 'Direct Ambulance Bay & Heli-Evac Point',
    safeVector: [22, 0, -4],
    cameraSnapshot: 'HOSPITAL_TRIAGE_CAM_01',
    assignedResponders: ['Trauma Medic Alpha', 'Relief Unit 1']
  }
];

export const initialManifest = [
  { room: '101', guests: 'Elena Rostova, Mark Vance', vip: true, count: 2, status: 'in_room', zoneId: 'zone-fl1' },
  { room: '104', guests: 'Dr. James Chen', vip: false, count: 1, status: 'in_room', zoneId: 'zone-fl1' },
  { room: '108', guests: 'Sarah & Liam O\'Connor', vip: false, count: 2, status: 'in_room', zoneId: 'zone-fl1' },
  { room: '202', guests: 'Ambassador K. Tanaka', vip: true, count: 3, status: 'in_room', zoneId: 'zone-fl2' },
  { room: '207', guests: 'Miller Family (4)', vip: false, count: 4, status: 'in_room', zoneId: 'zone-fl2' },
  { room: '215', guests: 'Lucas Wright', vip: false, count: 1, status: 'in_room', zoneId: 'zone-fl2' },
  { room: '301', guests: 'CEO Victoria Sterling', vip: true, count: 2, status: 'in_room', zoneId: 'zone-fl3' },
  { room: '309', guests: 'David & Clara Kim', vip: false, count: 2, status: 'in_room', zoneId: 'zone-fl3' },
  { room: 'PH-01', guests: 'Royal Delegation (Prince Faisal)', vip: true, count: 5, status: 'in_room', zoneId: 'zone-penthouse' },
  { room: 'Bistro', guests: 'Brunch & Dining Guests', vip: false, count: 42, status: 'in_room', zoneId: 'zone-dining' },
  { room: 'Lobby', guests: 'Check-in & Lounge Visitors', vip: false, count: 38, status: 'in_room', zoneId: 'zone-lobby' },
  { room: 'Ballroom', guests: 'Tech Summit Attendees', vip: false, count: 65, status: 'in_room', zoneId: 'zone-ballroom' }
];

class Store {
  constructor() {
    this.nodes = new Map(); // socketId -> { id, role, name, zone, connectedAt, lastSeen, ip }
    this.zones = JSON.parse(JSON.stringify(initialZones));
    this.manifest = JSON.parse(JSON.stringify(initialManifest));
    this.incidents = [];
    this.markers = new Map(); // markerId -> TrappedMarker
    this.acknowledgments = new Map(); // incidentId -> Set of nodeIds
    this.escalations = new Map(); // incidentId -> escalation metadata & SLA timer
  }

  // --- Node methods ---
  addNode(socketId, { role, name, zone, ip = '127.0.0.1' }) {
    const node = {
      id: socketId,
      role: role || 'Floor Staff',
      name: name || `Node-${socketId.slice(0, 4)}`,
      zone: zone || 'zone-lobby',
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      ip
    };
    this.nodes.set(socketId, node);
    return node;
  }

  updateNode(socketId, updates) {
    const existing = this.nodes.get(socketId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, lastSeen: Date.now() };
    this.nodes.set(socketId, updated);
    return updated;
  }

  removeNode(socketId) {
    const node = this.nodes.get(socketId);
    this.nodes.delete(socketId);
    return node;
  }

  getNode(socketId) {
    return this.nodes.get(socketId);
  }

  getAllNodes() {
    return Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      role: n.role,
      name: n.name,
      zone: n.zone,
      lastSeen: n.lastSeen,
      connectedAt: n.connectedAt
    }));
  }

  // --- Zone methods ---
  getZones() {
    return this.zones;
  }

  getZone(zoneId) {
    return this.zones.find(z => z.id === zoneId);
  }

  updateZoneSeverity(zoneId, severity) {
    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.hazardSeverity = Math.min(5, Math.max(0, parseInt(severity, 10) || 0));
    }
    return zone;
  }

  // --- Manifest methods ---
  getManifest() {
    return this.manifest;
  }

  updateManifestStatus(room, status) {
    const entry = this.manifest.find(m => m.room === room);
    if (entry) {
      entry.status = status;
    }
    return entry;
  }

  // --- Incident & Spatial Trapped Marker methods ---
  createIncident({ 
    zoneId, 
    text, 
    severity = 3, 
    trappedGuess = 0, 
    hazardType = 'FIRE',
    roomNumber = null,
    floorLevel = null,
    reporterRole = 'Staff', 
    reporterId = 'system' 
  }) {
    const id = `INC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const parsedSeverity = Math.min(5, Math.max(1, parseInt(severity, 10) || 3));
    
    // AI automatic extraction if text contains richer telemetry
    const extracted = extractTelemetryFromReport(text);

    let resolvedZone = this.getZone(zoneId);
    let resolvedFloor = floorLevel !== null && floorLevel !== undefined 
      ? Number(floorLevel) 
      : (extracted.floorNumber !== null ? extracted.floorNumber : (resolvedZone?.level !== undefined ? resolvedZone.level : 0));

    if (!resolvedZone) {
      // Find zone matching floor
      resolvedZone = this.zones.find(z => z.level === resolvedFloor) || {
        id: zoneId || 'zone-lobby',
        name: `Floor ${resolvedFloor} Sector`,
        level: resolvedFloor,
        position: [0, resolvedFloor * 3, 0],
        safeExit: 'North Main Portico Exit',
        safeVector: [0, resolvedFloor * 3, -8]
      };
    }

    const trappedCount = Math.max(0, parseInt(trappedGuess, 10) || extracted.trappedCount || 0);
    const finalRoomNumber = roomNumber || extracted.roomNumber || (resolvedFloor > 0 ? `${resolvedFloor}0${Math.floor(Math.random() * 8 + 1)}` : undefined);
    const finalHazardType = hazardType || extracted.hazardType || 'FIRE';

    const markerId = `MK-${id}`;
    const marker = {
      id: markerId,
      incidentId: id,
      floorNumber: resolvedFloor,
      roomNumber: finalRoomNumber,
      trappedCount,
      hazardType: finalHazardType,
      coordinatesOffset: [resolvedZone.position[0], resolvedZone.position[1] + (resolvedZone.dimensions ? resolvedZone.dimensions[1] / 2 + 1.2 : 2.5), resolvedZone.position[2]],
      status: trappedCount > 0 ? 'TRAPPED' : 'RESCUED'
    };

    this.markers.set(markerId, marker);

    const incident = {
      id,
      markerId,
      zoneId: resolvedZone.id,
      zoneName: resolvedZone.name,
      floorLevel: resolvedFloor,
      roomNumber: finalRoomNumber,
      safeExit: resolvedZone.safeExit,
      safeVector: resolvedZone.safeVector,
      text: text || 'Emergency condition reported',
      hazard: text,
      hazardType: finalHazardType,
      severity: parsedSeverity,
      trapped: trappedCount,
      initialTrapped: trappedCount,
      reporterRole,
      reporterId,
      status: 'ACTIVE',
      dispatchTeam: null,
      timestamp: Date.now(),
      escalated: false,
      urgencyLevel: parsedSeverity,
      acks: []
    };

    this.incidents.unshift(incident);
    this.updateZoneSeverity(resolvedZone.id, parsedSeverity);
    this.acknowledgments.set(id, new Set());

    return { incident, marker, buildingState: this.getBuildingState() };
  }

  dispatchRescue(incidentId, teamName = 'Alpha Strike Rescue Unit') {
    const incident = this.getIncident(incidentId);
    if (!incident) return null;

    incident.status = 'EN_ROUTE';
    incident.dispatchTeam = teamName;
    incident.dispatchedAt = Date.now();

    const marker = this.markers.get(incident.markerId);
    if (marker && marker.status === 'TRAPPED') {
      marker.status = 'RESCUE_IN_PROGRESS';
    }

    return { incident, marker, buildingState: this.getBuildingState() };
  }

  rescueStep(incidentId) {
    const incident = this.getIncident(incidentId);
    if (!incident) return null;

    if (incident.trapped > 0) {
      incident.trapped -= 1;
    }

    const marker = this.markers.get(incident.markerId);
    if (marker) {
      marker.trappedCount = incident.trapped;
      if (incident.trapped === 0) {
        marker.status = 'RESCUED';
        incident.status = 'SECURED';
        const otherInZone = this.getActiveIncidents().filter(i => i.zoneId === incident.zoneId && i.id !== incident.id);
        if (otherInZone.length === 0) {
          this.updateZoneSeverity(incident.zoneId, 1);
        }
      } else {
        marker.status = 'RESCUE_IN_PROGRESS';
        incident.status = 'EN_ROUTE';
      }
    }

    return { incident, marker, buildingState: this.getBuildingState() };
  }

  // Rescue 1 person from a specific floor
  rescueFloorStep(floorNumber) {
    const targetFloor = Number(floorNumber);
    const activeMarkersOnFloor = Array.from(this.markers.values()).filter(
      m => Number(m.floorNumber) === targetFloor && m.trappedCount > 0
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

      if (marker.incidentId) {
        const incident = this.getIncident(marker.incidentId);
        if (incident) {
          if (incident.trapped > 0) incident.trapped -= 1;
          if (incident.trapped === 0) {
            incident.status = 'SECURED';
            const otherInZone = this.getActiveIncidents().filter(i => i.zoneId === incident.zoneId && i.id !== incident.id);
            if (otherInZone.length === 0) {
              this.updateZoneSeverity(incident.zoneId, 1);
            }
          } else {
            incident.status = 'EN_ROUTE';
          }
          updatedIncident = incident;
        }
      }
    }

    return {
      buildingState: this.getBuildingState(),
      markers: this.getAllMarkers(),
      updatedIncident,
      floorNumber: targetFloor
    };
  }

  getIncident(incidentId) {
    return this.incidents.find(i => i.id === incidentId);
  }

  getAllIncidents() {
    return this.incidents;
  }

  getActiveIncidents() {
    return this.incidents.filter(i => i.status !== 'RESOLVED');
  }

  getAllMarkers() {
    return Array.from(this.markers.values());
  }

  getBuildingState() {
    const allMarkers = this.getAllMarkers();
    const activeIncidents = this.getActiveIncidents();

    let maxSeverity = 0;
    let totalTrapped = 0;
    const floorData = {
      '1': { trappedCount: 0, hazardLevel: 'LOW' },
      '2': { trappedCount: 0, hazardLevel: 'LOW' },
      '3': { trappedCount: 0, hazardLevel: 'LOW' },
      '4': { trappedCount: 0, hazardLevel: 'LOW' },
      '5': { trappedCount: 0, hazardLevel: 'LOW' },
      '6': { trappedCount: 0, hazardLevel: 'LOW' }
    };

    // Calculate from markers
    allMarkers.forEach(m => {
      const fNum = Math.max(1, Math.min(6, Number(m.floorNumber) || 1));
      const fKey = String(fNum);
      if (!floorData[fKey]) {
        floorData[fKey] = { trappedCount: 0, hazardLevel: 'LOW' };
      }
      floorData[fKey].trappedCount += (m.trappedCount || 0);
      totalTrapped += (m.trappedCount || 0);
      if (m.trappedCount > 0) {
        floorData[fKey].hazardLevel = m.trappedCount >= 3 ? 'HIGH' : 'MEDIUM';
      }
    });

    activeIncidents.forEach(inc => {
      if (inc.severity > maxSeverity) maxSeverity = inc.severity;
    });

    return {
      id: 'vortex-sentinel-facility-01',
      name: 'Vortex Sentinel Grand Resort & Medical Mesh',
      totalFloors: 6,
      severity: maxSeverity || 1,
      totalTrapped,
      floorData,
      markers: allMarkers
    };
  }

  recordAck(incidentId, nodeId) {
    let acks = this.acknowledgments.get(incidentId);
    if (!acks) {
      acks = new Set();
      this.acknowledgments.set(incidentId, acks);
    }
    acks.add(nodeId);

    const incident = this.getIncident(incidentId);
    if (incident) {
      incident.acks = Array.from(acks);
    }

    return {
      incidentId,
      nodeId,
      totalAcks: acks.size,
      totalNodes: this.nodes.size,
      ackList: Array.from(acks)
    };
  }

  getAcks(incidentId) {
    const acks = this.acknowledgments.get(incidentId);
    return acks ? Array.from(acks) : [];
  }

  escalateIncident(incidentId, newUrgency) {
    const incident = this.getIncident(incidentId);
    if (incident) {
      incident.escalated = true;
      incident.urgencyLevel = newUrgency || Math.min(5, incident.severity + 1);
    }
    return incident;
  }

  resolveIncident(incidentId) {
    const incident = this.getIncident(incidentId);
    if (incident) {
      incident.status = 'RESOLVED';
      incident.trapped = 0;
      incident.resolvedAt = Date.now();
      const marker = this.markers.get(incident.markerId);
      if (marker) {
        marker.status = 'RESCUED';
        marker.trappedCount = 0;
      }
      this.updateZoneSeverity(incident.zoneId, 0);
    }
    return { incident, buildingState: this.getBuildingState() };
  }

  syncOfflineBatch(batchEvents = []) {
    const results = [];
    for (const evt of batchEvents) {
      if (evt.type === 'REPORT_INCIDENT') {
        const res = this.createIncident(evt.payload);
        results.push({ type: 'INCIDENT_CREATED', payload: res.incident });
      } else if (evt.type === 'DISPATCH_RESCUE') {
        const res = this.dispatchRescue(evt.payload.incidentId, evt.payload.teamName);
        if (res) results.push({ type: 'DISPATCHED', payload: res.incident });
      } else if (evt.type === 'RESCUE_STEP') {
        const res = this.rescueStep(evt.payload.incidentId);
        if (res) results.push({ type: 'RESCUE_STEPPED', payload: res.incident });
      } else if (evt.type === 'RESCUE_FLOOR_STEP') {
        const res = this.rescueFloorStep(evt.payload.floorNumber);
        if (res) results.push({ type: 'RESCUE_FLOOR_STEPPED', payload: res.buildingState });
      } else if (evt.type === 'RESOLVE_INCIDENT') {
        const res = this.resolveIncident(evt.payload.incidentId);
        if (res) results.push({ type: 'RESOLVED', payload: res.incident });
      }
    }
    return { results, buildingState: this.getBuildingState() };
  }
}

export const store = new Store();
