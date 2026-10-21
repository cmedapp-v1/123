import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  CheckCircle,
  FileSpreadsheet,
  Users,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseDDMMYYYY, getTodayDDMMYYYY } from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const ReportsView: React.FC = () => {
  const { data } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const classMap = useMemo(() => new Map(data.classes.map((c) => [c.id, c])), [data.classes]);

  // Aggregate stats per student
  const studentReports = useMemo(() => {
    const validRecords = data.attendanceRecords.filter((r) => {
      if (startDate.trim()) {
        const dRec = parseDDMMYYYY(r.date);
        const dStart = parseDDMMYYYY(startDate.trim());
        if (dRec && dStart && dRec < dStart) return false;
      }
      if (endDate.trim()) {
        const dRec = parseDDMMYYYY(r.date);
        const dEnd = parseDDMMYYYY(endDate.trim());
        if (dRec && dEnd && dRec > dEnd) return false;
      }
      return true;
    });

    return data.students
      .filter((s) => {
        if (selectedClassId !== 'all' && s.classId !== selectedClassId) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = `${s.lastName} ${s.firstName}`.toLowerCase().includes(q);
          const matchMassar = s.massarNumber.toLowerCase().includes(q);
          if (!matchName && !matchMassar) return false;
        }
        return true;
      })
      .map((student) => {
        const studentRecords = validRecords.filter((r) => r.studentId === student.id);
        const present = studentRecords.filter((r) => r.status === 'present').length;
        const absentUnexcused = studentRecords.filter((r) => r.status === 'absent').length;
        const absentExcused = studentRecords.filter((r) => r.status === 'excused').length;
        const late = studentRecords.filter((r) => r.status === 'late').length;
        const totalSessions = present + absentUnexcused + absentExcused + late;
        const rate =
          totalSessions > 0
            ? Math.round(((present + late) / totalSessions) * 100)
            : 100;

        const cls = classMap.get(student.classId);

        return {
          student,
          className: cls ? cls.name : 'غير محدد',
          classCode: cls ? cls.code : '—',
          present,
          absentUnexcused,
          absentExcused,
          late,
          totalSessions,
          rate,
        };
      })
      .sort((a, b) => a.rate - b.rate); // Students with lowest attendance first for easy tracking
  }, [data.students, data.attendanceRecords, selectedClassId, searchQuery, startDate, endDate, classMap]);

  // Overall Global Summary
  const overall = useMemo(() => {
    let totalSessions = 0;
    let present = 0;
    let unexcused = 0;
    let excused = 0;
    let late = 0;

    studentReports.forEach((sr) => {
      totalSessions += sr.totalSessions;
      present += sr.present;
      unexcused += sr.absentUnexcused;
      excused += sr.absentExcused;
      late += sr.late;
    });

    const averageRate =
      totalSessions > 0
        ? Math.round(((present + late) / totalSessions) * 100)
        : 100;

    return { totalSessions, present, unexcused, excused, late, averageRate };
  }, [studentReports]);

  // CSV Export with UTF-8 BOM
  const handleExportReportCSV = () => {
    const headers = [
      'الرقم الترتيبي',
      'رقم مسار',
      'النسب',
      'الاسم',
      'القسم',
      'إجمالي الحصص',
      'حاضر',
      'غير مبرر',
      'مبرر',
      'تأخر',
      'نسبة المواظبة (%)',
    ];

    const rows = studentReports.map((sr, idx) => [
      idx + 1,
      `"${sr.student.massarNumber}"`,
      `"${sr.student.lastName}"`,
      `"${sr.student.firstName}"`,
      `"${sr.className}"`,
      sr.totalSessions,
      sr.present,
      sr.absentUnexcused,
      sr.absentExcused,
      sr.late,
      `${sr.rate}%`,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.join(';')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_المواظبة_والغياب_${getTodayDDMMYYYY().replace(/\//g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Top Filter & Actions Bar (no-print) */}
      <div className="canva-panel p-5 no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو مسار..."
              className="canva-input pr-9 pl-3 py-2 text-xs text-black w-56 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="canva-input px-3.5 py-2 text-xs font-bold text-black"
          >
            <option value="all">جميع الأقسام</option>
            {data.classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-black font-medium">
            <span>من:</span>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="canva-input px-2.5 py-1.5 text-xs w-28 font-mono text-black"
            />
            <span>إلى:</span>
            <input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="JJ/MM/AAAA"
              className="canva-input px-2.5 py-1.5 text-xs w-28 font-mono text-black"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReportCSV}
            disabled={studentReports.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            title="تصدير جدول التقرير إلى Excel/CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={studentReports.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-40 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (A4)</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip (no-print) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="canva-card p-4 text-center">
          <span className="text-xs text-slate-500 font-bold block">المستفيدون</span>
          <span className="text-2xl font-bold font-mono text-black tabular-nums mt-1">
            {studentReports.length}
          </span>
        </div>

        <div className="canva-card p-4 text-center">
          <span className="text-xs text-slate-500 font-bold block">مجموع الحصص</span>
          <span className="text-2xl font-bold font-mono text-black tabular-nums mt-1">
            {overall.totalSessions}
          </span>
        </div>

        <div className="canva-card p-4 text-center bg-[#E7F7F4]/60 border-[#76C7B7]/40">
          <span className="text-xs text-[#125547] font-bold block">حصص الحضور</span>
          <span className="text-2xl font-bold font-mono text-[#125547] tabular-nums mt-1">
            {overall.present}
          </span>
        </div>

        <div className="canva-card p-4 text-center bg-[#FCEDE5]/60 border-[#E86826]/40">
          <span className="text-xs text-[#923206] font-bold block">غياب غير مبرر</span>
          <span className="text-2xl font-bold font-mono text-[#923206] tabular-nums mt-1">
            {overall.unexcused}
          </span>
        </div>

        <div className="canva-card p-4 text-center bg-[#F4EDFB]/60 border-[#D5BEE8]/40">
          <span className="text-xs text-[#4C2673] font-bold block">غياب مبرر</span>
          <span className="text-2xl font-bold font-mono text-[#4C2673] tabular-nums mt-1">
            {overall.excused}
          </span>
        </div>

        <div className="canva-card p-4 text-center">
          <span className="text-xs text-slate-600 font-bold block">معدل المواظبة</span>
          <span className="text-2xl font-bold font-mono text-black tabular-nums mt-1">
            {overall.averageRate}%
          </span>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div className="canva-panel p-6 print:p-0 print:border-none print:shadow-none bg-white text-black">
        {/* Moroccan Official Report Header for Print with CMED Logo */}
        <div className="hidden print:block mb-4 text-center">
          <InstitutionalLogoHeader variant="print" />
          <h2 className="text-base font-extrabold mt-3 border border-black inline-block px-6 py-1">
            تقرير المواظبة والغياب الإجمالي
          </h2>
        </div>

        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 print:border-black text-xs font-bold">
          <h3 className="text-sm font-bold text-black">
            تفصيل الغيابات والمواظبة حسب المستفيد
          </h3>
          <span className="font-mono text-slate-600 print:text-black text-xs">
            السنة التكوينية: {data.settings.academicYear}
          </span>
        </div>

        {studentReports.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 font-bold">
            لا توجد بيانات مواظبة مطابقة لمعايير البحث.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-right text-xs print:text-[10px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-black font-bold">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5">رقم مسار</th>
                  <th className="py-3 px-3.5">النسب والاسم</th>
                  <th className="py-3 px-3.5">القسم</th>
                  <th className="py-3 px-3.5 text-center">الحصص</th>
                  <th className="py-3 px-3.5 text-center text-[#125547]">حاضر</th>
                  <th className="py-3 px-3.5 text-center text-[#923206]">غير مبرر</th>
                  <th className="py-3 px-3.5 text-center text-[#4C2673]">مبرر</th>
                  <th className="py-3 px-3.5 text-center text-amber-800">تأخر</th>
                  <th className="py-3 px-3.5 text-center">نسبة المواظبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentReports.map((sr, idx) => (
                  <tr
                    key={sr.student.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono text-slate-600 text-center tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-black">
                      {sr.student.massarNumber}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-black text-sm">
                      {sr.student.lastName} {sr.student.firstName}
                    </td>
                    <td className="py-3 px-3.5 text-black font-medium">
                      {sr.className}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-center text-black tabular-nums font-bold">
                      {sr.totalSessions}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-center text-[#125547] tabular-nums font-bold">
                      {sr.present}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-center text-[#923206] tabular-nums font-bold">
                      {sr.absentUnexcused}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-center text-[#4C2673] tabular-nums font-bold">
                      {sr.absentExcused}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-center text-amber-800 tabular-nums font-bold">
                      {sr.late}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                          sr.rate >= 80
                            ? 'bg-[#E7F7F4] text-[#125547]'
                            : sr.rate >= 60
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-[#FCEDE5] text-[#923206]'
                        }`}
                      >
                        {sr.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Signatures */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-16 text-center text-xs">
          <div>
            <p className="font-bold underline mb-16">إعداد الحراسة العامة / التأطير</p>
          </div>
          <div>
            <p className="font-bold underline mb-16">تأشيرة وخاتم إدارة المركز</p>
          </div>
        </div>
      </div>
    </div>
  );
};
