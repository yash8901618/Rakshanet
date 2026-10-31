import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import ToastContainer from './components/ui/Toast';
import TopStatusBar from './components/shell/TopStatusBar';
import Sidebar from './components/ui/Sidebar';
import BottomNav from './components/ui/BottomNav';

// Views
import HomeScreen from './components/views/HomeScreen';
import CitizenView from './components/views/CitizenView';
import AuthorityView from './components/views/AuthorityView';
import ResponderView from './components/views/ResponderView';
import HospitalView from './components/views/HospitalView';

// Existing Tactical Components for Direct Tab Navigation
import Building3DTwin from './components/3D/Building3DTwin';
import FloorTacticalPanel from './components/Dashboard/FloorTacticalPanel';
import HospitalTelemetry from './components/Dashboard/HospitalTelemetry';
import IncidentFeed from './components/Dashboard/IncidentFeed';
import OfflineMeshSimulator from './components/Mesh/OfflineMeshSimulator';
import MeshVisualizer from './components/Mesh/MeshVisualizer';
import MeshNetwork from './components/Mesh/MeshNetwork';
import ReportModal from './components/ReportModal';
import ForceOverrideModal from './components/Dashboard/ForceOverrideModal';

import { useCrisisStore } from './store/crisisStore';

const AppContent = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const {
    initStore,
    activeRole,
    setActiveRole,
    activeTab,
    setActiveTab,
    setIsReportModalOpen,
    runLiveDemoScenario,
    triggerCrisisEvent
  } = useCrisisStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  const handleRunDemo = () => {
    runLiveDemoScenario();
    addToast({
      title: t('demo.toastTitle'),
      message: t('demo.toastDesc'),
      type: 'critical',
      duration: 8000
    });
  };

  const handleTriggerSos = () => {
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }
    triggerCrisisEvent({
      incidentId: `SOS-${Date.now()}`,
      severity: 5,
      floorNumber: 3,
      roomNumber: '304',
      hazard: 'PRIORITY EMERGENCY SOS: Critical assistance requested by civilian beacon.',
      hazardType: 'FIRE',
      trapped: 2,
      forcePriority: true,
      timestamp: Date.now()
    });
    addToast({
      title: '🚨 EMERGENCY SOS DISPATCHED',
      message: 'Distress signal relayed across BLE Mesh and NDMA 112 Command Network.',
      type: 'critical',
      duration: 6000
    });
  };

  // Render view content based on activeRole and activeTab
  const renderMainContent = () => {
    // If user explicitly clicks 'overview' tab or activeRole is 'home', show Landing Overview
    if (activeRole === 'home' || activeTab === 'overview') {
      return (
        <HomeScreen
          onSelectRole={(role) => {
            setActiveRole(role);
            setActiveTab('home');
          }}
          onRunDemo={handleRunDemo}
        />
      );
    }

    // If user clicked Mesh Network item
    if (activeTab === 'mesh') {
      return <MeshNetwork />;
    }

    // Role-specific main dashboards
    if (activeRole === 'citizen') {
      return <CitizenView onOpenReport={() => setIsReportModalOpen(true)} />;
    }

    if (activeRole === 'hospital') {
      if (activeTab === 'twin') {
        return <Building3DTwin />;
      }
      if (activeTab === 'incidents') {
        return <IncidentFeed />;
      }
      return <HospitalView />;
    }

    if (activeRole === 'responder') {
      if (activeTab === 'mesh') {
        return <MeshNetwork />;
      }
      if (activeTab === 'twin') {
        return <Building3DTwin />;
      }
      if (activeTab === 'hospital') {
        return <HospitalTelemetry />;
      }
      if (activeTab === 'incidents') {
        return <IncidentFeed />;
      }
      return <ResponderView />;
    }

    if (activeRole === 'authority') {
      if (activeTab === 'mesh') {
        return <MeshNetwork />;
      }
      if (activeTab === 'twin') {
        return <Building3DTwin />;
      }
      if (activeTab === 'tactical') {
        return <FloorTacticalPanel />;
      }
      if (activeTab === 'hospital') {
        return <HospitalTelemetry />;
      }
      if (activeTab === 'incidents') {
        return <IncidentFeed />;
      }
      return <AuthorityView onOpenReport={() => setIsReportModalOpen(true)} />;
    }

    return (
      <HomeScreen
        onSelectRole={(role) => {
          setActiveRole(role);
          setActiveTab('home');
        }}
        onRunDemo={handleRunDemo}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* Top Status Bar with high contrast and touch ergonomics */}
      <TopStatusBar
        activeRole={activeRole}
        onSelectRole={(role) => {
          setActiveRole(role);
          setActiveTab('home');
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
        onTriggerSos={handleTriggerSos}
      />

      {/* Main Workspace with Desktop Sidebar & Mobile BottomNav */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (1440px dashboard layout) */}
        <Sidebar
          activeRole={activeRole}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenReport={() => setIsReportModalOpen(true)}
          onRunDemo={handleRunDemo}
        />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Offline Mesh Network Banner */}
            <OfflineMeshSimulator />

            {/* Dynamic Role View */}
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (360px touch ergonomics) */}
      <BottomNav
        activeRole={activeRole}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* Stackable Alert Toasts */}
      <ToastContainer />

      {/* Emergency Modals */}
      <ReportModal />
      <ForceOverrideModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
