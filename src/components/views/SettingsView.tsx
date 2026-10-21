import React, { useState, useRef } from 'react';
import {
  Building,
  Check,
  AlertCircle,
  Search,
  CheckCircle2,
  KeyRound,
  History,
  Sliders,
  Image,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const SettingsView: React.FC = () => {
  const { data, updateSettings, changeAdminPassword } = useApp();

  // General Settings State
  const [centerName, setCenterName] = useState(data.settings.centerName);
  const [academicYear, setAcademicYear] = useState(data.settings.academicYear);
  const [alertThreshold, setAlertThreshold] = useState<number>(
    data.settings.absenceAlertThreshold || 3
  );
  const [delegation, setDelegation] = useState(data.settings.delegation);
  const [academy, setAcademy] = useState(data.settings.academy);
  const [address, setAddress] = useState(data.settings.address || '');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(
    data.settings.customLogoUrl || '/logo-cmed.jpeg'
  );
  const [logoNotice, setLogoNotice] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Activity Log Search
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
        updateSettings({
          ...data.settings,
          customLogoUrl: result,
        });
        setLogoNotice('تم تحديث وحفظ الشعار الجديد بنجاح في المنظومة.');
        setTimeout(() => setLogoNotice(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    setCustomLogoUrl('/logo-cmed.jpeg');
    updateSettings({
      ...data.settings,
      customLogoUrl: '/logo-cmed.jpeg',
    });
    setLogoNotice('تمت استعادة الشعار الرسمي المعتمد (الهيئة المغربية للتربية والتنمية - CMED).');
    setTimeout(() => setLogoNotice(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      centerName: centerName.trim(),
      academicYear: academicYear.trim(),
      absenceAlertThreshold: Number(alertThreshold) || 3,
      delegation: delegation.trim(),
      academy: academy.trim(),
      address: address.trim(),
      phone: data.settings.phone || '',
      customLogoUrl: customLogoUrl.trim() || '/logo-cmed.jpeg',
    });
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 4) {
      setPasswordError('يجب أن تتكون كلمة المرور الجديدة من 4 أحرف أو أرقام على الأقل.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.');
      return;
    }

    const res = await changeAdminPassword(oldPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.message);
    } else {
      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
  };

  const filteredLogs = (data.activityLogs || []).filter((log) => {
    if (!logSearchQuery.trim()) return true;
    const q = logSearchQuery.trim().toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.timestamp.includes(q)
    );
  });

  return (
    <div className="space-y-6 text-black">
      {/* Official CMED Institutional Header */}
      <InstitutionalLogoHeader
        variant="compact"
        pageTitle="إعدادات المنظومة والشعار الرسمي"
        pageSubtitle="مركز الفرصة الثانية - الجيل الجديد (زرارة)"
      />

      {/* Official Logo & Administrative Identity Management Panel */}
      <div className="canva-panel p-5 sm:p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Image className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black">
                الشعار الرسمي والهوية الإدارية المعتمدة (CMED)
              </h3>
              <p className="text-xs text-slate-600">
                الهيئة المغربية للتربية والتنمية • الأبعاد الأصلية (440×131) محفوظة بدقة وبدون أي تشويه
              </p>
            </div>
          </div>

          {logoNotice && (
            <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-bold shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{logoNotice}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Logo Visual Container */}
          <div className="md:col-span-1 flex flex-col items-center justify-center bg-[#F8F9FA] border border-slate-200 p-4 rounded-2xl text-center">
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm w-full max-w-[240px] flex items-center justify-center mb-2 overflow-hidden">
              <img
                src={customLogoUrl || '/logo-cmed.jpeg'}
                alt="الهيئة المغربية للتربية والتنمية - CMED"
                className="w-full h-auto max-h-16 object-contain select-none"
                style={{ aspectRatio: '440 / 131' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-cmed.jpeg';
                }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              الملف الأصلي: cmedmaroc.org_-440x131(1).jpeg
            </span>
          </div>

          {/* Institutional Administrative Hierarchy Preview */}
          <div className="md:col-span-1 space-y-1.5 text-right bg-white p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">
              الهوية الإدارية الرسمية المعتمدة
            </span>
            <p className="text-xs font-black text-black">المملكة المغربية</p>
            <p className="text-xs font-semibold text-slate-700">
              الأكاديمية الجهوية للتربية والتكوين لجهة الرباط - سلا - القنيطرة
            </p>
            <p className="text-xs font-bold text-[#E86826]">
              المديرية الإقليمية الصخيرات - تمارة
            </p>
            <p className="text-xs font-extrabold text-[#125547] pt-0.5 border-t border-slate-100">
              الفرصة الثانية - الجيل الجديد
            </p>
            <p className="text-xs font-bold text-black">
              مركز زرارة
            </p>
          </div>

          {/* Management Controls */}
          <div className="md:col-span-1 flex flex-col gap-2.5 justify-center">
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>استبدال الشعار بصورة مخصصة</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefaultLogo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="إعادة تعيين الشعار إلى شعار الهيئة المغربية للتربية والتنمية CMED الأصلي"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>استعادة الشعار الرسمي الأصلي (CMED)</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center leading-tight">
              مسار التخزين محلي ومستقل عن مجلد التحميلات.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Center Settings & Password Change */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Center Settings */}
        <div className="lg:col-span-2 canva-panel p-5 border border-slate-200">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#76C7B7]" />
              <h3 className="text-base font-bold text-black">
                إعدادات مركز الفرصة الثانية والترخيص
              </h3>
            </div>
            {settingsSuccess && (
              <span className="text-xs text-[#125547] bg-[#E7F7F4] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5 text-[#76C7B7]" />
                <span>تم حفظ التعديلات بنجاح</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Center Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-black mb-1.5">
                  اسم المؤسسة / المركز
                </label>
                <input
                  type="text"
                  required
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  السنة التكوينية / الدراسية (افتراضياً 2026/2027)
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026/2027"
                  className="canva-input w-full px-3.5 py-2 text-xs font-mono tabular-nums text-black font-bold"
                />
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  عتبة التنبيه للغياب غير المبرر (عدد الحصص)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10) || 3)}
                  className="canva-input w-full px-3.5 py-2 text-xs font-mono tabular-nums text-black font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  يُدرج المستفيد في قائمة التنبيهات باللوحة عند وصوله لهذا الحد
                </p>
              </div>

              {/* Academy */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  الأكاديمية الجهوية للتربية والتكوين
                </label>
                <input
                  type="text"
                  value={academy}
                  onChange={(e) => setAcademy(e.target.value)}
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>

              {/* Delegation */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  المديرية الإقليمية
                </label>
                <input
                  type="text"
                  value={delegation}
                  onChange={(e) => setDelegation(e.target.value)}
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  عنوان مقر المركز
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="canva-input w-full px-3.5 py-2 text-xs text-black font-medium"
                />
              </div>


            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#125547] hover:bg-[#0e4438] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                حفظ إعدادات المركز
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Password Change */}
        <div className="canva-panel p-5 border border-slate-200">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-4">
            <KeyRound className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-black">
              تغيير كلمة مرور الإدارة
            </h3>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mb-4">
            تُستخدم كلمة المرور لقفل وفتح فضاء الإدارة ومنع الدخول غير المصرح به على هذا الحاسوب.
          </p>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تغيير كلمة المرور بنجاح!</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-black mb-1">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="canva-input w-full px-3 py-2 font-mono text-black"
              />
            </div>

            <div>
              <label className="block font-bold text-black mb-1">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="canva-input w-full px-3 py-2 font-mono text-black"
              />
            </div>

            <div>
              <label className="block font-bold text-black mb-1">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="canva-input w-full px-3 py-2 font-mono text-black"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                تحديث كلمة المرور
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Activity Log (سجل النشاط - آخر 300 عملية) */}
      <div className="canva-panel p-5 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#4C2673]" />
            <h3 className="text-base font-bold text-black">
              سجل نشاط العمليات (آخر 300 عملية)
            </h3>
          </div>

          <div className="relative">
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="تصفية السجل بالعملية أو التفاصيل..."
              className="canva-input pr-9 pl-3 py-2 text-xs text-black w-64 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <p className="text-xs text-slate-700 mb-4 font-medium">
          يسجل النظام آلياً كل عملية تدوين نداء، إضافة أو تعديل مستفيد، معالجة غياب، أو تعديل إعدادات، لتتبع الشفافية الإدارية.
        </p>

        <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200/80">
          {filteredLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 font-bold">
              سجل النشاط فارغ حالياً. ستظهر العمليات هنا فور القيام بأي نشاط في التطبيق.
            </div>
          ) : (
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-black font-bold">
                  <th className="py-2.5 px-3.5 w-44">التوقيت</th>
                  <th className="py-2.5 px-3.5 w-56">العملية</th>
                  <th className="py-2.5 px-3.5">تفاصيل الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 text-slate-600 tabular-nums">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3.5 text-[#125547] font-sans font-bold">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3.5 text-black font-sans font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
