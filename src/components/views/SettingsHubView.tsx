import React from 'react';
import {
  Settings,
  Layers,
  School,
  GraduationCap,
  Sliders,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { TracksView } from './TracksView';
import { ClassesView } from './ClassesView';
import { InstructorsView } from './InstructorsView';
import { SettingsView } from './SettingsView';
import { BackupView } from './BackupView';
import { useApp } from '../../context/AppContext';

export const SettingsHubView: React.FC = () => {
  const { activeSettingsTab, setActiveSettingsTab } = useApp();

  const subTabs = [
    { id: 'tracks', label: 'الشعب التكوينية', icon: Layers },
    { id: 'classes', label: 'الأقسام البيداغوجية', icon: School },
    { id: 'instructors', label: 'هيئة التأطير والتكوين', icon: GraduationCap },
    { id: 'general', label: 'الإعدادات العامة للمركز', icon: Sliders },
    { id: 'backup', label: 'النسخ الاحتياطي والأمان', icon: HardDrive },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-black">
              <Settings className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                الإعدادات والتهيئة
                <span className="text-xs bg-[#D5BEE8]/40 text-[#3B1E54] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  صلاحيات الإدارة الكاملة
                </span>
              </h1>
              <p className="text-xs text-slate-700 mt-0.5">
                تدبير الشعب، الأقسام، هيئة التأطير، إعدادات المؤسسة والنسخ الاحتياطي
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs Switcher */}
        <div className="flex items-center flex-wrap bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200 gap-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-slate-700 hover:text-black hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#76C7B7]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab View */}
      <div>
        {activeSettingsTab === 'tracks' && <TracksView />}
        {activeSettingsTab === 'classes' && <ClassesView />}
        {activeSettingsTab === 'instructors' && <InstructorsView />}
        {activeSettingsTab === 'general' && <SettingsView />}
        {activeSettingsTab === 'backup' && <BackupView />}
      </div>
    </div>
  );
};
