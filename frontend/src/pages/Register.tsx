import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, User, Mail, Phone, KeyRound, Sparkles } from 'lucide-react';
import { registerUser } from '../api/auth';
import { useAuthStore } from '../store/authStore';

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-apple-bg relative text-apple-text dir-rtl font-sans transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-apple-surface shadow-2xl border border-apple-border relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-apple-card border border-apple-gold/30 flex items-center justify-center mb-3 text-apple-gold shadow-sm">
            <UserPlus className="w-6 h-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-apple-gold px-3 py-1 rounded-full bg-apple-gold/10 border border-apple-gold/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            الانضمام لمجتمع القراء
          </span>

          <h1 className="text-2xl font-black text-apple-text tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-apple-muted text-xs mt-1 font-medium">ابدأ رحلتك اليومية ومتابعة القراءة مع أصحابك</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-apple-red/15 border border-apple-red/30 text-apple-red text-xs font-bold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-apple-gold" />
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apple-bg border border-apple-border text-apple-text text-xs font-medium placeholder-apple-muted outline-none focus:border-apple-gold"
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-apple-gold" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apple-bg border border-apple-border text-apple-text text-xs font-medium placeholder-apple-muted outline-none focus:border-apple-gold"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-apple-gold" />
              رقم الواتساب (اختياري للتنبيهات)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apple-bg border border-apple-border text-apple-text text-xs font-mono placeholder-apple-muted outline-none focus:border-apple-gold"
              placeholder="+201000000000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-apple-gold" />
              كلمة السر
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-apple-bg border border-apple-border text-apple-text text-xs font-medium placeholder-apple-muted outline-none focus:border-apple-gold"
              placeholder="••••••••"
            />
          </div>

          {/* SINGLE SOLID ACCENT FILL BUTTON ON THIS PAGE */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-apple-gold hover:opacity-90 text-black font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-apple-gold/40 disabled:opacity-50 mt-4 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>جاري إنشاء الحساب...</span>
              </>
            ) : (
              'إنشاء الحساب الآن ✨'
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-apple-muted font-medium pt-4 border-t border-apple-border">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-apple-gold hover:underline font-bold transition-colors">
            تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
