import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, User, Mail, Phone, KeyRound, Sparkles } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await registerUser({ name, email, password, phone: phone || undefined });
      setAuth(res.user, res.access_token, res.refresh_token);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الحساب. حاول مجدداً.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-reader-canvas relative text-reader-text dir-rtl font-sans transition-colors duration-300">
      <div className="absolute top-4 left-4 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-reader-panel shadow-2xl border border-reader-border relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-reader-surface border border-reader-borderStrong flex items-center justify-center mb-3 text-reader-accent shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-reader-accent px-3 py-1 rounded-full bg-reader-accentSoft border border-reader-borderStrong mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            الانضمام لمجتمع القراء
          </span>

          <h1 className="text-2xl font-black text-reader-text tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-reader-muted text-xs mt-1 font-medium">ابدأ رحلتك اليومية ومتابعة القراءة مع أصحابك</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-reader-muted mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-reader-accent" />
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium outline-none focus:border-reader-accent"
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-reader-muted mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-reader-accent" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium outline-none focus:border-reader-accent"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-reader-muted mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-reader-accent" />
              رقم الواتساب (اختياري للتنبيهات)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-mono outline-none focus:border-reader-accent"
              placeholder="+201000000000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-reader-muted mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-reader-accent" />
              كلمة السر
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium outline-none focus:border-reader-accent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 border border-reader-borderStrong disabled:opacity-50 mt-4 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-reader-accentForeground" />
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              'إنشاء الحساب الآن ✨'
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-reader-muted font-medium pt-4 border-t border-reader-border">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-reader-accent hover:underline font-bold transition-colors">
            تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
