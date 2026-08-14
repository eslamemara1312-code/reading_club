import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Loader2, KeyRound, Mail, Sparkles } from 'lucide-react';
import { loginUser } from '../api/auth';
import { getMyGroups } from '../api/groups';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { ThemeToggle } from '../components/layout/ThemeToggle';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setActiveGroupId = useUIStore((state) => state.setActiveGroupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginUser({ email, password });
      setAuth(res.user, res.access_token, res.refresh_token);

      try {
        const groups = await getMyGroups();
        if (groups && groups.length > 0) {
          setActiveGroupId(groups[0].id);
        } else {
          setActiveGroupId(null);
        }
        navigate('/dashboard');
      } catch {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول. تحقق من البيانات وحاول مجدداً.';
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
          <div className="w-14 h-14 rounded-2xl bg-reader-surface border border-reader-borderStrong flex items-center justify-center mb-3 text-reader-accent shadow-sm">
            <BookOpen className="w-7 h-7 text-reader-accent" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-reader-accent px-3 py-1 rounded-full bg-reader-accentSoft border border-reader-borderStrong mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            نادي القراءة
          </span>

          <h1 className="text-2xl font-black text-reader-text tracking-tight">تسجيل الدخول</h1>
          <p className="text-reader-muted text-xs mt-1 font-medium">متابعة التزامك وتحديات القراءة اليومية</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-reader-muted mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-reader-accent" />
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium focus:border-reader-accent outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-reader-muted mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-reader-accent" />
              كلمة السر
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-reader-surface border border-reader-border text-reader-text text-xs font-medium focus:border-reader-accent outline-none"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground font-black text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 border border-reader-borderStrong disabled:opacity-50 mt-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-reader-accentForeground" />
                جاري التحقق...
              </>
            ) : (
              'دخول النادي'
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-5 border-t border-reader-border text-center text-xs text-reader-muted font-medium">
          ليس لديك حساب بعد؟{' '}
          <Link to="/register" className="text-reader-accent font-bold hover:underline">
            إنشاء حساب جديد
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
