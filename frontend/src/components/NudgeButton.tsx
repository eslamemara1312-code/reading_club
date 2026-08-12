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
      <span className="text-xs font-medium text-reader-success flex items-center gap-1">
        <CheckCircle size={13} />
        تمت القراءة
      </span>
    );
  }

  if (nudged) {
    return (
      <motion.span 
        initial={{ scale: 0.9 }} 
        animate={{ scale: 1 }} 
        className="text-xs text-reader-metric-goldText font-semibold flex items-center gap-1"
      >
        <BellRing size={13} />
        تم التذكير
      </motion.span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        title={`تذكير ${toUserName} بالقراءة اليوم`}
        className="min-h-[44px] text-xs text-reader-muted hover:text-reader-metric-goldText px-2.5 py-1.5 rounded-xl border border-reader-border hover:border-reader-borderStrong transition-colors flex items-center gap-1.5"
      >
        {mutation.isPending ? (
          <Loader2 size={13} className="animate-spin text-reader-metric-goldText" />
        ) : (
          <BellRing size={13} className="text-reader-metric-goldText" />
        )}
        <span className="text-[11px] font-medium">تذكير</span>
      </motion.button>

      {errorText && (
        <span className="text-[10px] text-reader-danger font-medium" role="alert">{errorText}</span>
      )}
    </div>
  );
}
