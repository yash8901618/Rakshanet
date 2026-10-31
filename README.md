# 🌐 RakshaNet (रक्षानेट)
### AI-Powered Disaster Intelligence & Offline-Resilient Response Network
> **National Emergency Grid Architecture • NDMA / 112 Ready • Zero-Cellular BLE Mesh Relay • 3D Tactical Indoor Digital Twin**

---

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Digital%20Twin-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime%20Sync-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Offline First](https://img.shields.io/badge/PWA-Offline%20First-green?logo=pwa&logoColor=white)](#offline-mesh-architecture)
[![Bilingual](https://img.shields.io/badge/i18n-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%A8%E0%A5%8D%E0%A4%A6%E0%A5%80-orange)](#bilingual-support)

---

## 📌 Executive Overview

In catastrophic disasters (earthquakes, structural collapses, high-rise infernos, cyclonic storms), traditional cellular towers and fiber backhauls are often severed within seconds. **RakshaNet** provides a zero-downtime, life-critical emergency coordination system designed to operate autonomously even when the internet is completely unavailable.

By uniting **peer-to-peer BLE/Wi-Fi Direct mesh relays**, **AI-driven NLP emergency triage**, **interactive 3D indoor tactical twins**, and **hospital telemetry dispatch**, RakshaNet bridges the critical gap between trapped civilians and first responders.

---

## 🏗️ System Architecture Flow

```
                      +---------------------------------------+
                      |         Catastrophic Disaster         |
                      | (Cellular Towers Down / Power Outage) |
                      +---------------------------------------+
                                          |
                      +---------------------------------------+
                      |       Citizen SOS Broadcast           |
                      |  - 1-Tap Offline Distress Beacon     |
                      |  - GPS / Room-level Hazard Tagging   |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      Peer-to-Peer BLE Mesh Relay      |
                      |  Node A -> Node B -> Node C (Multi-Hop)|
                      |  - Dynamic Packet Routing             |
                      |  - Battery-Aware Path Selection       |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      Emergency Gateway Uplink         |
                      |   (LoRa / Satellite / Cellular Edge)  |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |    RakshaNet Gravity Hub (Backend)    |
                      |  - AI Ghost Triage & Deduplication    |
                      |  - Spatial State & Floor Synchronizer |
                      +---------------------------------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                |                                |
         v                                v                                v
+--------------------+          +--------------------+          +--------------------+
| Disaster Authority |          |   First Responder  |          |   Hospital Core    |
| - Macro Heatmap    |          | - 3D Digital Twin  |          | - ER / ICU Beds    |
| - Multi-Agency 112 |          | - Floor Tactical   |          | - Oxygen Reserves  |
| - Resource Allocation         | - Rescued -1 Sync  |          | - Auto-Reroute     |
+--------------------+          +--------------------+          +--------------------+
```

---

## 🎯 Role-Based Operational Personas

RakshaNet adapts dynamically to four high-stakes operational roles:

| Role | Interface Focus | Key Capabilities |
| :--- | :--- | :--- |
| **📱 Citizen** | Mobile-First (360px optimized) | 1-Tap offline SOS, BLE mesh packet visualizer, nearest safe shelter navigation, hazard reporting with audio-haptics. |
| **🛡️ Disaster Authority** | Command Matrix | Citywide incident queue, automated AI incident deduplication, live status overrides, national 112 escalation dispatch. |
| **🚒 First Responder** | Tactical Operations | Interactive 3D indoor digital twin, floor-by-floor structural inspection, floating room casualty pins, live "Rescued -1" decrement workflow. |
| **🏥 Hospital Command** | Medical Telemetry | Live ER & ICU bed availability, oxygen tank pressures, blood reserve units, ambulance triage diversion. |

---

## ⚡ Key Innovations & Modules

### 1. 📡 Zero-Cellular Mesh Network Simulator
- **Interactive Mesh Canvas**: Simulates 30+ peer mobile devices communicating over BLE/Wi-Fi Direct.
- **Dynamic Packet Routing**: Packets hop autonomously from peer to peer to reach designated gateway nodes connected to edge satellites or the central command hub.
- **Node Self-Healing**: Click any active node to simulate failure or destruction—the network instantly recalculates alternate routing paths in real time.
- **Live Network Telemetry**: Visualizes hop counts, battery percentages, delivery reliability, and routing latency.

### 2. 🏢 3D Tactical Indoor Digital Twin
- **WebGL / Three.js Rendering**: Accurate multi-story venue modeling with cutaway floor inspection.
- **Floating Spatial Pins**: Room-level tags (e.g., `Floor 3 (Rm 304)`) indicating casualty counts, trapped individuals, and hazardous thermal hotspots.
- **Cross-Role State Parity**: Rescuing a trapped person on the Responder screen automatically decrements trapped counts across Authority, Citizen, and Hospital screens synchronously via WebSockets.

### 3. 🧠 AI Ghost Triage & Deduplication
- **Intelligent Report Merging**: Analyzes incoming natural-language distress signals using geo-temporal proximity and semantic text similarity.
- **Redundancy Reduction**: Merges duplicate reports describing the same physical emergency into a single unified incident card with confidence scoring.
- **Automated Dispatch Generation**: Synthesizes specific dispatch instructions for Fire, Tactical, and Medical units automatically.

### 4. 🌐 Bilingual & Accessibility Ready
- **Full Hindi & English Localization**: Real-time language switching (`en` / `hi`) across all dashboards and alerts.
- **Emergency Audio-Haptics**: Synthesized siren audio alerts and device vibration pulses mapped to emergency severity levels (1 to 5).
- **High-Contrast Dark / Light Themes**: Mission-critical UI designed for outdoor visibility under direct sunlight or dark emergency bunkers.

---

## 🚀 Quickstart & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### 1. Clone the Repository
```bash
git clone https://github.com/yash8901618/Rakshanet.git
cd Rakshanet
```

### 2. Start the Gravity Hub (Backend Server)
```bash
cd server
npm install
npm run dev
# Server will start on http://localhost:3001
```

### 3. Start the RakshaNet Frontend Client
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend will start on http://localhost:5173
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🎮 Interactive Demo Walkthrough

Once the application is running, follow these steps to experience the complete emergency workflow:

1. **Fire the Live Emergency Drill**:
   - On the **Overview / Home** screen, click **"Run Live Simulation"**.
   - Watch the Level 5 structural collapse scenario dispatch alerts across all operational roles with synthesized audio-haptics.
2. **Inspect the 3D Tactical Digital Twin**:
   - Switch to the **First Responder** role from the top role switcher.
   - Click the **3D Tactical Twin** tab. Observe Floor 3 highlighted in red with the floating `2 TRAPPED` room pin on Room 304.
   - Click **"Mark 1 Rescued"**—watch the casualty counter decrement across both the 3D twin and Authority screens.
3. **Explore the Mesh Network**:
   - Navigate to the **Mesh Network** tab in the sidebar.
   - Click **"Send Test SOS"** to watch the packet hop across BLE range circles until reaching an internet gateway.
   - Click any intermediate node to toggle it offline, then send another SOS to witness real-time path rerouting!
4. **Test the Citizen Mobile SOS**:
   - Switch to the **Citizen** role and test the high-visibility SOS broadcast button and safe shelter locator.

---

## 📁 Repository Structure

```
Rakshanet/
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── public/                 # PWA Manifest, Icons, and Service Worker
│   └── src/
│       ├── components/
│       │   ├── 3D/             # Three.js / R3F Indoor Building Twin & Casualty Pins
│       │   ├── Dashboard/      # Floor Tactical Panel, Incident Feed, Force Override
│       │   ├── Mesh/           # BLE Mesh Network Simulator & Visualizer
│       │   ├── shell/          # TopStatusBar, Brand Logo, Role Switcher
│       │   ├── ui/             # StatCards, Toast System, Modals, Severity Badges
│       │   └── views/          # Citizen, Authority, Responder, Hospital, HomeScreen
│       ├── context/            # ThemeContext & ToastContext Providers
│       ├── i18n/               # Localization Dictionaries (English & Hindi)
│       ├── services/           # Audio/Haptics, Incident Deduplication, Socket Client
│       └── store/              # Zustand Unified Crisis State Engine
├── server/                     # Backend Gravity Hub (Express + Socket.io)
│   ├── aiTriage.js             # NLP Emergency Entity Extraction & Dispatch Synthesizer
│   ├── server.js               # Express Server & Socket.io Event Hub
│   └── store.js                # In-Memory Spatial State & Hospital Telemetry Store
├── .gitignore                  # Git Ignore configuration
└── README.md                   # Project Documentation
```

---

## 🔒 Security & Privacy

- **Zero Data Harvesting**: Citizen SOS transmissions prioritize anonymity during distress events.
- **Offline Integrity**: Data queued in offline storage (IndexedDB) is cryptographically serialized before mesh propagation.
- **Role-Based Isolation**: Access controls separate public civilian telemetry from tactical first-responder frequencies.

---

## 🤝 Contributing

Contributions to enhance disaster resilience, integrate additional sensor telemetry, or optimize mesh routing algorithms are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ for resilient disaster management and national life-safety response.</sub>
</div>
