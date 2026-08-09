import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Key, Loader2 } from 'lucide-react';
import { createGroup, joinGroup } from '../api/groups';
import { useUIStore } from '../store/uiStore';

export const Onboarding = () => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [fineAmount, setFineAmount] = useState('20');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const setActiveGroupId = useUIStore((state) => state.setActiveGroupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'create') {
        const amount = parseFloat(fineAmount) || 20;
        const group = await createGroup({ name: groupName, fine_amount: amount });
        setActiveGroupId(group.id);
      } else {
        const group = await joinGroup(inviteCode);
        setActiveGroupId(group.id);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء معالجة الطلب. تحقق وحاول مرة أخرى.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-lg p-8 rounded-2xl glass-panel shadow-2xl border border-slate-800">
        <h1 className="text-2xl font-bold text-white text-center mb-6">مرحباً بك في Reading Club 📚</h1>

        <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'create'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            إنشاء مجموعة
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
              mode === 'join'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            الانضمام بكود
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">اسم المجموعة</label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="مثال: نادي القراءة للأصدقاء"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">قيمة الغرامة اليومية (بالجنيه)</label>
                <input
                  type="number"
                  min="0"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="20"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">كود الدعوة (Invite Code)</label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 tracking-wider text-center uppercase font-mono text-lg"
                placeholder="X7K2P9"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg text-white transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'create' ? 'إنشاء المجموعة والبدء' : 'الانضمام للمجموعة'}
          </button>
        </form>
      </div>
    </div>
  );
};
