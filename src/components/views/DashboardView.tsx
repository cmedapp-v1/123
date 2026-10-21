import React, { useState, useMemo } from 'react';
import {
  Users,
  UserX,
  UserCheck,
  Clock,
  CheckCircle,
  AlertOctagon,
  Calendar,
  Filter,
  Printer,
  ChevronLeft,
  ArrowUpRight,
  Bell,
  Sparkles,
  School,
  FileCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { parseDDMMYYYY, getTodayDDMMYYYY, formatDateToDDMMYYYY } from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const DashboardView: React.FC = () => {
  const { data, setActiveTab, triggerPrintDocument } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last7' | 'last30'>('all');

  const todayStr = getTodayDDMMYYYY();
  const todayDate = parseDDMMYYYY(todayStr) || new Date();

  // Filtered records
  const filteredRecords = useMemo(() => {
    return data.attendanceRecords.filter((rec) => {
      if (selectedClassId !== 'all' && rec.classId !== selectedClassId) {
        return false;
      }
      if (dateFilter === 'today') {
        return rec.date === todayStr;
      }
      if (dateFilter === 'last7' || dateFilter === 'last30') {
        const d = parseDDMMYYYY(rec.date);
        if (!d) return false;
        const diffDays = Math.floor((todayDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (dateFilter === 'last7' && (diffDays < 0 || diffDays > 7)) return false;
        if (dateFilter === 'last30' && (diffDays < 0 || diffDays > 30)) return false;
      }
      return true;
    });
  }, [data.attendanceRecords, selectedClassId, dateFilter, todayStr, todayDate]);

  // Statistics
  const totalBeneficiaries = useMemo(() => {
    if (selectedClassId === 'all') return data.students.length;
    return data.students.filter((s) => s.classId === selectedClassId).length;
  }, [data.students, selectedClassId]);

  const stats = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absentUnexcused = filteredRecords.filter((r) => r.status === 'absent').length;
    const absentExcused = filteredRecords.filter((r) => r.status === 'excused').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const totalSessions = present + absentUnexcused + absentExcused + late;
    const attendanceRate = totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100) : 100;

    return {
      present,
      absentUnexcused,
      absentExcused,
      late,
      totalSessions,
      attendanceRate,
    };
  }, [filteredRecords]);

  // Absences by Class
  const classAbsencesData = useMemo(() => {
    return data.classes.map((c) => {
      const recordsForClass = data.attendanceRecords.filter((r) => r.classId === c.id);
      const unexcused = recordsForClass.filter((r) => r.status === 'absent').length;
      const excused = recordsForClass.filter((r) => r.status === 'excused').length;
      const late = recordsForClass.filter((r) => r.status === 'late').length;
      return {
        id: c.id,
        name: c.name,
        code: c.code,
        unexcused,
        excused,
        late,
        totalAbsence: unexcused + excused,
      };
    });
  }, [data.classes, data.attendanceRecords]);

  // Absences in the last 14 days
  const last14DaysData = useMemo(() => {
    const days: { dateStr: string; label: string; unexcused: number; excused: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const str = formatDateToDDMMYYYY(d);
      const parts = str.split('/');
      const shortLabel = `${parts[0]}/${parts[1]}`;

      const recs = data.attendanceRecords.filter((r) => r.date === str);
      const unexcused = recs.filter((r) => r.status === 'absent').length;
      const excused = recs.filter((r) => r.status === 'excused').length;
      days.push({
        dateStr: str,
        label: shortLabel,
        unexcused,
        excused,
      });
    }
    return days;
  }, [data.attendanceRecords, todayDate]);

  // Alert list for beneficiaries exceeding threshold
  const alertStudents = useMemo(() => {
    const threshold = data.settings.absenceAlertThreshold || 3;
    const countMap = new Map<string, number>();

    data.attendanceRecords.forEach((r) => {
      if (r.status === 'absent') {
        countMap.set(r.studentId, (countMap.get(r.studentId) || 0) + 1);
      }
    });

    const list: { student: any; unexcusedCount: number; className: string }[] = [];
    countMap.forEach((count, studentId) => {
      if (count >= threshold) {
        const student = data.students.find((s) => s.id === studentId);
        if (student) {
          const cls = data.classes.find((c) => c.id === student.classId);
          list.push({
            student,
            unexcusedCount: count,
            className: cls ? cls.name : 'غير محدد',
          });
        }
      }
    });

    return list.sort((a, b) => b.unexcusedCount - a.unexcusedCount);
  }, [data.attendanceRecords, data.students, data.classes, data.settings.absenceAlertThreshold]);

  const maxAbsence14 = Math.max(...last14DaysData.map((d) => d.unexcused + d.excused), 1);
  const maxClassAbsence = Math.max(...classAbsencesData.map((c) => c.totalAbsence), 1);

  return (
    <div className="space-y-6 select-none">
      {/* 0. Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="banner"
        pageTitle="لوحة القيادة والمؤشرات العامة"
        pageSubtitle="منظومة تدبير الغياب والتتبع التربوي - مركز الفرصة الثانية الجيل الجديد زرارة"
      />

      {/* 1. Hero Welcoming Banner - Styled directly after the Canva Model Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#D5BEE8] text-[#3B1E54] rounded-[28px] p-7 md:p-9 shadow-sm flex flex-col justify-between relative overflow-hidden">
          {/* Decorative soft circles */}
          <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-white/20 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/60 text-[#3B1E54] rounded-full text-xs font-bold mb-4 backdrop-blur-sm">
              <School className="w-3.5 h-3.5" />
              <span>{data.settings.centerName}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-snug">
              مرحباً بكم في منصة تدبير الغياب والمواظبة التربوية
            </h2>
            <p className="text-sm md:text-base text-[#4C2673] font-medium mt-2 leading-relaxed max-w-xl">
              منظومة إدارية متكاملة لضبط حضور المستفيدين، تبرير الغيابات، وتوليد الوثائق الرسمية والمطبوعات للمركز بكل دقة ومرونة.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('absences')}
              className="flex items-center gap-2.5 px-6 py-3 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] font-bold text-sm rounded-full shadow-md shadow-[#76C7B7]/30 transition-all cursor-pointer"
            >
              <span>تسجيل نداء الحصة الآن</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className="px-5 py-3 bg-white/80 hover:bg-white text-[#3B1E54] font-bold text-sm rounded-full transition-all cursor-pointer"
            >
              لائحة المستفيدين ({data.students.length})
            </button>
          </div>
        </div>

        {/* Orange Accent Hero Card */}
        <div className="bg-[#E86826] text-white rounded-[28px] p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block">
              السنة التكوينية المعتمدة
            </span>
            <h3 className="text-2xl font-black mt-1 font-mono tabular-nums">
              {data.settings.academicYear}
            </h3>
            <p className="text-xs text-white/90 mt-2 leading-relaxed">
              وفق القانون الداخلي للمركز: كل قسم يضم شعبتين بالتساوي، مع تتبع دقيق للمواظبة لحماية حق المستفيدين في التكوين.
            </p>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
            <span>عتبة التنبيه الحالية:</span>
            <span className="bg-white text-[#E86826] font-bold px-3 py-1 rounded-full font-mono">
              ≥ {data.settings.absenceAlertThreshold} غيابات
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Filter Controls Strip */}
      <div className="canva-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
            <Filter className="w-4 h-4 text-[#76C7B7]" />
            <span>تصفية الإحصائيات:</span>
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="canva-input px-3.5 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">جميع الأقسام ({data.classes.length})</option>
            {data.classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              كامل السنة
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setDateFilter('last7')}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors cursor-pointer ${
                dateFilter === 'last7'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setDateFilter('last30')}
              className={`px-3 py-1 text-xs rounded-full font-bold transition-colors cursor-pointer ${
                dateFilter === 'last30'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              آخر 30 يوماً
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span>المستفيدون المشمولون بالتصفية:</span>
          <span className="font-mono text-slate-900 font-bold bg-[#E7F7F4] text-[#125547] px-2.5 py-0.5 rounded-full">
            {totalBeneficiaries}
          </span>
        </div>
      </div>

      {/* 3. Three Themed Cards - Directly Matching "Annonces" in Canva Model */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            مؤشرات المواظبة الأساسية
          </h3>
          <span className="text-xs text-slate-500">رصد فوري لنتائج النداء والمعالجة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Warm Orange (Unexcused Absences) */}
          <div className="bg-[#E86826] text-white rounded-[26px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-white/80 block">الغيابات غير المبررة</span>
                <h4 className="text-xl font-black mt-1">تنبيهات الغياب</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-white text-[#E86826] flex items-center justify-center shadow-md shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
            </div>

            <div className="my-6">
              <span className="text-4xl font-black font-mono tabular-nums">
                {stats.absentUnexcused}
              </span>
              <span className="text-xs text-white/90 mr-2">حصة غياب غير مبررة</span>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
              <span>تتطلب استدعاء فوري لولي الأمر</span>
              <button
                onClick={() => setActiveTab('justifications')}
                className="font-bold underline underline-offset-4 hover:text-white/80 cursor-pointer"
              >
                معالجة المبررات ←
              </button>
            </div>
          </div>

          {/* Card 2: Lavender (Attendance & Beneficiaries) */}
          <div className="bg-[#D5BEE8] text-[#3B1E54] rounded-[26px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#4C2673] block">المواظبة العامة</span>
                <h4 className="text-xl font-black mt-1">حضور المستفيدين</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-white text-[#3B1E54] flex items-center justify-center shadow-md shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="my-6">
              <span className="text-4xl font-black font-mono tabular-nums">
                {stats.attendanceRate}%
              </span>
              <span className="text-xs text-[#4C2673] mr-2">معدل الحضور المسجل ({stats.present} حصة)</span>
            </div>

            <div className="pt-4 border-t border-[#3B1E54]/20 flex items-center justify-between text-xs font-bold">
              <span>إجمالي المستفيدين: {totalBeneficiaries}</span>
              <button
                onClick={() => setActiveTab('absences')}
                className="underline underline-offset-4 hover:text-black cursor-pointer"
              >
                تسجيل النداء ←
              </button>
            </div>
          </div>

          {/* Card 3: Mint Green (Excused Absences & Late) */}
          <div className="bg-[#76C7B7] text-[#125547] rounded-[26px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#1b6a5a] block">الوضعيات المعالجة</span>
                <h4 className="text-xl font-black mt-1">غياب مبرر وتأخرات</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-white text-[#125547] flex items-center justify-center shadow-md shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="my-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black font-mono tabular-nums">
                  {stats.absentExcused}
                </span>
                <span className="text-xs font-semibold">مبرر</span>
                <span className="text-2xl font-bold font-mono text-[#1b6a5a]">/ {stats.late}</span>
                <span className="text-xs font-semibold">تأخر</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#125547]/20 flex items-center justify-between text-xs font-bold">
              <span>شواهد طبية وتبريرات</span>
              <button
                onClick={() => setActiveTab('justifications')}
                className="underline underline-offset-4 hover:text-[#0b332b] cursor-pointer"
              >
                تدبير المبررات ←
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Calendrier des cours (Schedule Timetable Widget) - Exactly matching Canva Model */}
      <div className="bg-[#E7F7F4] border border-[#76C7B7]/40 rounded-[28px] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-[#76C7B7]/30 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 border border-[#76C7B7]/40 shadow-xs max-w-[140px] flex items-center justify-center shrink-0">
              <img
                src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                alt="CMED"
                className="w-full h-auto max-h-9 object-contain"
                style={{ aspectRatio: '440 / 131' }}
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#125547]">
                جدول الحصص والتوقيت الأسبوعي (Calendrier des cours)
              </h3>
              <p className="text-xs text-[#1b6a5a]">
                الفرصة الثانية - الجيل الجديد (زرارة) • {data.settings.delegation} • {data.settings.academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#125547] border border-[#76C7B7]/60 rounded-full text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة البرنامج الأسبوعي</span>
            </button>

            <button
              onClick={() => setActiveTab('absences')}
              className="px-4 py-2 bg-[#76C7B7] hover:bg-[#5db4a3] text-white rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              تسجيل نداء الحصة الحالية
            </button>
          </div>
        </div>

        {/* Timetable Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-semibold border-collapse">
            <thead>
              <tr className="bg-[#D5BEE8] text-[#3B1E54]">
                <th className="py-3 px-4 rounded-r-2xl font-bold border-l border-white/40">الحصة / التوقيت</th>
                <th className="py-3 px-4 font-bold border-l border-white/40">الإثنين</th>
                <th className="py-3 px-4 font-bold border-l border-white/40">الثلاثاء</th>
                <th className="py-3 px-4 font-bold border-l border-white/40">الأربعاء</th>
                <th className="py-3 px-4 font-bold border-l border-white/40">الخميس</th>
                <th className="py-3 px-4 rounded-l-2xl font-bold">الجمعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#76C7B7]/25 text-slate-700 bg-white/70 rounded-2xl">
              <tr>
                <td className="py-3.5 px-4 font-bold font-mono text-[#4C2673] bg-[#F4EDFB]/60 border-l border-[#76C7B7]/20">
                  09:00 - 11:00
                </td>
                <td className="py-3.5 px-4">تكوين مهني (شعبة 1)</td>
                <td className="py-3.5 px-4">تكوين مهني (شعبة 2)</td>
                <td className="py-3.5 px-4">تأهيل تربوي ولغات</td>
                <td className="py-3.5 px-4">تكوين مهني تطبيقي</td>
                <td className="py-3.5 px-4">أنشطة الحياة المدرسية</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold font-mono text-[#4C2673] bg-[#F4EDFB]/60 border-l border-[#76C7B7]/20">
                  11:00 - 13:00
                </td>
                <td className="py-3.5 px-4">أشغال تطبيقية بالورشة</td>
                <td className="py-3.5 px-4">معلوميات ورقميات</td>
                <td className="py-3.5 px-4">رياضيات تطبيقية</td>
                <td className="py-3.5 px-4">أشغال الورشة</td>
                <td className="py-3.5 px-4">تقييم ومواكبة فردية</td>
              </tr>
              <tr className="bg-[#FCEDE5]/70 text-[#923206] font-bold">
                <td className="py-2.5 px-4 font-mono border-l border-[#76C7B7]/20">13:00 - 14:00</td>
                <td colSpan={5} className="py-2.5 px-4 text-center">
                  استراحة وتناول وجبة الغذاء (Pause déjeuner)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold font-mono text-[#4C2673] bg-[#F4EDFB]/60 border-l border-[#76C7B7]/20">
                  14:00 - 16:00
                </td>
                <td className="py-3.5 px-4">ورشة التكوين المهني</td>
                <td className="py-3.5 px-4">مهارات حياتية وتواصل</td>
                <td className="py-3.5 px-4">تكوين تطبيقي</td>
                <td className="py-3.5 px-4">تأهيل مهني وإدماج</td>
                <td className="py-3.5 px-4">أنشطة ثقافية ورياضية</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Two Columns: 14 Days Chart + Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 Cols) */}
        <div className="lg:col-span-2 canva-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  تطور الغيابات خلال آخر 14 يوماً
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  رصد يومي للغيابات غير المبررة (برتقالي) والمبررة (بنفسجي)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#E86826]" />
                  <span className="text-slate-700">غير مبرر</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#D5BEE8]" />
                  <span className="text-slate-700">مبرر</span>
                </div>
              </div>
            </div>

            {data.attendanceRecords.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                لا توجد حصص مسجلة حتى الآن. انقر على «تسجيل نداء الحصة الآن» للبدء.
              </div>
            ) : (
              <div className="h-56 flex items-end gap-2 pt-6 px-2 border-b border-slate-200">
                {last14DaysData.map((d, idx) => {
                  const unexcusedHeight = (d.unexcused / maxAbsence14) * 150;
                  const excusedHeight = (d.excused / maxAbsence14) * 150;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end"
                    >
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.unexcused + d.excused}
                      </div>
                      <div className="w-full max-w-[22px] flex flex-col justify-end rounded-t-xl overflow-hidden bg-slate-100">
                        {d.excused > 0 && (
                          <div
                            style={{ height: `${Math.max(excusedHeight, 6)}px` }}
                            className="w-full bg-[#D5BEE8] hover:bg-[#c3a4de] transition-colors"
                            title={`غياب مبرر: ${d.excused}`}
                          />
                        )}
                        {d.unexcused > 0 && (
                          <div
                            style={{ height: `${Math.max(unexcusedHeight, 6)}px` }}
                            className="w-full bg-[#E86826] hover:bg-[#d65b1d] transition-colors"
                            title={`غياب غير مبرر: ${d.unexcused}`}
                          />
                        )}
                        {d.unexcused === 0 && d.excused === 0 && (
                          <div className="h-1.5 w-full bg-slate-200" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap mt-1">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Classes distribution mini strip */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              توزيع الغيابات حسب الأقسام:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {classAbsencesData.map((cls) => (
                <div
                  key={cls.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800">{cls.name}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                    <span className="text-[#E86826] font-bold">{cls.unexcused} غير مبرر</span>
                    <span>•</span>
                    <span className="text-[#4C2673]">{cls.excused} مبرر</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts List (1 Col) */}
        <div className="canva-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-[#E86826]" />
                <h4 className="text-base font-bold text-slate-800">
                  تنبيهات تجاوز الحد
                </h4>
              </div>
              <span className="text-xs font-bold text-[#E86826] bg-[#FCEDE5] px-2.5 py-0.5 rounded-full font-mono">
                الحد: ≥ {data.settings.absenceAlertThreshold}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              لائحة المستفيدين الواجب استدعاء أولياء أمورهم بسبب تراكم الغياب غير المبرر.
            </p>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {alertStudents.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                  <CheckCircle className="w-10 h-10 text-[#76C7B7] mb-2" />
                  <p className="text-sm font-bold text-slate-700">الوضعية منضبطة تماماً</p>
                  <p className="text-xs text-slate-400 mt-1">لا يوجد مستفيد تجاوز عتبة التنبيه</p>
                </div>
              ) : (
                alertStudents.map(({ student, unexcusedCount, className }) => (
                  <div
                    key={student.id}
                    className="p-3 bg-[#FCEDE5]/70 border border-[#E86826]/30 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono">{student.massarNumber}</span>
                        <span>•</span>
                        <span className="truncate">{className}</span>
                      </div>
                      <p className="text-xs font-bold text-[#E86826] mt-1">
                        {unexcusedCount} غيابات غير مبررة
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        triggerPrintDocument({
                          type: 'summons',
                          student,
                        })
                      }
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#E86826] hover:bg-[#d65b1d] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
                      title="طباعة استدعاء ولي الأمر"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>استدعاء</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setActiveTab('absences')}
              className="text-xs font-bold text-[#4C2673] hover:underline cursor-pointer"
            >
              عرض سجل الغيابات الكامل ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
