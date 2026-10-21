import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings,
  School,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';
import { NavigationTab } from '../../types';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

interface NavItemConfig {
  id: NavigationTab;
  labelAr: string;
  labelFr: string;
  icon: React.ComponentType<{ className?: string }>;
  getCount?: (data: any) => number | undefined;
  badgeColor?: 'mint' | 'orange' | 'lavender' | 'slate';
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    data,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    fileHandleStatus,
  } = useApp();

  // The 6 exact items in the exact required order
  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      labelAr: 'لوحة القيادة',
      labelFr: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      id: 'students',
      labelAr: 'إدارة المتعلمين',
      labelFr: 'Gestion des élèves',
      icon: Users,
      getCount: (d) => d.students.length,
      badgeColor: 'slate',
    },
    {
      id: 'timetable',
      labelAr: 'جدول الحصص الأسبوعي',
      labelFr: 'Emploi du temps',
      icon: Clock,
      getCount: (d) => d.timetableSessions?.length,
      badgeColor: 'mint',
    },
    {
      id: 'daily_roll_call',
      labelAr: 'ورقة النداء اليومية',
      labelFr: 'Feuille d\'appel journalière',
      icon: ClipboardCheck,
      badgeColor: 'lavender',
    },
    {
      id: 'absences',
      labelAr: 'تدبير الغيابات',
      labelFr: 'Gestion des absences',
      icon: Calendar,
      getCount: (d) =>
        d.attendanceRecords.filter(
          (r: any) => r.status === 'absent' || r.status === 'late'
        ).length,
      badgeColor: 'orange',
    },
    {
      id: 'justifications',
      labelAr: 'تدبير المبررات',
      labelFr: 'Gestion des justificatifs',
      icon: FileText,
      getCount: (d) =>
        d.attendanceRecords.filter((r: any) => r.status === 'absent').length,
      badgeColor: 'orange',
    },
    {
      id: 'reports',
      labelAr: 'التقارير',
      labelFr: 'Rapports & Documents',
      icon: BarChart3,
    },
    {
      id: 'settings',
      labelAr: 'الإعدادات',
      labelFr: 'Paramétrage',
      icon: Settings,
    },
  ];

  // Map legacy activeTab values to one of the 6 canonical tabs
  const getCanonicalActiveTab = (tab: NavigationTab): NavigationTab => {
    switch (tab) {
      case 'roll_call':
      case 'absence_log':
        return 'absences';
      case 'classes':
      case 'tracks':
      case 'instructors':
      case 'backup':
        return 'settings';
      case 'documents':
        return 'reports';
      default:
        return tab;
    }
  };

  const canonicalActive = getCanonicalActiveTab(activeTab);

  return (
    <aside
      className={`h-screen sticky top-0 bg-white/95 backdrop-blur-xl border-l border-slate-200 flex flex-col z-20 select-none shadow-sm transition-all duration-300 ease-in-out shrink-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-72 lg:w-80'
      }`}
      style={{
        fontFamily:
          "'HelveticaNeueLT Arabic 55 Roman', 'Helvetica Neue LT Arabic', 'Segoe UI', 'Cairo', sans-serif",
      }}
    >
      {/* Brand Header with CMED Official Logo */}
      <div className="p-3.5 border-b border-slate-100 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700">
            {!isSidebarCollapsed ? 'فضاء الإدارة والتدبير' : 'CMED'}
          </span>
          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            className="p-1.5 rounded-xl text-slate-500 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {!isSidebarCollapsed ? (
          <div>
            <InstitutionalLogoHeader variant="sidebar" showAdminHierarchy={true} />
            {/* Academic Year indicator */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-[11px]">السنة التكوينية:</span>
              <span className="font-mono text-black font-bold tabular-nums bg-[#F4EDFB] text-[#4C2673] px-2 py-0.5 rounded-full text-[11px]">
                {data.settings.academicYear || '2026/2027'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-12 h-12 bg-white rounded-xl p-1 border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden">
              <img
                src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                alt="CMED"
                className="w-full h-auto object-contain"
                style={{ aspectRatio: '440 / 131' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation List - 6 Rubriques in exact order */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = canonicalActive === item.id;
          const count = item.getCount ? item.getCount(data) : undefined;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                title={isSidebarCollapsed ? `${item.labelAr} (${item.labelFr})` : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
                } py-3 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isActive
                    ? 'bg-[#D5BEE8] text-[#3B1E54] shadow-sm font-extrabold ring-1 ring-[#D5BEE8]/80'
                    : 'text-black hover:text-black hover:bg-slate-100/80'
                }`}
              >
                {/* Active indicator line */}
                {isActive && (
                  <span className="absolute right-0 top-2 bottom-2 w-1.5 bg-[#4C2673] rounded-l-full" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      isActive
                        ? 'bg-white text-[#3B1E54] shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {!isSidebarCollapsed && (
                    <div className="text-right truncate">
                      <div className="text-sm font-bold text-black truncate leading-tight">
                        {item.labelAr}
                      </div>
                      <div
                        className={`text-[10px] font-sans truncate ${
                          isActive ? 'text-[#4C2673]' : 'text-slate-500'
                        }`}
                      >
                        {item.labelFr}
                      </div>
                    </div>
                  )}
                </div>

                {/* Counter Badge */}
                {!isSidebarCollapsed && typeof count === 'number' && count > 0 && (
                  <span
                    className={`text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#3B1E54]'
                        : item.badgeColor === 'orange'
                        ? 'bg-[#FCEDE5] text-[#923206]'
                        : 'bg-slate-100 text-black'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>

              {/* Hover Tooltip when sidebar is collapsed */}
              {isSidebarCollapsed && (
                <div className="fixed hidden group-hover:flex items-center right-20 z-50 mr-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none">
                  <span>{item.labelAr}</span>
                  <span className="text-slate-400 font-normal mr-2">
                    — {item.labelFr}
                  </span>
                  {typeof count === 'number' && count > 0 && (
                    <span className="mr-2 bg-[#E86826] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                      {count}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>




    </aside>
  );
};
