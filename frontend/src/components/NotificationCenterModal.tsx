import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Phone, X, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { AppNotification, markNotificationRead, updateWhatsAppSettings } from '../api/notifications';
import { useAuthStore } from '../store/authStore';

interface NotificationCenterModalProps {
  notifications: AppNotification[];
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ notifications, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [listRef] = useAutoAnimate();

  const [phone, setPhone] = useState(user?.phone || '');
  const [waEnabled, setWaEnabled] = useState(user?.whatsapp_enabled ?? true);
  const [showSettings, setShowSettings] = useState(false);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () => updateWhatsAppSettings(phone, waEnabled),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setShowSettings(false);
    },
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700/80 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5 font-extrabold text-base text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Bell className="w-4 h-4" />
              </div>
              مركز الإشعارات والتنبيهات
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showSettings ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                الواتساب
              </button>
              <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* WhatsApp Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-obsidian-900 border border-emerald-500/30 space-y-3 shadow-inner"
            >
              <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> ربط رقم الواتساب للتنبيهات اليومية
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">رقم الهاتف (مع كود الدولة)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201000000000"
                  className="w-full p-2.5 bg-apple-bg border border-apple-border rounded-xl text-apple-text text-xs font-mono placeholder:text-apple-muted focus:border-apple-gold outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                <span>تفعيل تذكير 10:00 مساءً عبر الواتساب</span>
                <input
                  type="checkbox"
                  checked={waEnabled}
                  onChange={(e) => setWaEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
              >
                {saveSettingsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'حفظ التغييرات'}
              </button>
            </motion.div>
          )}

          {/* Notifications List */}
          <div ref={listRef} className="space-y-2.5 pt-1">
            {notifications && notifications.length > 0 ? (
              notifications.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`p-3.5 rounded-2xl border transition-all space-y-1.5 ${
                    n.is_read
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-70'
                      : 'bg-gradient-to-r from-emerald-950/30 to-slate-900/60 border-emerald-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      {n.title}
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="p-1 text-xs text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                        title="تم القراءة"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="block text-[10px] text-slate-500 font-mono text-left">{n.created_at}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-slate-600" />
                لا توجد إشعارات جديدة حالياً 🎉
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

