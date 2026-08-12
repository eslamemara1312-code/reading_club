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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notifications-modal-title"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="bg-reader-panel p-6 rounded-3xl max-w-md w-full border border-reader-border shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-reader-border pb-3">
            <h2 id="notifications-modal-title" className="flex items-center gap-2.5 font-extrabold text-base text-reader-text">
              <div className="w-8 h-8 rounded-xl bg-reader-surface border border-reader-borderStrong text-reader-accent flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              مركز الإشعارات والتنبيهات
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`min-h-[44px] px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  showSettings ? 'bg-reader-surface text-reader-accent' : 'text-reader-muted hover:text-reader-accent hover:bg-reader-surface'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                الواتساب
              </button>
              <button onClick={onClose} aria-label="إغلاق مركز الإشعارات" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-reader-muted hover:text-reader-text hover:bg-reader-surface rounded-xl transition-colors">
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
              className="p-4 rounded-2xl bg-reader-surface border border-reader-borderStrong space-y-3 shadow-inner"
            >
              <h4 className="font-bold text-xs text-reader-accent flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> ربط رقم الواتساب للتنبيهات اليومية
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-reader-muted mb-1">رقم الهاتف (مع كود الدولة)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201000000000"
                  className="w-full p-2.5 bg-reader-panel border border-reader-border rounded-xl text-reader-text text-xs font-mono outline-none focus:border-reader-accent"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-reader-muted pt-1">
                <span>تفعيل تذكير 10:00 مساءً عبر الواتساب</span>
                <input
                  type="checkbox"
                  checked={waEnabled}
                  onChange={(e) => setWaEnabled(e.target.checked)}
                  className="w-4 h-4 accent-reader-accent rounded cursor-pointer"
                />
              </div>

              <button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="w-full py-2.5 bg-reader-accent hover:bg-reader-accentHover text-reader-accentForeground text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
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
                      ? 'bg-reader-subdued border-reader-border opacity-75'
                      : 'bg-reader-surface border-reader-borderStrong shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-reader-text flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-reader-accent" />
                      {n.title}
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-reader-accent hover:bg-reader-hover rounded-xl transition-colors"
                        title="تم القراءة"
                        aria-label={`تمييز إشعار ${n.title} كمقروء`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-reader-muted leading-relaxed">{n.message}</p>
                  <span className="block text-[10px] text-reader-subtle font-mono text-left">{n.created_at}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 text-reader-muted text-xs font-semibold flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-reader-accent" />
                لا توجد إشعارات جديدة حالياً 🎉
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
