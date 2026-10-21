import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AuthModal } from './components/auth/AuthModal';

import { DashboardView } from './components/views/DashboardView';
import { StudentsView } from './components/views/StudentsView';
import { TimetableManagementView } from './components/views/TimetableManagementView';
import { DailyRollCallView } from './components/views/DailyRollCallView';
import { AbsencesManagementView } from './components/views/AbsencesManagementView';
import { JustificationsView } from './components/views/JustificationsView';
import { ReportsCombinedView } from './components/views/ReportsCombinedView';
import { SettingsHubView } from './components/views/SettingsHubView';

const MainLayout: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentsView />;
      case 'timetable':
        return <TimetableManagementView />;
      case 'daily_roll_call':
        return <DailyRollCallView />;
      case 'absences':
      case 'roll_call':
      case 'absence_log':
        return <AbsencesManagementView />;
      case 'justifications':
        return <JustificationsView />;
      case 'reports':
      case 'documents':
        return <ReportsCombinedView />;
      case 'settings':
      case 'classes':
      case 'tracks':
      case 'instructors':
      case 'backup':
        return <SettingsHubView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F7F8FA] text-black flex relative overflow-x-hidden"
      dir="rtl"
      style={{
        fontFamily:
          "'HelveticaNeueLT Arabic 55 Roman', 'Helvetica Neue LT Arabic', 'Segoe UI', 'Cairo', sans-serif",
      }}
    >
      {/* Background subtle pastel decorative glows */}
      <div className="fixed top-[-5%] right-[-5%] w-[450px] h-[450px] bg-[#D5BEE8]/35 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-[-5%] left-[-5%] w-[450px] h-[450px] bg-[#76C7B7]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Auth Screen / Setup Wizard */}
      {!isAuthenticated && <AuthModal />}

      {/* Right Sidebar (RTL Navigation placed on the right side) */}
      <Sidebar />

      {/* Main Workspace (placed to the left of the right-side sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
