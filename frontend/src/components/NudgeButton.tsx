import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCircle, Loader2 } from 'lucide-react';
import { sendNudge } from '../api/stats';

interface NudgeButtonProps {
  groupId: string;
  toUserId: string;
  toUserName: string;
  hasCheckedIn?: boolean;
}

export function NudgeButton({ groupId, toUserId, toUserName, hasCheckedIn }: NudgeButtonProps) {
  const queryClient = useQueryClient();
  const [nudged, setNudged] = useState(false);
  const [errorText, setErrorText] = useState('');

  const mutation = useMutation({
    mutationFn: () => sendNudge(groupId, toUserId),
    onSuccess: () => {
      setNudged(true);
      setErrorText('');
      queryClient.invalidateQueries({ queryKey: ['todayStatus', groupId] });
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.detail || 'تعذر إرسال التنبيه');
    },
  });

  if (hasCheckedIn) {
    return (
      <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
        <CheckCircle size={12} />
        سجّل قراءته
      </span>
    );
  }

  if (nudged) {
    return (
      <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
        تم النكز 🔔
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        title={`أنكز ${toUserName} لتذكيره بالقراءة اليوم`}
        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition shadow-sm"
      >
        {mutation.isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <BellRing size={12} />
        )}
        <span>أنكز المنقذ 🦸</span>
      </button>

      {errorText && (
        <span className="text-[10px] text-red-400 mt-1">{errorText}</span>
      )}
    </div>
  );
}
