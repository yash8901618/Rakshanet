import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { store } from './store.js';
import { extractAiTriage } from './dispatcher.js';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.use(cors({ origin: '*' }));
app.use(express.json());

// REST API Endpoints
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

// AI NLP Triage Endpoint
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
  console.log(`[MESH CONNECT] Node connected: ${socket.id} (IP: ${socket.handshake.address})`);

  // Send initial full venue state
  socket.emit('init:state', {
    buildingState: store.getBuildingState(),
    hospital: store.getHospitalTelemetry(),
    incidents: store.incidents,
    markers: Array.from(store.markers.values())
  });

  // Client reports incident
  socket.on('report:incident', (data) => {
    console.log(`[REPORT INCIDENT] from ${socket.id}:`, data);
    const { rawText, floorNumber, roomNumber, trappedCount, hazardType, severity, reporterRole } = data || {};

    const { incident, marker, buildingState } = store.createIncident({
      rawText,
      floorNumber,
      roomNumber,
      trappedCount,
      hazardType,
      severity,
      reporterRole: reporterRole || 'Floor Staff'
    });

    io.emit('incident:update', incident);
    io.emit('building:update', buildingState);
    io.emit('markers:update', Array.from(store.markers.values()));
    io.emit('hospital:update', store.getHospitalTelemetry());

    // Trigger High/Critical Level 4-5 Emergency Override Broadcast
    if (incident.severity >= 4) {
      console.log(`[CRISIS EVENT LEVEL ${incident.severity}] Broadcasting Force-Priority Screen Lock!`);
      io.emit('CRISIS_EVENT', {
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
      });
    }
  });

  // Client triggers Floor-Level precision rescue step (Rescued -1)
  socket.on('rescue:step_floor', (data) => {
    const { floorNumber } = data || {};
    console.log(`[RESCUE STEP FLOOR] Rescuing occupant on Floor ${floorNumber}`);
    const res = store.rescueFloorStep(floorNumber);

    io.emit('building:update', res.buildingState);
    io.emit('markers:update', res.markers);
    io.emit('hospital:update', res.hospital);

    if (res.updatedIncident) {
      io.emit('incident:update', res.updatedIncident);
    }

    io.emit('rescue:saved', {
      floorNumber: res.floorNumber,
      totalTrapped: res.buildingState.totalTrapped,
      hospitalBedsOccupied: res.hospital.occupiedBeds
    });
  });

  // Client dispatches response unit
  socket.on('dispatch:rescue', ({ incidentId }) => {
    const res = store.dispatchRescue(incidentId);
    if (res.incident) {
      io.emit('incident:update', res.incident);
      io.emit('building:update', res.buildingState);
    }
  });

  // Client resolves incident
  socket.on('resolve:incident', ({ incidentId }) => {
    const res = store.resolveIncident(incidentId);
    if (res.incident) {
      io.emit('incident:update', res.incident);
      io.emit('building:update', res.buildingState);
      io.emit('markers:update', Array.from(store.markers.values()));
    }
  });

  // Client reconciles offline queued batch
  socket.on('sync:offline_batch', ({ batch }) => {
    console.log(`[OFFLINE BATCH SYNC] Processing ${batch?.length || 0} buffered actions from ${socket.id}`);
    const res = store.syncOfflineBatch(batch);

    io.emit('batch:synced', {
      count: res.count,
      buildingState: res.buildingState,
      hospital: store.getHospitalTelemetry(),
      markers: Array.from(store.markers.values())
    });

    io.emit('building:update', res.buildingState);
    io.emit('markers:update', Array.from(store.markers.values()));
  });

  socket.on('disconnect', () => {
    console.log(`[MESH DISCONNECT] Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`  VORTEX SENTINEL BACKEND - GRAVITY HUB ONLINE`);
  console.log(`  Express + Socket.io Server: http://${HOST}:${PORT}`);
  console.log(`  WebSocket Endpoint: ws://localhost:${PORT}`);
  console.log(`====================================================`);
});
