import React, { useState } from 'react';
import { BarChart3, Printer, FileSpreadsheet, FileText } from 'lucide-react';
import { ReportsView } from './ReportsView';
import { DocumentsPrintView } from './DocumentsPrintView';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const ReportsCombinedView: React.FC = () => {
  const { printConfig } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'documents'>(
    printConfig.type ? 'documents' : 'reports'
  );

  return (
    <div className="space-y-6">
      {/* Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="compact"
        pageTitle="التقارير الإحصائية والمطبوعات الإدارية"
        pageSubtitle="مركز الفرصة الثانية - الجيل الجديد (زرارة)"
      />

      {/* Top Header & Sub-Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#D5BEE8]/30 flex items-center justify-center text-[#4C2673]">
              <BarChart3 className="w-5 h-5 text-[#4C2673]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black flex items-center gap-2">
                التقارير والوثائق
              </h1>
              <p className="text-xs text-slate-700 mt-0.5">
                توليد التقارير الإحصائية، تصدير ملفات Excel وPDF، وطباعة المطبوعات الرسمية
              </p>
            </div>
          </div>
        </div>

        {/* Sub Tabs Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-700 hover:text-black hover:bg-white/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#125547]" />
            <span>التقارير الإحصائية والتصدير</span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'documents'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-700 hover:text-black hover:bg-white/50'
            }`}
          >
            <Printer className="w-4 h-4 text-[#4C2673]" />
            <span>المطبوعات والوثائق الرسمية A4</span>
          </button>
        </div>
      </div>

      {/* Active Sub-Tab View */}
      <div>
        {activeSubTab === 'reports' ? <ReportsView /> : <DocumentsPrintView />}
      </div>
    </div>
  );
};
