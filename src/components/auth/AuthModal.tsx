import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  School,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InstitutionalLogoHeader } from '../common/InstitutionalLogoHeader';

export const AuthModal: React.FC = () => {
  const { data, setupAdminPassword, loginWithPassword, resetAdminPassword } = useApp();

  const isFirstTime = !data.isPasswordSet;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isFirstTime) {
      if (password.length < 4) {
        setError('يرجى إدخال كلمة مرور تتكون من 4 خانات على الأقل (مثال: admin أو 1234).');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين.');
        return;
      }

      setLoading(true);
      const ok = await setupAdminPassword(password);
      setLoading(false);
      if (!ok) {
        setError('فشل في حفظ كلمة المرور.');
      }
    } else {
      if (!password) {
        setError('يرجى إدخال كلمة المرور.');
        return;
      }

      setLoading(true);
      const ok = await loginWithPassword(password);
      setLoading(false);
      if (!ok) {
        setError('كلمة المرور غير صحيحة. يرجى المحاولة ثانية أو إعادة التعيين.');
      }
    }
  };

  // Quick setup with standard demo password
  const handleQuickSetup = async () => {
    setLoading(true);
    await setupAdminPassword('admin2026');
    setLoading(false);
  };

  const handleResetPassword = () => {
    resetAdminPassword();
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setShowResetConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-6">
          <InstitutionalLogoHeader variant="auth" />
          <p className="text-xs text-blue-300 font-bold mt-2 text-center">
            {isFirstTime
              ? 'التهيئة الأولية: تعيين كلمة مرور الإدارة'
              : 'تسجيل الدخول إلى فضاء الإدارة'}
          </p>
          <p className="text-xs text-slate-300 mt-2 text-center leading-relaxed">
            {isFirstTime
              ? 'مرحباً بك. يرجى إنشاء كلمة مرور من اختيارك لحماية سجلات الغياب وبيانات المتعلمين على هذا الحاسوب.'
              : 'المنظومة مخصصة لإدارة المركز. أدخل كلمة المرور للمتابعة.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {showResetConfirm ? (
          <div className="p-4 bg-amber-950/50 border border-amber-800/60 rounded-xl space-y-3 mb-4 text-xs">
            <p className="text-amber-200 font-semibold">
              هل ترغب في إعادة تعيين كلمة مرور الإدارة؟
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              ستتمكن من إنشاء كلمة مرور جديدة فوراً دون فقدان أي بيانات أخرى مسجلة.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold"
              >
                نعم، إعادة التعيين
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {isFirstTime ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>إخفاء</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>إظهار</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  placeholder={isFirstTime ? 'أدخل كلمة مرور (مثلاً: admin2026)' : '••••••••'}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {isFirstTime && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور"
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>جاري التحقق...</span>
              ) : isFirstTime ? (
                <span>حفظ كلمة المرور ودخول المنظومة</span>
              ) : (
                <span>تسجيل الدخول</span>
              )}
            </button>

            {/* Quick Helper for first time setup */}
            {isFirstTime && (
              <button
                type="button"
                onClick={handleQuickSetup}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>تعيين سريع بكلمة: admin2026 والدخول</span>
              </button>
            )}

            {/* Forgot password option for returning users */}
            {!isFirstTime && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 underline-offset-4 flex items-center gap-1 mx-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>نسيت كلمة المرور؟ إعادة تعيين كلمة المرور</span>
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            تطبيق محلي للحاسوب • الحفظ آمن وتلقائي في المتصفح والقرص المحلي
          </p>
        </div>
      </div>
    </div>
  );
};
