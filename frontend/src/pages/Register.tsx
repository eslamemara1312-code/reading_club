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
      navigate('/onboarding');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الحساب. حاول مجدداً.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian-950 relative overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="glow-orb w-96 h-96 bg-teal-500/20 top-1/4 -left-20 animate-pulse-subtle" />
      <div className="glow-orb w-96 h-96 bg-emerald-500/15 bottom-1/4 -right-20 animate-pulse-subtle" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 rounded-3xl glass-panel shadow-2xl border border-slate-800/80 relative z-10 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-glow-emerald mb-3"
          >
            <div className="w-full h-full bg-obsidian-900 rounded-[14px] flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-emerald-400" />
            </div>
          </motion.div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            الانضمام لمجتمع القراءة
          </span>

          <h1 className="text-2xl font-black text-white tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-slate-400 text-xs mt-1">ابدأ رحلتك اليومية ومتابعة قراءتك مع أصحابك</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs font-medium placeholder-slate-500 outline-none"
              placeholder="اسمك الكامل"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs font-medium placeholder-slate-500 outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              رقم الواتساب (اختياري للتنبيهات)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs font-mono placeholder-slate-500 outline-none"
              placeholder="+201000000000"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              كلمة السر
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-white text-xs font-medium placeholder-slate-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 font-extrabold rounded-xl text-white text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : 'إنشاء الحساب الان 🎉'}
          </motion.button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-400 font-medium">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold transition-colors">
            تسجيل الدخول
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

