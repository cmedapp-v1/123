import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  UserCheck,
  LogOut,
  CreditCard,
  Building,
  Calendar,
  Clock,
  Scissors,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTodayDDMMYYYY } from '../../services/storage';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const DocumentsPrintView: React.FC = () => {
  const { data, printConfig, closePrintPreview } = useApp();

  const [docType, setDocType] = useState<'summons' | 'entry_ticket' | 'exit_permit' | 'student_card'>(
    printConfig.type || 'summons'
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    printConfig.student?.id || (data.students[0]?.id || '')
  );

  // Custom Form fields for summons & permits
  const [summonsDate, setSummonsDate] = useState<string>(getTodayDDMMYYYY());
  const [summonsTime, setSummonsTime] = useState<string>('10:00 صباحاً');
  const [summonsReason, setSummonsReason] = useState<string>(
    printConfig.absenceRecord?.reason || 'تكرار الغياب غير المبرر والانقطاع عن التكوين'
  );

  const [exitReason, setExitReason] = useState<string>('وعكة صحية طارئة');
  const [exitTime, setExitTime] = useState<string>('12:00 زوالاً');

  const [entryReason, setEntryReason] = useState<string>(
    printConfig.absenceRecord?.reason || 'الإدلاء بشهادة طبية وتبرير الغياب قانونياً'
  );

  // Sync if printConfig changes
  useEffect(() => {
    if (printConfig.type) {
      setDocType(printConfig.type);
    }
    if (printConfig.student) {
      setSelectedStudentId(printConfig.student.id);
    }
    if (printConfig.absenceRecord) {
      if (printConfig.absenceRecord.reason) {
        setSummonsReason(`الغياب غير المبرر (${printConfig.absenceRecord.reason})`);
        setEntryReason(`تبرير الغياب: ${printConfig.absenceRecord.reason}`);
      }
    }
  }, [printConfig]);

  const selectedStudent = data.students.find((s) => s.id === selectedStudentId);
  const selectedClass = selectedStudent
    ? data.classes.find((c) => c.id === selectedStudent.classId)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Strip (Hidden in Print) */}
      <div className="glass-panel rounded-xl p-4 no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Doc Type Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            <button
              onClick={() => setDocType('summons')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                docType === 'summons'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>استدعاء ولي الأمر</span>
            </button>

            <button
              onClick={() => setDocType('entry_ticket')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                docType === 'entry_ticket'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>تذكرة الدخول</span>
            </button>

            <button
              onClick={() => setDocType('exit_permit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                docType === 'exit_permit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>رخصة الخروج (نسختان)</span>
            </button>

            <button
              onClick={() => setDocType('student_card')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                docType === 'student_card'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>بطاقة المستفيد</span>
            </button>
          </div>

          {/* Student Selector */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="glass-input rounded-lg px-3 py-1.5 text-xs text-slate-200 max-w-xs"
          >
            {data.students.length === 0 ? (
              <option value="">لا يوجد مستفيدون مضافون</option>
            ) : (
              data.students.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900">
                  {s.lastName} {s.firstName} ({s.massarNumber})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          disabled={!selectedStudent}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الوثيقة (A4)</span>
        </button>
      </div>

      {/* Document Parameters Form (no-print) */}
      <div className="glass-card rounded-xl p-4 no-print grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {docType === 'summons' && (
          <>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">تاريخ الحضور للمركز</label>
              <input
                type="text"
                value={summonsDate}
                onChange={(e) => setSummonsDate(e.target.value)}
                placeholder="JJ/MM/AAAA"
                className="glass-input w-full rounded-lg px-3 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ساعة الموعد</label>
              <input
                type="text"
                value={summonsTime}
                onChange={(e) => setSummonsTime(e.target.value)}
                placeholder="10:00 صباحاً"
                className="glass-input w-full rounded-lg px-3 py-1.5"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">سبب الاستدعاء</label>
              <input
                type="text"
                value={summonsReason}
                onChange={(e) => setSummonsReason(e.target.value)}
                placeholder="سبب الاستدعاء"
                className="glass-input w-full rounded-lg px-3 py-1.5"
              />
            </div>
          </>
        )}

        {docType === 'entry_ticket' && (
          <>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">سبب الترخيص بالدخول وتبرير الغياب</label>
              <input
                type="text"
                value={entryReason}
                onChange={(e) => setEntryReason(e.target.value)}
                placeholder="سبب التبرير (شهادة طبية، ظرف عائلي...)"
                className="glass-input w-full rounded-lg px-3 py-1.5"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">تاريخ العودة</label>
              <input
                type="text"
                value={getTodayDDMMYYYY()}
                readOnly
                className="glass-input w-full rounded-lg px-3 py-1.5 font-mono text-slate-400"
              />
            </div>
          </>
        )}

        {docType === 'exit_permit' && (
          <>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">ساعة الخروج المرخص بها</label>
              <input
                type="text"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                placeholder="12:00 زوالاً"
                className="glass-input w-full rounded-lg px-3 py-1.5 font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold mb-1">سبب الخروج الاستثنائي</label>
              <input
                type="text"
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="وعكة صحية، موعد خارجي..."
                className="glass-input w-full rounded-lg px-3 py-1.5"
              />
            </div>
          </>
        )}

        {docType === 'student_card' && (
          <div className="col-span-3 text-slate-300">
            تتضمن البطاقة معطيات المستفيد، القسم، المعرف الوطني مسار، جهة الاتصال للطوارئ، وخاتم المركز للسنة التكوينية{' '}
            <strong className="text-white font-mono">{data.settings.academicYear}</strong>.
          </div>
        )}
      </div>

      {/* Official A4 Document Paper Container */}
      <div className="flex justify-center">
        {!selectedStudent ? (
          <div className="glass-panel rounded-xl p-12 text-center text-xs text-slate-400 w-full max-w-3xl">
            يرجى إضافة مستفيدين أولاً في قسم «المستفيدون» لإمكانية توليد وطباعة الوثائق الإدارية.
          </div>
        ) : (
          <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-10 shadow-2xl rounded-sm print:p-0 print:shadow-none print:max-w-none print:w-full print:rounded-none select-text text-right font-sans">
            {/* DOCUMENT 1: GUARDIAN SUMMONS (استدعاء ولي الأمر) */}
            {docType === 'summons' && (
              <div className="space-y-6">
                {/* Official Moroccan Educational Header with CMED Logo */}
                <InstitutionalLogoHeader variant="print" />

                <div className="text-center">
                  <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-900 border-2 border-slate-900 inline-block px-8 py-1.5 rounded">
                    استدعاء لولي أمر المتعلم(ة)
                  </h1>
                </div>

                {/* Recipient */}
                <div className="text-sm space-y-1 pt-2">
                  <p className="font-bold text-base">
                    إلى السيد(ة): <span className="font-normal">{selectedStudent.guardianName || 'ولي أمر المستفيد(ة)'}</span>
                  </p>
                  <p className="text-slate-700">
                    ولي أمر المستفيد(ة): <strong className="font-bold">{selectedStudent.lastName} {selectedStudent.firstName}</strong>
                  </p>
                  <p className="text-slate-700">
                    رقم مسار: <span className="font-mono font-bold">{selectedStudent.massarNumber}</span> | القسم:{' '}
                    <strong>{selectedClass?.name || 'غير محدد'}</strong>
                  </p>
                  <p className="text-slate-700">
                    العنوان: {selectedStudent.address || 'جماعة زرارة'}
                  </p>
                </div>

                {/* Body Text */}
                <div className="text-sm leading-loose text-justify space-y-4 pt-2">
                  <p>
                    سلام تام بوجود مولانا الإمام المؤيد بالله،
                  </p>
                  <p>
                    وبعد، يؤسف إدارة مركز الفرصة الثانية الجيل الجديد (زرارة) أن تخبركم بأن ابنكم(تكم) المسجل(ة) بالمركز تحت المعطيات المشار إليها أعلاه، قد راكم(ت) مجموعة من الغيابات غير المبررة عن حصص التكوين والتأهيل المهني والتربوي، وذلك بسبب:{' '}
                    <strong className="underline decoration-1 underline-offset-4">{summonsReason}</strong>.
                  </p>
                  <p>
                    ونظراً لما يترتب عن هذا الانقطاع من تأثير سلبي ومباشر على مساره(ها) التكويني وانضباطه(ها) داخل ورشات وأقسام المركز، فإننا ندعوكم بإلحاح للحضور إلى مقر إدارة المركز الكائن بجماعة زرارة، وذلك يوم:
                  </p>

                  <div className="bg-slate-100 border border-slate-300 p-4 rounded text-center font-bold text-base my-2">
                    يوم: <span className="font-mono">{summonsDate}</span> على الساعة:{' '}
                    <span className="font-mono">{summonsTime}</span>
                  </div>

                  <p>
                    وذلك قصد التداول معكم في أسباب هذه الغيابات المتكررة واتخاذ التدابير الضرورية لتدارك الوضع وضمان استمرارية تكوينه(ها) وفق النظم الجاري بها العمل.
                  </p>
                  <p className="font-semibold">
                    وتقبلوا فائق عبارات التقدير والاحترام، والسلام.
                  </p>
                </div>

                {/* Signature Strip */}
                <div className="grid grid-cols-2 gap-8 pt-10 text-center text-xs">
                  <div>
                    <p className="font-bold underline mb-16">توقيع ولي الأمر بالعلم والتوصل</p>
                    <p className="text-slate-500 text-[10px]">(الاسم والتوقيع وتاريخ التوصل)</p>
                  </div>
                  <div>
                    <p className="font-bold underline mb-16">خاتم وتوقيع مدير(ة) المركز</p>
                    <p className="text-slate-500 text-[10px]">(خاتم المؤسسة الرسمي)</p>
                  </div>
                </div>

                {/* Footnote */}
                <div className="pt-12 text-[10px] text-slate-500 border-t border-slate-300 flex justify-between">
                  <span>مركز الفرصة الثانية الجيل الجديد زرارة - إقليم تازة</span>
                  <span>وثيقة إدارية رسمية مستخرجة آلياً</span>
                </div>
              </div>
            )}

            {/* DOCUMENT 2: ENTRY TICKET (تذكرة الدخول بعد الغياب) */}
            {docType === 'entry_ticket' && (
              <div className="space-y-6">
                {/* Official Moroccan Educational Header with CMED Logo */}
                <InstitutionalLogoHeader variant="print" />

                <div className="text-center">
                  <h1 className="text-lg font-black uppercase text-slate-900 border-2 border-slate-900 inline-block px-8 py-1.5 rounded">
                    تذكرة الدخول إلى حجرة / ورشة التكوين
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                    ترخيص رسمي بالاستئناف بعد تبرير الغياب
                  </p>
                </div>

                {/* Details */}
                <div className="border border-slate-300 p-4 rounded space-y-3 text-xs leading-relaxed">
                  <div className="grid grid-cols-2 gap-4">
                    <p>
                      يُرخص للمستفيد(ة):{' '}
                      <strong className="text-sm font-bold">{selectedStudent.lastName} {selectedStudent.firstName}</strong>
                    </p>
                    <p>
                      رقم مسار:{' '}
                      <strong className="font-mono font-bold text-sm">{selectedStudent.massarNumber}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <p>القسم البيداغوجي: <strong>{selectedClass?.name || 'غير محدد'}</strong></p>
                    <p>تاريخ الاستئناف: <span className="font-mono font-bold">{getTodayDDMMYYYY()}</span></p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p>
                      سبب الغياب وتبريره المعتمد لدى الإدارة:{' '}
                      <strong className="underline underline-offset-2">{entryReason}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="font-bold mb-1">تعليمات للمؤطر(ة) / الأستاذ(ة):</p>
                  <p>
                    - يُرجى قبول المستفيد(ة) بحجرة الدراسة أو ورشة التكوين فور الإدلاء بهذه التذكرة موقعة ومختومة من طرف الإدارة.
                  </p>
                  <p>
                    - تُسجل هذه التذكرة بسجل القسم وتُحفظ ضمن ملف الغياب.
                  </p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
                  <div>
                    <p className="font-bold underline mb-16">توقيع المستفيد(ة)</p>
                  </div>
                  <div>
                    <p className="font-bold underline mb-16">توقيع وخاتم الإدارة</p>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 3: EXIT PERMIT - TWO COPIES ON ONE A4 (رخصة الخروج: نسختان في صفحة A4 واحدة) */}
            {docType === 'exit_permit' && (
              <div className="space-y-4">
                {/* SLIP 1: Top Copy */}
                <div className="a4-double-slip border border-dashed border-slate-400 p-5 rounded space-y-3 text-xs">
                  <div className="flex justify-between items-start border-b pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-0.5 rounded border border-slate-200 max-w-[80px]">
                        <img
                          src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                          alt="CMED"
                          className="w-full h-auto max-h-6 object-contain"
                          style={{ aspectRatio: '440 / 131' }}
                        />
                      </div>
                      <div>
                        <p className="font-bold">{data.settings.centerName}</p>
                        <p className="text-slate-600 text-[10px]">{data.settings.delegation}</p>
                      </div>
                    </div>
                    <div className="text-center font-bold">
                      <span className="border border-black px-3 py-0.5 rounded text-xs bg-slate-100">
                        رخصة خروج استثنائية (نسخة الإدارة / الحراسة)
                      </span>
                    </div>
                    <div className="text-left font-mono text-[10px]">
                      <p>التاريخ: {getTodayDDMMYYYY()}</p>
                      <p>السنة: {data.settings.academicYear}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <p>اسم المستفيد(ة): <strong>{selectedStudent.lastName} {selectedStudent.firstName}</strong></p>
                    <p>رقم مسار: <strong className="font-mono">{selectedStudent.massarNumber}</strong></p>
                    <p>القسم: <strong>{selectedClass?.name}</strong></p>
                    <p>ساعة الخروج المرخصة: <strong className="font-mono">{exitTime}</strong></p>
                  </div>

                  <p className="text-xs pt-1">
                    سبب الخروج الاستثنائي: <strong>{exitReason}</strong>
                  </p>

                  <div className="grid grid-cols-2 pt-4 text-center text-[10px]">
                    <div>
                      <p className="font-bold underline mb-6">توقيع المؤطر(ة) / الحارس العام</p>
                    </div>
                    <div>
                      <p className="font-bold underline mb-6">تأشيرة وخاتم الإدارة</p>
                    </div>
                  </div>
                </div>

                {/* CUT LINE INDICATOR IN THE MIDDLE */}
                <div className="flex items-center justify-center gap-2 py-1 text-slate-500 font-mono text-[11px] select-none">
                  <Scissors className="w-4 h-4" />
                  <span>- - - - - - - - - - - - - - - - - - - - - قص هنا (خط الفصل بين النسختين) - - - - - - - - - - - - - - - - - - - - -</span>
                  <Scissors className="w-4 h-4 rotate-180" />
                </div>

                {/* SLIP 2: Bottom Copy */}
                <div className="a4-double-slip border border-dashed border-slate-400 p-5 rounded space-y-3 text-xs">
                  <div className="flex justify-between items-start border-b pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="bg-white p-0.5 rounded border border-slate-200 max-w-[80px]">
                        <img
                          src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                          alt="CMED"
                          className="w-full h-auto max-h-6 object-contain"
                          style={{ aspectRatio: '440 / 131' }}
                        />
                      </div>
                      <div>
                        <p className="font-bold">{data.settings.centerName}</p>
                        <p className="text-slate-600 text-[10px]">{data.settings.delegation}</p>
                      </div>
                    </div>
                    <div className="text-center font-bold">
                      <span className="border border-black px-3 py-0.5 rounded text-xs bg-slate-100">
                        رخصة خروج استثنائية (نسخة المستفيد / ولي الأمر)
                      </span>
                    </div>
                    <div className="text-left font-mono text-[10px]">
                      <p>التاريخ: {getTodayDDMMYYYY()}</p>
                      <p>السنة: {data.settings.academicYear}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <p>اسم المستفيد(ة): <strong>{selectedStudent.lastName} {selectedStudent.firstName}</strong></p>
                    <p>رقم مسار: <strong className="font-mono">{selectedStudent.massarNumber}</strong></p>
                    <p>القسم: <strong>{selectedClass?.name}</strong></p>
                    <p>ساعة الخروج المرخصة: <strong className="font-mono">{exitTime}</strong></p>
                  </div>

                  <p className="text-xs pt-1">
                    سبب الخروج الاستثنائي: <strong>{exitReason}</strong>
                  </p>

                  <div className="grid grid-cols-2 pt-4 text-center text-[10px]">
                    <div>
                      <p className="font-bold underline mb-6">توقيع المؤطر(ة) / الحارس العام</p>
                    </div>
                    <div>
                      <p className="font-bold underline mb-6">تأشيرة وخاتم الإدارة</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT 4: STUDENT ID CARD (بطاقة المستفيد للطباعة) */}
            {docType === 'student_card' && (
              <div className="flex flex-col items-center justify-center pt-8">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-sm text-slate-800">بطاقة التلميذ(ة) المستفيد(ة) الرسمية</h3>
                  <p className="text-xs text-slate-500">جاهزة للطباعة والتغليف الحراري Plastification</p>
                </div>

                {/* ID Card Front and Back */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
                  {/* Front Side */}
                  <div className="w-[86mm] h-[54mm] border-2 border-slate-800 rounded-xl p-3 bg-gradient-to-br from-blue-50 to-slate-100 text-slate-900 flex flex-col justify-between shadow-md relative overflow-hidden">
                    <div className="flex justify-between items-start border-b border-blue-900/30 pb-1">
                      <div>
                        <p className="text-[8px] font-bold">المملكة المغربية</p>
                        <p className="text-[7px]">الفرصة الثانية - الجيل الجديد</p>
                        <p className="text-[8px] font-bold text-blue-900">مركز زرارة</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="bg-white p-0.5 rounded border border-slate-200">
                          <img
                            src={data.settings.customLogoUrl || '/logo-cmed.jpeg'}
                            alt="CMED"
                            className="h-4 w-auto object-contain"
                            style={{ aspectRatio: '440 / 131' }}
                          />
                        </div>
                        <span className="text-[7px] font-mono bg-blue-900 text-white px-1.5 py-0.5 rounded">
                          {data.settings.academicYear}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center my-1">
                      {/* Photo Box */}
                      <div className="w-16 h-20 border border-slate-400 bg-white rounded flex flex-col items-center justify-center text-[8px] text-slate-400 shrink-0">
                        <span>صورة</span>
                        <span>فوتوغرافية</span>
                      </div>

                      <div className="text-[9px] leading-tight space-y-0.5">
                        <p>النسب: <strong className="text-[10px]">{selectedStudent.lastName}</strong></p>
                        <p>الاسم: <strong className="text-[10px]">{selectedStudent.firstName}</strong></p>
                        <p>مسار: <strong className="font-mono text-[10px]">{selectedStudent.massarNumber}</strong></p>
                        <p>القسم: <strong>{selectedClass?.name || 'الفرصة الثانية'}</strong></p>
                        <p>الازدياد: <span className="font-mono">{selectedStudent.birthDate}</span></p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[7px] text-slate-600 border-t border-slate-300 pt-0.5">
                      <span>بطاقة شخصية لا تُعطى للغير</span>
                      <span className="font-bold">خاتم الإدارة</span>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="w-[86mm] h-[54mm] border-2 border-slate-800 rounded-xl p-3 bg-slate-50 text-slate-900 flex flex-col justify-between shadow-md">
                    <div className="text-center border-b border-slate-200 pb-1">
                      <p className="text-[9px] font-bold text-slate-800">بيانات الاتصال والطوارئ</p>
                    </div>

                    <div className="text-[9px] space-y-1">
                      <p>ولي الأمر: <strong>{selectedStudent.guardianName || 'غير مسجل'}</strong></p>
                      <p>هاتف الولي: <span className="font-mono">{selectedStudent.guardianPhone || selectedStudent.phone || '—'}</span></p>
                      <p>العنوان: {selectedStudent.address || 'جماعة زرارة'}</p>
                      <p className="text-[8px] text-slate-500 pt-1">
                        في حالة العثور على هذه البطاقة المرجو تسليمها إلى إدارة المركز أو الاتصال بالهاتف: {data.settings.phone}.
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-1 flex justify-between items-center text-[7px] text-slate-500">
                      <span>مركز الفرصة الثانية - زرارة</span>
                      <span className="font-mono">{selectedStudent.massarNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
