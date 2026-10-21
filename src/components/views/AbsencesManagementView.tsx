import React, { useState } from 'react';
import { Calendar, ClipboardCheck, History, Info } from 'lucide-react';
import { RollCallView } from './RollCallView';
import { AbsenceLogView } from './AbsenceLogView';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const AbsencesManagementView: React.FC = () => {
  const { data } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'roll_call' | 'log'>('roll_call');

  const totalAbsences = data.attendanceRecords.filter(
    (r) => r.status === 'absent' || r.status === 'excused'
  ).length;
  const unexcusedCount = data.attendanceRecords.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="compact"
        pageTitle="تدبير الغيابات والنداء اليومي"
        pageSubtitle="مركز الفرصة الثانية - الجيل الجديد (زرارة)"
      />

      {/* Top Header & Sub-Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#76C7B7]/15 flex items-center justify-center text-[#125547]">
              <Calendar className="w-5 h-5 text-[#125547]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                تدبير الغيابات
                <span className="text-xs bg-slate-100 text-black px-2.5 py-0.5 rounded-full font-medium">
                  {totalAbsences} غياب مسجل
                </span>
              </h1>
              <p className="text-xs text-slate-700 mt-0.5">
                تسجيل نداء الحضور للحصص، تعديل الوضعيات واستعراض سجل الغيابات
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveSubTab('roll_call')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'roll_call'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-700 hover:text-black hover:bg-white/50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-[#76C7B7]" />
            <span>تسجيل الحضور (النداء)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'log'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-700 hover:text-black hover:bg-white/50'
            }`}
          >
            <History className="w-4 h-4 text-[#E86826]" />
            <span>سجل واستعراض الغيابات</span>
            {unexcusedCount > 0 && (
              <span className="bg-[#FCEDE5] text-[#923206] text-xs px-2 py-0.5 rounded-full font-mono font-bold">
                {unexcusedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Tab Component */}
      <div>
        {activeSubTab === 'roll_call' ? <RollCallView /> : <AbsenceLogView />}
      </div>
    </div>
  );
};
