import React, { useState, useRef } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderSync,
  FileJson,
  Trash2,
  Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  downloadJsonBackup,
  getTodayDDMMYYYY,
} from '../../services/storage';
import { AppStateData } from '../../types';

export const BackupView: React.FC = () => {
  const {
    data,
    fileHandleStatus,
    fileHandleName,
    lastSavedTime,
    connectAutoSaveFile,
    reAuthorizeFileHandle,
    disconnectAutoSaveFile,
    restoreFullBackup,
    resetAllData,
  } = useApp();

  const [confirmRestoreModal, setConfirmRestoreModal] = useState<AppStateData | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload handler for JSON restoration
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setRestoreError(null);
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.version && !Array.isArray(parsed.students)) {
          throw new Error('الملف لا يتطابق مع بنية النسخة الاحتياطية لمركز زرارة.');
        }

        setConfirmRestoreModal(parsed);
      } catch (err: any) {
        setRestoreError(err.message || 'فشل في قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleApplyRestore = () => {
    if (!confirmRestoreModal) return;
    restoreFullBackup(confirmRestoreModal);
    setConfirmRestoreModal(null);
    setRestoreSuccess(true);
    setTimeout(() => setRestoreSuccess(false), 4000);
  };

  const handleApplyReset = () => {
    resetAllData();
    setConfirmResetModal(false);
  };

  return (
    <div className="space-y-6 text-black">
      {/* Overview Info Card */}
      <div className="canva-panel p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-black flex items-center gap-2">
              <Laptop className="w-5 h-5 text-[#76C7B7]" />
              <span>إدارة الحفظ المحلي والنسخ الاحتياطي التلقائي (File System Access)</span>
            </h3>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-3xl">
              تطبيق تدبير الغياب بمركز الفرصة الثانية الجيل الجديد زرارة يشتغل بالكامل على حاسوبك الشخصي دون الحاجة إلى اتصال بالإنترنت أو خوادم سحابية خارجية. جميع البيانات محفوظة تلقائياً في ذاكرة المتصفح (localStorage) ويمكن مزامنتها تلقائياً مع ملف حقيقي على قرص حاسوبك عبر واجهة File System Access API.
            </p>
          </div>

          <div className="text-right sm:text-left font-mono text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
            <div>آخر حفظ مسجل:</div>
            <strong className="text-black text-sm font-bold">{lastSavedTime || 'الآن'}</strong>
          </div>
        </div>
      </div>

      {restoreSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم استرجاع كافة معطيات النسخة الاحتياطية بنجاح ومزامنتها مع النظام!</span>
        </div>
      )}

      {restoreError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-900 font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{restoreError}</span>
        </div>
      )}

      {/* Main Grid: Auto-Save to File + Manual JSON Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: File System Access API Auto-Save */}
        <div className="canva-panel p-5 flex flex-col justify-between border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FolderSync className="w-5 h-5 text-[#76C7B7]" />
                <h4 className="text-sm font-bold text-black">
                  الحفظ التلقائي في ملف على الحاسوب
                </h4>
              </div>

              {/* Status Badge */}
              {fileHandleStatus === 'connected' && (
                <span className="text-xs font-bold text-[#125547] bg-[#E7F7F4] border border-[#76C7B7]/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#76C7B7]" />
                  <span>متصل ونشط</span>
                </span>
              )}
              {fileHandleStatus === 'needs_permission' && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>يتطلب إذن القراءة/الكتابة</span>
                </span>
              )}
              {fileHandleStatus === 'disconnected' && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  غير مفعل
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              عند اختيار ملف حفظ على قرص الحاسوب (مثلاً في مجلد المستندات أو على مفتاح USB)، يقوم النظام بكتابة وتحديث ملف JSON تلقائياً في الخلفية فور إدخال أي تعديل أو تسجيل حضور.
            </p>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">اسم الملف المرتبط:</span>
                <span className="font-mono text-black font-bold truncate max-w-xs">
                  {fileHandleName || 'لم يتم تحديد ملف بعد'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">حالة الإذن:</span>
                <span className="text-black font-bold">
                  {fileHandleStatus === 'connected'
                    ? 'مصرح بالكتابة التلقائية المستمرة'
                    : fileHandleStatus === 'needs_permission'
                    ? 'يحتاج تفعيل الإذن (بعد إعادة تشغيل المتصفح)'
                    : 'محلي فقط بالمتصفح'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            {fileHandleStatus === 'disconnected' ? (
              <button
                onClick={connectAutoSaveFile}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <FolderSync className="w-4 h-4" />
                <span>اختيار ملف الحفظ على الحاسوب</span>
              </button>
            ) : fileHandleStatus === 'needs_permission' ? (
              <div className="flex gap-2 w-full">
                <button
                  onClick={reAuthorizeFileHandle}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>إعادة تفعيل إذن الحفظ على الملف</span>
                </button>
                <button
                  onClick={disconnectAutoSaveFile}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-xs font-bold cursor-pointer"
                  title="إلغاء ربط الملف"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  onClick={connectAutoSaveFile}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <FolderSync className="w-3.5 h-3.5 text-[#76C7B7]" />
                  <span>تغيير ملف الحفظ</span>
                </button>
                <button
                  onClick={disconnectAutoSaveFile}
                  className="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  فصل الملف
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Manual JSON Export & Restore */}
        <div className="canva-panel p-5 flex flex-col justify-between border border-slate-200">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-[#4C2673]" />
                <h4 className="text-sm font-bold text-black">
                  تصدير واسترجاع نسخة كاملة (JSON)
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              يمكنك في أي وقت تنزيل نسخة احتياطية مستقلة بصيغة JSON، أو استرجاع بيانات سابقة لنقلها إلى حاسوب آخر بالإدارة.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-500 block text-[11px] font-bold">المستفيدون المسجلون:</span>
                <span className="text-xl font-bold font-mono text-black tabular-nums mt-1 block">
                  {data.students.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-slate-500 block text-[11px] font-bold">سجلات الحضور والغياب:</span>
                <span className="text-xl font-bold font-mono text-black tabular-nums mt-1 block">
                  {data.attendanceRecords.length}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadJsonBackup(data)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#76C7B7] hover:bg-[#62baa8] text-[#0f4438] text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل نسخة احتياطية (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-black border border-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#4C2673]" />
                <span>استرجاع من نسخة احتياطية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="canva-panel p-5 border border-rose-200 bg-rose-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>إعادة تهيئة النظام ومسح البيانات</span>
            </h4>
            <p className="text-[11px] text-slate-700 mt-1">
              حذف كافة المستفيدين والأقسام وسجلات الغياب والبدء من جديد (يُرجى تنزيل نسخة احتياطية أولاً).
            </p>
          </div>

          <button
            onClick={() => setConfirmResetModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            مسح كافة البيانات
          </button>
        </div>
      </div>

      {/* Modal: Confirm Restore */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-black">
                تأكيد استرجاع النسخة الاحتياطية
              </h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-4">
              سيؤدي هذا الإجراء إلى <strong className="text-black">استبدال جميع البيانات الحالية</strong> بالبيانات الواردة في ملف النسخة الاحتياطية:
            </p>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1.5 mb-4 text-slate-700">
              <p>• عدد المستفيدين: <strong className="font-mono text-black font-bold">{confirmRestoreModal.students?.length || 0}</strong></p>
              <p>• عدد الأقسام: <strong className="font-mono text-black font-bold">{confirmRestoreModal.classes?.length || 0}</strong></p>
              <p>• عدد الشعب: <strong className="font-mono text-black font-bold">{confirmRestoreModal.tracks?.length || 0}</strong></p>
              <p>• عدد سجلات الغياب: <strong className="font-mono text-black font-bold">{confirmRestoreModal.attendanceRecords?.length || 0}</strong></p>
              <p>• السنة الدراسية: <strong className="font-mono text-black font-bold">{confirmRestoreModal.settings?.academicYear || '—'}</strong></p>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-6 font-medium">
              تنبيه: لا يمكن التراجع عن هذه العملية بعد الاستبدال.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestoreModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyRestore}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                تأكيد الاسترجاع واستبدال البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Reset */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-black">
              تحذير: مسح كافة المعطيات
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed mt-2 mb-5">
              هل أنت متأكد تماماً من رغبتك في حذف كافة معطيات مركز الفرصة الثانية وإفراغ قاعدة البيانات المحلية؟
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyReset}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                نعم، مسح كل شيء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
