import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Radio, Wifi, Send, CheckCircle2, Shield, Smartphone, RefreshCw, Zap } from 'lucide-react';

/**
 * MeshVisualizer Component
 * Renders 30 simulated phone handsets communicating via peer-to-peer BLE Mesh.
 * Shows BLE range circles, animated multi-hop packet propagation, hop counter HUD,
 * and the mandatory "Simulated BLE mesh (prototype)" label.
 */
export const MeshVisualizer = ({
  inline = false,
  autoStart = true,
  onDeliveryComplete,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [hopStatus, setHopStatus] = useState({
    currentHop: 0,
    totalHops: 5,
    isDelivered: false,
    latencyMs: 38,
    activeSenderNode: 0,
    activeReceiverNode: 1
  });

  const [isTransmitting, setIsTransmitting] = useState(false);

  // Generate 30 phone nodes positioned realistically across a 2D mesh grid
  const nodes = useMemo(() => {
    const list = [];
    // Node 0: Citizen SOS Origin (bottom-left)
    list.push({ id: 0, x: 0.12, y: 0.78, label: 'Node #0 (Citizen SOS)', type: 'citizen', battery: '82%' });

    // Intermediate 28 handset nodes forming a connected mesh corridor
    const intermediates = [
      { x: 0.20, y: 0.62 }, { x: 0.26, y: 0.82 }, { x: 0.18, y: 0.45 },
      { x: 0.28, y: 0.52 }, { x: 0.35, y: 0.70 }, { x: 0.32, y: 0.35 },
      { x: 0.40, y: 0.48 }, { x: 0.45, y: 0.65 }, { x: 0.42, y: 0.25 },
      { x: 0.50, y: 0.38 }, { x: 0.54, y: 0.58 }, { x: 0.48, y: 0.78 },
      { x: 0.58, y: 0.22 }, { x: 0.62, y: 0.42 }, { x: 0.66, y: 0.64 },
      { x: 0.68, y: 0.28 }, { x: 0.72, y: 0.48 }, { x: 0.75, y: 0.72 },
      { x: 0.78, y: 0.32 }, { x: 0.82, y: 0.54 }, { x: 0.80, y: 0.18 },
      { x: 0.85, y: 0.40 }, { x: 0.24, y: 0.28 }, { x: 0.36, y: 0.85 },
      { x: 0.58, y: 0.82 }, { x: 0.72, y: 0.85 }, { x: 0.60, y: 0.10 },
      { x: 0.74, y: 0.14 }
    ];

    intermediates.forEach((pos, idx) => {
      list.push({
        id: idx + 1,
        x: pos.x,
        y: pos.y,
        label: `Peer #${idx + 1}`,
        type: 'peer',
        battery: `${65 + ((idx * 7) % 30)}%`
      });
    });

    // Node 29: Command Gateway Node (top-right)
    list.push({ id: 29, x: 0.90, y: 0.24, label: 'Gateway #29 (Relief Hub)', type: 'gateway', battery: '100% (Mains)' });

    return list;
  }, []);

  // Pre-calculated multi-hop shortest route from Node 0 (Citizen) to Node 29 (Gateway)
  // Route: 0 -> 4 -> 7 -> 10 -> 14 -> 17 -> 22 -> 29
  const hopRoute = useMemo(() => [0, 4, 7, 10, 14, 17, 22, 29], []);

  // Packet animation state in ref for 60fps canvas loop
  const animStateRef = useRef({
    progress: 0, // 0 to 1 across entire route
    hopIndex: 0,
    startTime: Date.now(),
    isPlaying: true
  });

  const triggerPacketBroadcast = () => {
    setIsTransmitting(true);
    animStateRef.current = {
      progress: 0,
      hopIndex: 0,
      startTime: Date.now(),
      isPlaying: true
    };
    setHopStatus({
      currentHop: 1,
      totalHops: hopRoute.length - 1,
      isDelivered: false,
      latencyMs: 12,
      activeSenderNode: hopRoute[0],
      activeReceiverNode: hopRoute[1]
    });
  };

  useEffect(() => {
    if (autoStart) {
      triggerPacketBroadcast();
    }
  }, [autoStart]);

  // Main Canvas Rendering Loop
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

      // 1. Draw subtle background tactical grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 32;
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

      const bleRangePx = Math.min(width, height) * 0.22; // ~15m BLE radius equivalent

      // 2. Draw BLE range circles and peer connections
      const pixelNodes = nodes.map((n) => ({
        ...n,
        px: n.x * width,
        py: n.y * height
      }));

      // Draw peer links for nodes within range
      ctx.lineWidth = 1;
      for (let i = 0; i < pixelNodes.length; i++) {
        for (let j = i + 1; j < pixelNodes.length; j++) {
          const dx = pixelNodes[i].px - pixelNodes[j].px;
          const dy = pixelNodes[i].py - pixelNodes[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < bleRangePx) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(pixelNodes[i].px, pixelNodes[i].py);
            ctx.lineTo(pixelNodes[j].px, pixelNodes[j].py);
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]); // Reset line dash

      // 3. Highlight the Active Multi-Hop Route Edges
      ctx.lineWidth = 2.5;
      for (let k = 0; k < hopRoute.length - 1; k++) {
        const nA = pixelNodes[hopRoute[k]];
        const nB = pixelNodes[hopRoute[k + 1]];
        if (nA && nB) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Amber route
          ctx.beginPath();
          ctx.moveTo(nA.px, nA.py);
          ctx.lineTo(nB.px, nB.py);
          ctx.stroke();
        }
      }

      // 4. Update and Draw Animated Packet
      const now = Date.now();
      const elapsed = (now - animStateRef.current.startTime) / 1000;
      const hopDuration = 0.55; // seconds per hop
      const totalHopCount = hopRoute.length - 1;
      const currentSegment = Math.min(totalHopCount - 1, Math.floor(elapsed / hopDuration));
      const segmentProgress = Math.min(1, (elapsed % hopDuration) / hopDuration);

      const isFinished = elapsed >= totalHopCount * hopDuration;

      if (!isFinished) {
        const fromNode = pixelNodes[hopRoute[currentSegment]];
        const toNode = pixelNodes[hopRoute[currentSegment + 1]];

        if (fromNode && toNode) {
          const pktX = fromNode.px + (toNode.px - fromNode.px) * segmentProgress;
          const pktY = fromNode.py + (toNode.py - fromNode.py) * segmentProgress;

          // Glowing Packet Particle
          const grad = ctx.createRadialGradient(pktX, pktY, 1, pktX, pktY, 14);
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.3, '#F59E0B');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pktX, pktY, 14, 0, Math.PI * 2);
          ctx.fill();

          // Packet Core
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pktX, pktY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Update HUD hop status
          setHopStatus({
            currentHop: currentSegment + 1,
            totalHops: totalHopCount,
            isDelivered: false,
            latencyMs: Math.round(10 + (currentSegment + 1) * 6.5),
            activeSenderNode: hopRoute[currentSegment],
            activeReceiverNode: hopRoute[currentSegment + 1]
          });
        }
      } else {
        // Delivered!
        setHopStatus((prev) => ({
          ...prev,
          currentHop: totalHopCount,
          isDelivered: true,
          latencyMs: 42
        }));
      }

      // 5. Draw All 30 Nodes
      pixelNodes.forEach((node) => {
        const isCitizenNode = node.type === 'citizen';
        const isGatewayNode = node.type === 'gateway';
        const isOnRoute = hopRoute.includes(node.id);

        // BLE Radio Range Halo
        ctx.strokeStyle = isCitizenNode
          ? 'rgba(239, 68, 68, 0.25)'
          : isGatewayNode
          ? 'rgba(34, 197, 94, 0.25)'
          : isOnRoute
          ? 'rgba(245, 158, 11, 0.15)'
          : 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.px, node.py, bleRangePx * 0.65, 0, Math.PI * 2);
        ctx.stroke();

        // Node Outer Ring
        if (isCitizenNode) {
          ctx.fillStyle = '#DC2626';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 8.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (isGatewayNode) {
          ctx.fillStyle = '#16A34A';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = isOnRoute ? '#F59E0B' : '#0284C7';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.px, node.py, isOnRoute ? 5.5 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Labels for Origin & Gateway
        if (isCitizenNode || isGatewayNode) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 11px JetBrains Mono, monospace';
          ctx.fillText(node.label, node.px - 35, isCitizenNode ? node.py + 22 : node.py - 16);
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
  }, [nodes, hopRoute]);

  return (
    <div
      className={`rounded-2xl emergency-surface border border-[var(--border-strong)] p-4 relative overflow-hidden flex flex-col ${className}`}
    >
      {/* Top Header & MANDATORY PROTOTYPE LABEL */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 light:bg-amber-100 text-amber-400 light:text-amber-700">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Peer-to-Peer BLE Mesh Topology
              </span>
              {/* MANDATORY LABEL AS REQUESTED */}
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 light:text-amber-800 border border-amber-500/40 font-mono text-[11px] font-bold">
                Simulated BLE mesh (prototype)
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Real-time multi-hop delay-tolerant packet propagation without internet/cellular
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerPacketBroadcast}
          className="touch-target px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 light:bg-amber-600 light:hover:bg-amber-500 text-slate-950 light:text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retransmit Packet</span>
        </button>
      </div>

      {/* Live Hop Counter & Telemetry HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-navy-850/60 light:bg-slate-100 border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">HOP COUNTER</span>
          <span className="font-extrabold text-base text-amber-400 light:text-amber-600">
            Hop {hopStatus.currentHop} / {hopStatus.totalHops}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-850/60 light:bg-slate-100 border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">ACTIVE NODES</span>
          <span className="font-extrabold text-base text-[var(--text-primary)]">
            30 Handsets
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-850/60 light:bg-slate-100 border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">RELAY LATENCY</span>
          <span className="font-extrabold text-base text-sky-400 light:text-sky-600">
            ~{hopStatus.latencyMs}ms
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-navy-850/60 light:bg-slate-100 border border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] block">PACKET DELIVERY</span>
          <span className={`font-extrabold text-xs flex items-center gap-1 mt-0.5 ${
            hopStatus.isDelivered ? 'text-emerald-400 light:text-emerald-600' : 'text-amber-400'
          }`}>
            {hopStatus.isDelivered ? (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>DELIVERED TO GATEWAY</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 animate-bounce shrink-0" />
                <span>HOPPING PEERS...</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full h-[320px] sm:h-[400px] rounded-xl bg-navy-950/80 light:bg-slate-900 border border-slate-800/80 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Legend Overlay at bottom */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-slate-800 text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
              <span>Node #0 (Citizen SOS)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>BLE Relay Peer</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
              <span>Gateway #29 (Relief Hub)</span>
            </span>
          </div>
          <span className="text-slate-400">BLE 5.2 Long Range (~50m hops)</span>
        </div>
      </div>
    </div>
  );
};

export default MeshVisualizer;
