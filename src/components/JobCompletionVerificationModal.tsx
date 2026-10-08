import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Heart,
  Lock,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GigEntity, formatVnd } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';

interface JobCompletionVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gig: GigEntity;
  onConfirmVerification: (tipAmount: number, feedbackNote?: string) => Promise<boolean> | boolean;
}

export const JobCompletionVerificationModal: React.FC<JobCompletionVerificationModalProps> = ({
  isOpen,
  onClose,
  gig,
  onConfirmVerification,
}) => {
  const { language } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [checkedTerms, setCheckedTerms] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!checkedTerms) return;
    setIsConfirming(true);
    triggerHaptic('escrow');
    try {
      const ok = await onConfirmVerification(tipAmount, feedbackNote.trim());
      if (ok) {
        onClose();
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const totalPayout = gig.price + tipAmount;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isConfirming) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in text-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#0E1B2E] border-2 border-emerald-500/50 p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[92vh] flex flex-col relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-[#3064AE]" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#C5E5EC]/15 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {language === 'vi'
                    ? 'Nghiệm Thu Công Việc & Giải Ngân'
                    : 'Verify Deliverables & Release Payout'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                  {language === 'vi' ? 'BƯỚC XÁC NHẬN' : 'VERIFICATION'}
                </span>
              </div>
              <p className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                {language === 'vi'
                  ? 'Xác nhận công việc đã hoàn thành để chuyển tiền bảo chứng từ Smart Escrow vào ví sinh viên.'
                  : 'Confirm deliverables to trigger immediate escrow payment release to the assigned student.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isConfirming) onClose();
            }}
            disabled={isConfirming}
            className="p-1.5 rounded-xl bg-[#12233B] hover:bg-[#162D4A] text-[#C5E5EC] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {/* Gig Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs truncate">{gig.title}</span>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {formatVnd(gig.price)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#C5E5EC]/80">
              <span>
                {language === 'vi' ? 'Sinh viên thực hiện:' : 'Assigned student:'}{' '}
                <strong className="text-white">{gig.freelancerName || (language === 'vi' ? 'Sinh viên GigMe' : 'Student')}</strong>
              </span>
              {gig.completedAt && (
                <span>
                  • {new Date(gig.completedAt).toLocaleTimeString('vi-VN')} {new Date(gig.completedAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {/* Deliverables Proof Preview */}
          <div className="p-3.5 rounded-2xl bg-[#08121E] border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{language === 'vi' ? 'Bằng Chứng Bàn Giao Thợ Đã Nộp' : 'Submitted Proof Deliverables'}</span>
              </span>
              {gig.proofTimestamp && (
                <span className="text-[10px] text-[#C5E5EC]/70 font-mono">
                  {new Date(gig.proofTimestamp).toLocaleTimeString('vi-VN')} {new Date(gig.proofTimestamp).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>

            {gig.proofNote && (
              <p className="text-xs text-slate-200 bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                "{gig.proofNote}"
              </p>
            )}

            {gig.proofImageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#C5E5EC]/30 bg-black max-h-52 flex items-center justify-center">
                <img
                  src={gig.proofImageUrl}
                  alt="Proof of work"
                  className="max-h-52 w-auto object-contain"
                />
                {gig.proofGpsCoords && (
                  <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>GPS: {gig.proofGpsCoords.lat.toFixed(4)}°N, {gig.proofGpsCoords.lng.toFixed(4)}°E</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#12233B]/60 text-slate-400 text-center text-xs">
                {language === 'vi' ? 'Bàn giao trực tiếp tại chỗ (Không đính kèm ảnh)' : 'Direct in-person handover'}
              </div>
            )}
          </div>

          {/* Optional Tip Rewards */}
          <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
                <span>{language === 'vi' ? 'Thưởng thêm khích lệ (Tip cho sinh viên)' : 'Optional Appreciation Tip'}</span>
              </span>
              {tipAmount > 0 && (
                <span className="text-xs font-mono font-black text-rose-300">
                  +{formatVnd(tipAmount)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 10000, 20000, 50000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTipAmount(amount)}
                  className={`py-1.5 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    tipAmount === amount
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                      : 'bg-[#0E1B2E] text-[#C5E5EC] hover:bg-[#162D4A] border-[#C5E5EC]/20'
                  }`}
                >
                  {amount === 0 ? (language === 'vi' ? '0đ' : 'None') : `+${amount / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Verification terms agreement */}
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={checkedTerms}
                onChange={(e) => setCheckedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
              />
              <span className="text-[11px] text-[#C5E5EC] leading-relaxed">
                {language === 'vi' ? (
                  <>
                    Tôi xác nhận sinh viên đã <strong>hoàn thành đầy đủ công việc</strong> theo đúng thỏa thuận. Khi tôi bấm xác nhận, thù lao <strong>{formatVnd(totalPayout)}</strong> sẽ được giải ngân ngay lập tức từ quỹ Smart Escrow vào ví của sinh viên.
                  </>
                ) : (
                  <>
                    I confirm that the student has <strong>satisfactorily finished the task</strong>. Upon clicking confirm, <strong>{formatVnd(totalPayout)}</strong> will be disbursed immediately from the Smart Escrow vault to the student.
                  </>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#C5E5EC]/15 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="w-1/3 py-3 rounded-2xl bg-[#12233B] hover:bg-[#162D4A] text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
          >
            {language === 'vi' ? 'Xem lại sau' : 'Review Later'}
          </button>

          <button
            type="button"
            id="confirm-verification-release-btn"
            disabled={!checkedTerms || isConfirming}
            onClick={handleConfirm}
            className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#3064AE] hover:from-emerald-500 hover:to-[#417AC6] text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-emerald-400/50"
          >
            {isConfirming ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            )}
            <span>
              {isConfirming
                ? (language === 'vi' ? 'Đang giải ngân Firestore...' : 'Releasing Payout...')
                : language === 'vi'
                ? `Xác Nhận Đã Xong & Giải Ngân (${formatVnd(totalPayout)})`
                : `Confirm Finished & Release (${formatVnd(totalPayout)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
