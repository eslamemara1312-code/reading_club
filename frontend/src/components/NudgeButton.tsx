import { useState } from 'react';
import { motion } from 'framer-motion';
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
      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-sm">
        <CheckCircle size={12} />
        أتم القراءة اليوم
      </span>
    );
  }

  if (nudged) {
    return (
      <motion.span 
        initial={{ scale: 0.9 }} 
        animate={{ scale: 1 }} 
        className="text-xs text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 font-bold shadow-sm flex items-center gap-1"
      >
        تم النكز 🔔
      </motion.span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        title={`تذكير ${toUserName} بالقراءة اليوم`}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-flame-500/20 hover:from-amber-500/30 hover:to-flame-500/30 text-amber-300 border border-amber-500/30 transition shadow-sm"
      >
        {mutation.isPending ? (
          <Loader2 size={13} className="animate-spin text-amber-400" />
        ) : (
          <BellRing size={13} className="text-amber-400 animate-bounce" />
        )}
        <span>أنكز الآن 🔔</span>
      </motion.button>

      {errorText && (
        <span className="text-[10px] text-rose-400 mt-1 font-medium">{errorText}</span>
      )}
    </div>
  );
}

