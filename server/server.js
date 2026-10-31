import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { store } from './store.js';
import { extractAiTriage } from './aiTriage.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.use(cors({ origin: '*' }));
app.use(express.json());

// REST Health & Telemetry API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Vortex Sentinel Gravity Hub',
    timestamp: Date.now(),
    building: store.getBuildingState(),
    hospital: store.getHospitalTelemetry()
  });
});

app.get('/api/building', (req, res) => {
  res.json(store.getBuildingState());
});

app.get('/api/hospital', (req, res) => {
  res.json(store.getHospitalTelemetry());
});

app.post('/api/triage', (req, res) => {
  const { text } = req.body || {};
  const extracted = extractAiTriage(text || '');
  res.json(extracted);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`[MESH CONNECT] Node connected: ${socket.id}`);

  // Send initial full venue state
  socket.emit('init:state', {
    buildingState: store.getBuildingState(),
    hospital: store.getHospitalTelemetry(),
    incidents: store.incidents,
    markers: Array.from(store.markers.values())
  });

  // Handler for incident submission (Supports REPORT_SUBMITTED and report:incident)
  const handleReportSubmitted = (data) => {
    console.log(`[REPORT_SUBMITTED] from ${socket.id}:`, data);
    const { rawText, floorNumber, roomNumber, trappedCount, hazardType, severity, reporterRole } = data || {};

    const { incident, marker, buildingState } = store.createIncident({
      rawText,
      floorNumber,
      roomNumber,
      trappedCount,
      hazardType,
      severity,
      reporterRole: reporterRole || 'Tactical Node'
    });

    // Broadcast standard updates
    io.emit('INCIDENT_UPDATED', incident);
    io.emit('incident:update', incident);
    io.emit('BUILDING_STATE_UPDATED', buildingState);
    io.emit('building:update', buildingState);
    io.emit('markers:update', Array.from(store.markers.values()));
    io.emit('HOSPITAL_UPDATED', store.getHospitalTelemetry());
    io.emit('hospital:update', store.getHospitalTelemetry());

    // Trigger High/Critical Level 4-5 Emergency Override Broadcast
    if (incident.severity >= 4) {
      console.log(`[CRISIS LEVEL ${incident.severity}] Broadcasting FORCE_OVERRIDE_ALERT`);
      const overridePayload = {
        incidentId: incident.id,
        severity: incident.severity,
        floorNumber: incident.floorNumber,
        roomNumber: incident.roomNumber,
        hazard: incident.rawText,
        hazardType: incident.hazardType,
        trapped: incident.trappedCount,
        dispatch: incident.dispatch,
        forcePriority: true,
        timestamp: incident.timestamp
      };

      io.emit('FORCE_OVERRIDE_ALERT', overridePayload);
      io.emit('CRISIS_EVENT', overridePayload);
    }
  };

  socket.on('REPORT_SUBMITTED', handleReportSubmitted);
  socket.on('report:incident', handleReportSubmitted);

  // Handler for floor rescue step (Supports RESCUE_STEP and rescue:step_floor)
  const handleRescueStep = (data) => {
    const { floorNumber } = data || {};
    console.log(`[RESCUE_STEP] Floor ${floorNumber}`);
    const res = store.rescueFloorStep(floorNumber);

    io.emit('BUILDING_STATE_UPDATED', res.buildingState);
    io.emit('building:update', res.buildingState);
    io.emit('markers:update', res.markers);
    io.emit('HOSPITAL_UPDATED', res.hospital);
    io.emit('hospital:update', res.hospital);

    if (res.updatedIncident) {
      io.emit('INCIDENT_UPDATED', res.updatedIncident);
      io.emit('incident:update', res.updatedIncident);
    }

    io.emit('rescue:saved', {
      floorNumber: res.floorNumber,
      totalTrapped: res.buildingState.totalTrapped,
      hospitalBedsOccupied: res.hospital.occupiedBeds
    });
  };

  socket.on('RESCUE_STEP', handleRescueStep);
  socket.on('rescue:step_floor', handleRescueStep);

  // High priority manual force override trigger
  socket.on('FORCE_OVERRIDE_TRIGGER', (overrideData) => {
    console.log(`[FORCE_OVERRIDE_TRIGGER] Manual override initiated:`, overrideData);
    const alertData = {
      incidentId: overrideData?.incidentId || `OVR-${Date.now()}`,
      severity: 5,
      floorNumber: overrideData?.floorNumber || 4,
      roomNumber: overrideData?.roomNumber || 'ALL',
      hazard: overrideData?.hazard || 'MANUAL TACTICAL EVACUATION ORDER',
      hazardType: overrideData?.hazardType || 'FIRE',
      trapped: overrideData?.trapped || 0,
      forcePriority: true,
      timestamp: Date.now()
    };
    io.emit('FORCE_OVERRIDE_ALERT', alertData);
    io.emit('CRISIS_EVENT', alertData);
  });

  // Response dispatch & resolution
  socket.on('dispatch:rescue', ({ incidentId }) => {
    const res = store.dispatchRescue(incidentId);
    if (res.incident) {
      io.emit('INCIDENT_UPDATED', res.incident);
      io.emit('incident:update', res.incident);
      io.emit('BUILDING_STATE_UPDATED', res.buildingState);
      io.emit('building:update', res.buildingState);
      io.emit('markers:update', Array.from(store.markers.values()));
    }
  });

  socket.on('resolve:incident', ({ incidentId }) => {
    const res = store.resolveIncident(incidentId);
    if (res.incident) {
      io.emit('INCIDENT_UPDATED', res.incident);
      io.emit('incident:update', res.incident);
      io.emit('BUILDING_STATE_UPDATED', res.buildingState);
      io.emit('building:update', res.buildingState);
      io.emit('markers:update', Array.from(store.markers.values()));
    }
  });

  // Offline batch sync
  socket.on('sync:offline_batch', ({ batch }) => {
    console.log(`[SYNC OFFLINE BATCH] Processing ${batch?.length || 0} buffered actions`);
    const res = store.syncOfflineBatch(batch);

    io.emit('batch:synced', {
      count: res.count,
      buildingState: res.buildingState,
      hospital: store.getHospitalTelemetry(),
      markers: Array.from(store.markers.values())
    });

    io.emit('BUILDING_STATE_UPDATED', res.buildingState);
    io.emit('building:update', res.buildingState);
    io.emit('HOSPITAL_UPDATED', res.hospital);
    io.emit('hospital:update', res.hospital);
    io.emit('markers:update', Array.from(store.markers.values()));
  });

  socket.on('disconnect', () => {
    console.log(`[MESH DISCONNECT] Socket node disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`  VORTEX SENTINEL / CRISISMESH GRAVITY HUB ONLINE      `);
  console.log(`  Express + Socket.io Server: http://${HOST}:${PORT}   `);
  console.log(`  WebSocket Sync Core: ws://localhost:${PORT}          `);
  console.log(`=======================================================`);
});
