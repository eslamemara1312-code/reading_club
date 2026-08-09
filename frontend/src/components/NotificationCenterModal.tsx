import React, { useState } from 'react';
import { Bell, Check, Phone, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <Bell className="w-5 h-5 text-emerald-400" />
            مركز الإشعارات والتنبيهات
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Phone className="w-4 h-4" />
              إعدادات الواتساب
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Settings Panel */}
        {showSettings && (
          <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-3">
            <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Phone className="w-4 h-4" /> ربط رقم الواتساب للتنبيهات
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">رقم الهاتف (مع كود الدولة)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+201000000000"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
              <span>تفعيل تذكير 10:00 مساءً عبر الواتساب</span>
              <input
                type="checkbox"
                checked={waEnabled}
                onChange={(e) => setWaEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            <button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              {saveSettingsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'حفظ الإعدادات'}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-2.5 pt-2">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-all space-y-1 ${
                  n.is_read
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-70'
                    : 'bg-emerald-500/10 border-emerald-500/30'
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
                      className="p-1 text-xs text-emerald-400 hover:bg-emerald-500/20 rounded"
                      title="تم القراءة"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-300">{n.message}</p>
                <span className="block text-[10px] text-slate-500 font-mono text-left">{n.created_at}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              لا توجد إشعارات حالية 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
