import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wifi,
  WifiOff,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Globe,
  Battery,
  Smartphone,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useCrisisStore } from '../../store/crisisStore';
import { useToast } from '../../context/ToastContext';

/**
 * MeshNetwork Page Component
 * Renders an interactive 30-phone BLE/Wi-Fi Direct mesh simulation
 * with 3 Internet Gateway nodes, real-time node breaking & dynamic rerouting,
 * per-node battery indicators, live animated packet hopping,
 * and comprehensive telemetry stats.
 */
export const MeshNetwork = ({
  inline = false,
  autoStart = false,
  onOpenFullMesh,
  className = ''
}) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { isOfflineMode, toggleOfflineMode, triggerCrisisEvent } = useCrisisStore();

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Stats state
  const [testStats, setTestStats] = useState({
    sentCount: 1,
    deliveredCount: 1,
    lastHopCount: 5,
    lastLatencyMs: 34,
    deliveryRate: '100.0%'
  });

  // Packet animation state
  const [transmissionState, setTransmissionState] = useState({
    isTransmitting: false,
    currentHop: 0,
    totalHops: 0,
    activeSenderId: 0,
    activeReceiverId: 1,
    isDelivered: true,
    deliveredGatewayId: null, // derived dynamically so both card and banner match
    uploadedNotice: null
  });

  // Broken node IDs set
  const [brokenNodeIds, setBrokenNodeIds] = useState(new Set());

  // Hovered node state for pointer feedback
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Generate 30 phone nodes + 3 internet gateway nodes
  const allNodes = useMemo(() => {
    const list = [];

    // Node #0: Citizen SOS Origin Phone (bottom-left)
    list.push({
      id: 0,
      x: 0.09,
      y: 0.76,
      label: 'Node #0 (Citizen SOS)',
      shortLabel: 'N#0 (SOS)',
      type: 'citizen',
      battery: 84
    });

    // 29 peer phone nodes spread strategically across corridors and zones
    const phonePositions = [
      { x: 0.16, y: 0.58, b: 79 },
      { x: 0.22, y: 0.78, b: 65 },
      { x: 0.15, y: 0.38, b: 91 },
      { x: 0.24, y: 0.46, b: 54 },
      { x: 0.28, y: 0.68, b: 88 },
      { x: 0.22, y: 0.24, b: 73 },
      { x: 0.32, y: 0.36, b: 96 },
      { x: 0.35, y: 0.56, b: 42 },
      { x: 0.38, y: 0.78, b: 68 },
      { x: 0.30, y: 0.16, b: 82 },
      { x: 0.40, y: 0.26, b: 59 },
      { x: 0.44, y: 0.48, b: 77 },
      { x: 0.46, y: 0.68, b: 85 },
      { x: 0.38, y: 0.90, b: 63 },
      { x: 0.48, y: 0.15, b: 90 },
      { x: 0.52, y: 0.34, b: 71 },
      { x: 0.55, y: 0.54, b: 48 },
      { x: 0.56, y: 0.76, b: 83 },
      { x: 0.58, y: 0.20, b: 94 },
      { x: 0.62, y: 0.40, b: 66 },
      { x: 0.65, y: 0.62, b: 52 },
      { x: 0.66, y: 0.84, b: 75 },
      { x: 0.68, y: 0.22, b: 89 },
      { x: 0.72, y: 0.44, b: 61 },
      { x: 0.75, y: 0.66, b: 80 },
      { x: 0.78, y: 0.28, b: 93 },
      { x: 0.80, y: 0.50, b: 74 },
      { x: 0.82, y: 0.72, b: 57 },
      { x: 0.74, y: 0.86, b: 69 }
    ];

    phonePositions.forEach((pos, idx) => {
      const id = idx + 1;
      list.push({
        id,
        x: pos.x,
        y: pos.y,
        label: `Phone #${id}`,
        shortLabel: `P#${id}`,
        type: 'phone',
        battery: pos.b
      });
    });

    // 3 Dedicated Gateway Nodes marked "Internet"
    list.push({
      id: 30,
      x: 0.91,
      y: 0.20,
      label: 'GW-1 (Internet)',
      shortLabel: 'GW-1 [Internet]',
      type: 'gateway',
      battery: 100
    });

    list.push({
      id: 31,
      x: 0.93,
      y: 0.52,
      label: 'GW-2 (Internet)',
      shortLabel: 'GW-2 [Internet]',
      type: 'gateway',
      battery: 100
    });

    list.push({
      id: 32,
      x: 0.89,
      y: 0.82,
      label: 'GW-3 (Internet)',
      shortLabel: 'GW-3 [Internet]',
      type: 'gateway',
      battery: 100
    });

    return list;
  }, []);

  const gatewayIds = useMemo(() => [30, 31, 32], []);

  // Compute graph connections based on distance (~0.20 normalized units)
  const connectionRange = 0.21;

  // Pathfinding algorithm (BFS) considering non-broken nodes
  const computeActiveRoute = useCallback(
    (brokenSet) => {
      const activeNodes = allNodes.filter((n) => !brokenSet.has(n.id));
      const activeMap = new Map(activeNodes.map((n) => [n.id, n]));

      // If origin is broken, no route
      if (!activeMap.has(0)) return [];

      // Queue of paths: [[0]]
      const queue = [[0]];
      const visited = new Set([0]);

      while (queue.length > 0) {
        const path = queue.shift();
        const currentId = path[path.length - 1];
        const currentNode = activeMap.get(currentId);

        // If current node is one of the 3 Internet gateways, route found!
        if (gatewayIds.includes(currentId)) {
          return path;
        }

        // Check active neighbors within transmission range
        for (const neighbor of activeNodes) {
          if (!visited.has(neighbor.id)) {
            const dx = neighbor.x - currentNode.x;
            const dy = neighbor.y - currentNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= connectionRange) {
              visited.add(neighbor.id);
              queue.push([...path, neighbor.id]);
            }
          }
        }
      }

      return []; // Isolated, no active route
    },
    [allNodes, gatewayIds, connectionRange]
  );

  // Active route derived dynamically from brokenNodeIds
  const activeRoute = useMemo(
    () => computeActiveRoute(brokenNodeIds),
    [computeActiveRoute, brokenNodeIds]
  );

  // Derive target and active gateway labels to guarantee 100% synchronization across banner and cards
  const targetGatewayNode = useMemo(() => {
    if (activeRoute.length === 0) return null;
    const lastNodeId = activeRoute[activeRoute.length - 1];
    return allNodes.find((n) => n.id === lastNodeId) || null;
  }, [activeRoute, allNodes]);

  const targetGatewayLabel = targetGatewayNode ? targetGatewayNode.label : 'GW-3 (Internet)';

  const activeGatewayLabel = transmissionState.deliveredGatewayId
    ? (allNodes.find((n) => n.id === transmissionState.deliveredGatewayId)?.label || targetGatewayLabel)
    : targetGatewayLabel;

  // Auto-start packet propagation if requested (e.g. inline SOS preview)
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        handleSendTestSos();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Animation controller ref
  const animRef = useRef({
    startTime: Date.now(),
    isPlaying: false,
    route: activeRoute
  });

  // Send Test SOS packet handler
  const handleSendTestSos = () => {
    if (activeRoute.length < 2) {
      addToast({
        title: '⚠️ MESH ISOLATED',
        message: 'No active route to Internet Gateways. Packet stored in offline IndexedDB buffer.',
        type: 'warning',
        duration: 5000
      });
      return;
    }

    const totalHops = activeRoute.length - 1;
    animRef.current = {
      startTime: Date.now(),
      isPlaying: true,
      route: [...activeRoute]
    };

    setTransmissionState({
      isTransmitting: true,
      currentHop: 1,
      totalHops,
      activeSenderId: activeRoute[0],
      activeReceiverId: activeRoute[1],
      isDelivered: false,
      deliveredGatewayId: null,
      uploadedNotice: 'Relaying distress packet across BLE mesh nodes...'
    });

    addToast({
      title: '📡 TEST SOS TRANSMITTING',
      message: `Packet hopping via ${totalHops} BLE peers to Internet Gateway...`,
      type: 'info',
      duration: 3000
    });
  };

  // Toggle broken status of clicked node
  const handleToggleNode = (nodeId) => {
    // Cannot break the gateways (they are hardened comms hubs)
    if (gatewayIds.includes(nodeId)) {
      addToast({
        title: '🔒 GATEWAY HARDENED',
        message: 'Internet command gateways are redundant mains-powered nodes and cannot be broken.',
        type: 'info',
        duration: 3000
      });
      return;
    }

    setBrokenNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Reset all broken nodes
  const handleHealAllNodes = () => {
    setBrokenNodeIds(new Set());
    addToast({
      title: '✅ MESH TOPOLOGY RESTORED',
      message: 'All 30 phone nodes healed and operating at full BLE transmission range.',
      type: 'success',
      duration: 3500
    });
  };

  // Canvas interaction: click to toggle node
  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Find nearest node within hit radius
    const hitRadius = 20;
    for (const node of allNodes) {
      const nx = node.x * width;
      const ny = node.y * height;
      const dist = Math.sqrt((clickX - nx) ** 2 + (clickY - ny) ** 2);
      if (dist <= hitRadius) {
        handleToggleNode(node.id);
        break;
      }
    }
  };

  // Canvas interaction: mouse move for pointer cursor
  const handleCanvasMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const hitRadius = 20;
    let found = null;
    for (const node of allNodes) {
      const nx = node.x * width;
      const ny = node.y * height;
      const dist = Math.sqrt((mouseX - nx) ** 2 + (mouseY - ny) ** 2);
      if (dist <= hitRadius) {
        found = node.id;
        break;
      }
    }

    setHoveredNodeId(found);
    canvas.style.cursor = found !== null ? 'pointer' : 'default';
  };

  // Canvas Main Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Tactical Grid & Sector Markings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const pixelNodes = allNodes.map((n) => ({
        ...n,
        px: n.x * width,
        py: n.y * height,
        isBroken: brokenNodeIds.has(n.id)
      }));

      const bleRangePx = Math.min(width, height) * connectionRange * 1.15;

      // 2. Peer-to-Peer Mesh Links (Only between active non-broken nodes)
      ctx.lineWidth = 1;
      for (let i = 0; i < pixelNodes.length; i++) {
        for (let j = i + 1; j < pixelNodes.length; j++) {
          const nA = pixelNodes[i];
          const nB = pixelNodes[j];

          if (nA.isBroken || nB.isBroken) continue;

          const dx = nA.px - nB.px;
          const dy = nA.py - nB.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= bleRangePx) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.setLineDash([2, 5]);
            ctx.beginPath();
            ctx.moveTo(nA.px, nA.py);
            ctx.lineTo(nB.px, nB.py);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);

      // 3. Highlight Dynamic Active Route Edges
      if (activeRoute.length >= 2) {
        ctx.lineWidth = 3;
        for (let k = 0; k < activeRoute.length - 1; k++) {
          const nA = pixelNodes.find((n) => n.id === activeRoute[k]);
          const nB = pixelNodes.find((n) => n.id === activeRoute[k + 1]);
          if (nA && nB && !nA.isBroken && !nB.isBroken) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)'; // Amber active mesh path
            ctx.beginPath();
            ctx.moveTo(nA.px, nA.py);
            ctx.lineTo(nB.px, nB.py);
            ctx.stroke();
          }
        }
      }

      // 4. Animated SOS Packet Propagation
      const anim = animRef.current;
      if (anim.isPlaying && anim.route && anim.route.length >= 2) {
        const route = anim.route;
        const totalHops = route.length - 1;
        const hopDuration = 0.55; // seconds per hop
        const now = Date.now();
        const elapsed = (now - anim.startTime) / 1000;
        const currentSegment = Math.min(totalHops - 1, Math.floor(elapsed / hopDuration));
        const segmentProgress = Math.min(1, (elapsed % hopDuration) / hopDuration);

        if (elapsed < totalHops * hopDuration) {
          const fromNode = pixelNodes.find((n) => n.id === route[currentSegment]);
          const toNode = pixelNodes.find((n) => n.id === route[currentSegment + 1]);

          if (fromNode && toNode) {
            const pktX = fromNode.px + (toNode.px - fromNode.px) * segmentProgress;
            const pktY = fromNode.py + (toNode.py - fromNode.py) * segmentProgress;

            // Radiating glow
            const grad = ctx.createRadialGradient(pktX, pktY, 1, pktX, pktY, 16);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.35, '#F59E0B');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pktX, pktY, 16, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(pktX, pktY, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Hop ring around sender
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(fromNode.px, fromNode.py, 14 + segmentProgress * 12, 0, Math.PI * 2);
            ctx.stroke();

            // Update live telemetry
            setTransmissionState((prev) => ({
              ...prev,
              currentHop: currentSegment + 1,
              totalHops,
              activeSenderId: route[currentSegment],
              activeReceiverId: route[currentSegment + 1],
              isDelivered: false
            }));
          }
        } else {
          // Finished delivery to gateway!
          const finalGwId = route[route.length - 1];
          const gwNode = pixelNodes.find((n) => n.id === finalGwId);
          const gwName = gwNode ? gwNode.label : 'Internet Gateway';

          anim.isPlaying = false;

          setTransmissionState({
            isTransmitting: false,
            currentHop: totalHops,
            totalHops,
            activeSenderId: route[route.length - 2],
            activeReceiverId: finalGwId,
            isDelivered: true,
            deliveredGatewayId: finalGwId,
            uploadedNotice: `Uploaded to Command Hub via ${gwName}`
          });

          // Update aggregated stats
          setTestStats((prev) => {
            const nextSent = prev.sentCount + 1;
            const nextDelivered = prev.deliveredCount + 1;
            const rate = ((nextDelivered / nextSent) * 100).toFixed(1) + '%';
            return {
              sentCount: nextSent,
              deliveredCount: nextDelivered,
              lastHopCount: totalHops,
              lastLatencyMs: Math.round(totalHops * 6.8 + 8),
              deliveryRate: rate
            };
          });

          addToast({
            title: '✅ UPLOADED TO COMMAND HUB',
            message: `SOS distress telemetry verified via ${gwName} (Hop ${totalHops}/${totalHops}).`,
            type: 'success',
            duration: 5000
          });
        }
      }

      // 5. Draw All 33 Nodes (30 phones + 3 internet gateways)
      pixelNodes.forEach((node) => {
        const isCitizenNode = node.type === 'citizen';
        const isGatewayNode = node.type === 'gateway';
        const isOnRoute = activeRoute.includes(node.id);
        const isHovered = hoveredNodeId === node.id;

        // BLE Radio Transmission Halo
        if (!node.isBroken) {
          ctx.beginPath();
          ctx.arc(node.px, node.py, bleRangePx * 0.45, 0, Math.PI * 2);
          if (isGatewayNode) {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.28)';
            ctx.fillStyle = 'rgba(34, 197, 94, 0.03)';
          } else if (isCitizenNode) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.32)';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
          } else if (isOnRoute) {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.24)';
            ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
          } else {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
            ctx.fillStyle = 'transparent';
          }
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        }

        // Node Circle Rendering
        if (node.isBroken) {
          // Broken state
          ctx.fillStyle = '#1e1b2e';
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Red X
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.px - 4, node.py - 4);
          ctx.lineTo(node.px + 4, node.py + 4);
          ctx.moveTo(node.px + 4, node.py - 4);
          ctx.lineTo(node.px - 4, node.py + 4);
          ctx.stroke();

          // Broken label
          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillText('OFFLINE', node.px - 18, node.py + 18);
        } else if (isCitizenNode) {
          // Node 0: Citizen SOS Phone
          ctx.fillStyle = '#dc2626';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isHovered ? 3.5 : 2.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Label
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText('Node #0 (Citizen SOS)', node.px - 42, node.py - 16);
        } else if (isGatewayNode) {
          // Gateway node marked "Internet"
          // Outer radiating wave
          const time = Date.now() / 1000;
          const waveRadius = 14 + (Math.sin(time * 3 + node.id) + 1) * 3;
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, waveRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#15803d';
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = isHovered ? 3 : 2.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Gateway Label Marked "Internet"
          ctx.fillStyle = '#86efac';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText(node.label, node.px - 42, node.py - 18);

          // "INTERNET" Badge
          ctx.fillStyle = '#22c55e';
          ctx.font = '900 9px JetBrains Mono, monospace';
          ctx.fillText('⚡ INTERNET', node.px - 26, node.py + 24);
        } else {
          // Regular phone nodes
          ctx.fillStyle = isOnRoute ? '#f59e0b' : '#0284c7';
          ctx.strokeStyle = isHovered ? '#ffffff' : isOnRoute ? '#fde68a' : '#bae6fd';
          ctx.lineWidth = isHovered ? 2.5 : isOnRoute ? 2 : 1.2;
          ctx.beginPath();
          ctx.arc(node.px, node.py, isOnRoute ? 6.5 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Short Phone ID Label
          ctx.fillStyle = isOnRoute ? '#fef3c7' : '#94a3b8';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.fillText(node.shortLabel, node.px - 12, node.py - 10);
        }

        // 6. Draw Battery % Per Node directly on canvas
        if (!node.isBroken && !isGatewayNode) {
          const battery = node.battery;
          const bColor = battery > 65 ? '#4ade80' : battery > 40 ? '#facc15' : '#f87171';
          ctx.fillStyle = bColor;
          ctx.font = 'bold 8.5px JetBrains Mono, monospace';
          ctx.fillText(`${battery}%`, node.px - 8, node.py + 16);
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [allNodes, brokenNodeIds, activeRoute, hoveredNodeId, connectionRange]);

  if (inline) {
    return (
      <div className={`rounded-2xl emergency-surface border border-[var(--border-strong)] p-3.5 space-y-3 shadow-xl ${className}`}>
        {/* Inline Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-bold text-xs text-[var(--text-primary)]">
              Live BLE Mesh Route & Gateway Uplink
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
              Simulated BLE/Wi-Fi Direct mesh (prototype)
            </span>
          </div>
          {onOpenFullMesh && (
            <button
              type="button"
              onClick={onOpenFullMesh}
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline active:scale-95 transition-all"
            >
              <span>Explore Topology</span>
              <span>→</span>
            </button>
          )}
        </div>

        {/* Compact Telemetry Row */}
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] block">HOP COUNT</span>
            <span className="font-bold text-amber-400">
              {activeRoute.length > 0 ? `${activeRoute.length - 1} Hops` : '0 Hops'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] block">GATEWAY TARGET</span>
            <span className="font-bold text-emerald-400 truncate block">
              {activeGatewayLabel}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-navy-850/80 light:bg-slate-100 border border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] block">RELAY LATENCY</span>
            <span className="font-bold text-sky-400">
              ~{testStats.lastLatencyMs}ms
            </span>
          </div>
        </div>

        {/* Upload Notice */}
        {transmissionState.isDelivered && (
          <div className="p-2.5 rounded-xl bg-emerald-950/70 light:bg-emerald-50 border border-emerald-500/60 text-emerald-300 light:text-emerald-900 text-[11px] font-mono flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold truncate">
                {transmissionState.uploadedNotice || `Uploaded to Command Hub via ${activeGatewayLabel}`}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 shrink-0">
              Uplink Verified
            </span>
          </div>
        )}

        {/* Canvas Viewport (Compact) */}
        <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl bg-navy-950/90 light:bg-slate-900 border border-slate-800/80 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="w-full h-full block"
          />

          {/* Compact Legend Overlay */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 border border-white" />
                <span>Citizen SOS</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Active Route</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                <span>{activeGatewayLabel}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSendTestSos}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Re-hop Packet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Header & MANDATORY PROTOTYPE LABEL */}
      <div className="rounded-2xl emergency-surface border border-[var(--border-strong)] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 light:bg-amber-100 text-amber-400 light:text-amber-700 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                  Tactical Mesh Network & Offline Disruption Engine
                </h1>
                {/* MANDATORY EXACT LABEL AS REQUESTED */}
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-900 border border-amber-500/40 font-mono text-xs font-bold tracking-wide">
                  Simulated BLE/Wi-Fi Direct mesh (prototype)
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Zero-cellular delay-tolerant peer packet propagation. Dynamic rerouting when intermediary phones are lost or isolated.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Outage Simulation Status & Toggle */}
            <button
              type="button"
              onClick={toggleOfflineMode}
              className={`touch-target px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-md ${
                isOfflineMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-amber-600/90 hover:bg-amber-500 text-slate-950 border-amber-400'
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

            {/* Heal Broken Nodes Button */}
            {brokenNodeIds.size > 0 && (
              <button
                type="button"
                onClick={handleHealAllNodes}
                className="touch-target px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Heal All Nodes ({brokenNodeIds.size})</span>
              </button>
            )}

            {/* SEND TEST SOS BUTTON (MANDATORY REQUIREMENT) */}
            <button
              type="button"
              onClick={handleSendTestSos}
              className="touch-target px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-950/50 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Send test SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Telemetry HUD: Stats Cards (Hop count, Delivery rate, Avg latency) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        {/* Hop Count */}
        <div className="p-3.5 rounded-2xl emergency-surface border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] uppercase tracking-wider">Hop Count</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 light:text-amber-600">
            {activeRoute.length > 0 ? `${activeRoute.length - 1} Hops` : 'No Route'}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block truncate">
            {activeRoute.length > 0 ? `To ${activeGatewayLabel}` : 'Isolated cluster'}
          </span>
        </div>

        {/* Delivery Rate */}
        <div className="p-3.5 rounded-2xl emergency-surface border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] uppercase tracking-wider">Delivery Rate</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 light:text-emerald-600">
            {testStats.deliveryRate}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block">
            {testStats.deliveredCount} / {testStats.sentCount} distress packets verified
          </span>
        </div>

        {/* Average Latency */}
        <div className="p-3.5 rounded-2xl emergency-surface border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] uppercase tracking-wider">Average Latency</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-sky-400 light:text-sky-600">
            ~{testStats.lastLatencyMs}ms
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block">
            ~6.8ms peer-to-peer relay delay
          </span>
        </div>

        {/* Active Handset Nodes */}
        <div className="p-3.5 rounded-2xl emergency-surface border border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-[10px] uppercase tracking-wider">Mesh Topology</span>
            <Smartphone className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </div>
          <div className="text-xl font-extrabold text-[var(--text-primary)]">
            {30 - brokenNodeIds.size} / 30 Phones
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block">
            3 Internet Gateways active
          </span>
        </div>
      </div>

      {/* Prominent Upload Status Banner */}
      {transmissionState.isDelivered && (
        <div className="p-3 rounded-xl bg-emerald-950/70 light:bg-emerald-50 border border-emerald-500/60 text-emerald-300 light:text-emerald-900 text-xs font-mono flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              {transmissionState.uploadedNotice || `Uploaded to Command Hub via ${activeGatewayLabel}`}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-600/40">
            Verified Uplink
          </span>
        </div>
      )}

      {/* Interactive Canvas Viewport */}
      <div className="rounded-2xl emergency-surface border border-[var(--border-strong)] p-3 sm:p-4 space-y-3 shadow-2xl relative">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[var(--text-primary)] font-bold">
              Interactive Mesh Graph: Click any node to "break" it and watch the packet reroute
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] text-amber-400/90">
            {brokenNodeIds.size > 0 ? `${brokenNodeIds.size} node(s) currently severed` : 'All nodes healthy'}
          </span>
        </div>

        <div className="relative w-full h-[460px] sm:h-[520px] rounded-xl bg-navy-950/90 light:bg-slate-900 border border-slate-800/80 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="w-full h-full block"
          />

          {/* Interactive Legend Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
                <span>Node #0 (Citizen SOS)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Active Hop Route</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Peer Phone (Battery %)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                <span>3 Internet Gateways</span>
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-900 border border-red-500" />
                <span>Broken Node (Click to heal)</span>
              </span>
            </div>
            <span className="text-slate-400 text-[10px]">BLE 5.2 / Wi-Fi Direct ~50m Range</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeshNetwork;
