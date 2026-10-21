import React, { useState, useMemo } from 'react';
import { Calendar, ClipboardCheck, Users, Clock, Printer, X, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDDMMYYYY, parseDDMMYYYY } from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';
import { TimetableSession, Student, WeekDay } from '../../types';

// Helper to get day of week (matching types/index.ts WeekDay)
const getDayOfWeek = (dateStr: string): WeekDay | null => {
  const date = parseDDMMYYYY(dateStr);
  if (!date) return null;
  const days: (WeekDay | 'الأحد')[] = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = days[date.getDay()];
  return (dayName === 'الأحد' ? null : dayName) as WeekDay | null;
};

export const DailyRollCallView: React.FC = () => {
  const { data } = useApp();
  const [selectedDate, setSelectedDate] = useState(getTodayDDMMYYYY());
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);

  const selectedDay = useMemo(() => getDayOfWeek(selectedDate), [selectedDate]);

  const sessionsForDay = useMemo(() => {
    if (!selectedDay) return [];
    return (data.timetableSessions || []).filter(s => s.day === selectedDay);
  }, [data.timetableSessions, selectedDay]);

  const [selectedSubSession, setSelectedSubSession] = useState<{classId?: string, trackId?: string} | null>(null);

  const studentsForSession = useMemo(() => {
    if (!selectedSession || !selectedSubSession) return [];
    
    // Filter students: 
    // 1. Must be enrolled (registrationDate <= selectedDate)
    // 2. Must match the selected class/track
    const targetDate = parseDDMMYYYY(selectedDate)?.getTime() || 0;
    
    return data.students.filter(s => {
      const regDate = parseDDMMYYYY(s.registrationDate)?.getTime() || 0;
      if (regDate > targetDate) return false;
      
      const classMatch = selectedSubSession.classId ? s.classId === selectedSubSession.classId : selectedSession.classIds.includes(s.classId);
      const trackMatch = selectedSubSession.trackId ? s.trackId === selectedSubSession.trackId : (selectedSession.trackId ? s.trackId === selectedSession.trackId : true);
      
      return classMatch && trackMatch;
    }).sort((a, b) => a.lastName.localeCompare(b.lastName, 'ar'));
  }, [data.students, selectedSession, selectedSubSession, selectedDate]);

  const openRollCall = (session: TimetableSession) => {
    if (session.classIds.length > 1) {
        setSelectedSession(session);
        setSelectedSubSession(null); // Force selection of sub-session via UI
    } else {
        setSelectedSession(session);
        setSelectedSubSession({ classId: session.classIds[0], trackId: session.trackId });
    }
  };

  return (
    <div className="space-y-6 text-black select-none">
      <InstitutionalLogoHeader 
        variant="banner" 
        pageTitle="ورقة النداء اليومية" 
        pageSubtitle="مركز الفرصة الثانية – Zirara | استخراج قوائم الحضور اليومية المبرمجة" 
      />
      
      {/* Date Picker */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#125547]" />
            <label className="text-sm font-bold text-slate-700">اختر التاريخ:</label>
        </div>
        <input 
            type="text" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            placeholder="DD/MM/YYYY"
            className="canva-input px-4 py-2 font-mono font-bold text-sm" 
        />
        <span className="font-black text-[#125547] text-lg bg-[#F4EDFB] px-4 py-1.5 rounded-xl">{selectedDay || 'يوم غير مبرمج'}</span>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessionsForDay.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200">
                لا توجد حصص مبرمجة في هذا التاريخ
            </div>
        ) : (
            sessionsForDay.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <span className="bg-[#E7F7F4] text-[#125547] px-3 py-1 rounded-full text-[10px] font-black">{s.timeSlot}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{s.sessionType}</span>
                </div>
                <h4 className="font-black text-sm text-black">{s.subjectName}</h4>
                <div className="text-xs text-slate-600 font-medium space-y-1 mt-auto">
                    <p>القسم: {(s.classIds || []).map(cid => data.classes.find(c => c.id === cid)?.name).join('، ')}</p>
                    <p>المنشط: {data.instructors.find(i => i.id === s.instructorId)?.fullName || 'غير محدد'}</p>
                </div>
                <button 
                    onClick={() => openRollCall(s)} 
                    className="mt-4 bg-[#125547] hover:bg-[#0e4438] text-white p-2.5 rounded-2xl text-xs font-bold w-full transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>فتح ورقة النداء</span>
                </button>
              </div>
            ))
        )}
      </div>

      {/* Roll Call Sheet Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                    <h2 className="text-lg font-black text-black">ورقة النداء اليومية</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        {selectedSession.subjectName} - {selectedDay} ({selectedDate})
                    </p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="overflow-x-auto">
                {!selectedSubSession ? (
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-700">يرجى اختيار القسم / الشعبة المطلوبة:</p>
                        {selectedSession.classIds.map(cid => (
                            <button key={cid} 
                                onClick={() => setSelectedSubSession({ classId: cid, trackId: selectedSession.trackId })}
                                className="w-full text-right p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-xs"
                            >
                                {data.classes.find(c => c.id === cid)?.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <table className="w-full text-right border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                <th className="p-3 border">#</th>
                                <th className="p-3 border">الاسم الكامل (عربي)</th>
                                <th className="p-3 border">القسم</th>
                                <th className="p-3 border">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentsForSession.map((s, idx) => (
                                <tr key={s.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 border font-mono text-slate-500">{idx + 1}</td>
                                    <td className="p-3 border font-bold text-black">{s.fullNameAr}</td>
                                    <td className="p-3 border text-slate-700">{data.classes.find(c => c.id === s.classId)?.name}</td>
                                    <td className="p-3 border">
                                        <div className="flex gap-2">
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">حاضر</span>
                                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">غائب</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button className="flex items-center gap-2 bg-[#E86826] text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-sm cursor-pointer">
                    <Printer className="w-4 h-4" />
                    <span>طباعة ورقة النداء</span>
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};
