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
      <span className="text-xs font-medium text-[#7C9A72] flex items-center gap-1">
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
        className="text-xs text-[#D9A441] font-semibold flex items-center gap-1"
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
        className="text-xs text-[#B8B0A4] hover:text-[#D9A441] p-1.5 rounded-lg border border-white/[0.08] hover:border-[#D9A441]/30 transition-colors flex items-center gap-1.5"
      >
        {mutation.isPending ? (
          <Loader2 size={13} className="animate-spin text-[#D9A441]" />
        ) : (
          <BellRing size={13} className="text-[#D9A441]" />
        )}
        <span className="text-[11px] font-medium">تذكير</span>
      </motion.button>

      {errorText && (
        <span className="text-[10px] text-[#B96860] font-medium">{errorText}</span>
      )}
    </div>
  );
}
