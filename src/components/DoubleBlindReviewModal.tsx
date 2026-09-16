// Đánh Giá Hai Chiều Mù (Double-Blind Review Modal)
// Khách và thợ chỉ thấy đánh giá của nhau sau khi cả hai bên đều đã hoàn thành chấm sao (Chống trả thù đánh giá xấu)
import React, { useState } from 'react';
import { Star, Shield, Lock, EyeOff, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { GigEntity } from '../types';

interface DoubleBlindReviewModalProps {
  isOpen: boolean;
  gig: GigEntity;
  onClose: () => void;
  role: 'CLIENT' | 'FREELANCER';
}

export const DoubleBlindReviewModal: React.FC<DoubleBlindReviewModalProps> = ({
  isOpen,
  gig,
  onClose,
  role,
}) => {
  const { submitDoubleBlindReview } = useGigMe();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isClient = role === 'CLIENT';
  const targetName = isClient ? gig.freelancerName || 'Freelancer' : gig.clientName;
  const otherPartyAlreadyRated = isClient ? !!gig.freelancerRatedAt : !!gig.clientRatedAt;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    submitDoubleBlindReview(
      gig.id,
      rating,
      reviewText.trim() || (rating >= 4 ? 'Làm việc rất uy tín, đúng giờ và nhiệt tình!' : 'Cần cải thiện chất lượng công việc.'),
      role
    );
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F172A] border-2 border-indigo-500/40 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(99,102,241,0.25)] relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-black text-base text-white">Đánh Giá Hai Chiều Mù</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                Double-Blind
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Đánh giá bí mật cho: <span className="text-cyan-300 font-bold">{targetName}</span>
            </p>
          </div>
        </div>

        {/* Explainer card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/25 text-xs text-slate-300 space-y-2">
          <div className="flex items-start space-x-2">
            <EyeOff className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              <strong>Cơ chế Chống Trả Thù Đánh Giá Xấu:</strong> {targetName} sẽ <strong>hoàn toàn không thể xem</strong> số sao và lời nhận xét của bạn cho đến khi họ cũng hoàn tất đánh giá về bạn!
            </p>
          </div>
          {otherPartyAlreadyRated ? (
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Đối phương đã hoàn tất phần đánh giá của họ! Khi bạn bấm gửi, toàn bộ kết quả sẽ được mở khóa công khai ngay lập tức.</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] flex items-center space-x-1.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Đối phương chưa gửi đánh giá. Lời nhận xét của bạn sẽ được niêm phong cho đến khi họ gửi xong.</span>
            </div>
          )}
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Star selector */}
          <div className="text-center py-2 bg-slate-900/60 rounded-2xl border border-slate-800">
            <label className="block text-xs text-slate-400 mb-2 font-bold">
              Chấm Điểm Tín Nhiệm & Chất Lượng (1 - 5 Sao)
            </label>
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-black text-amber-300 mt-1 block">
              {rating === 5 && '🌟 Hoàn hảo & Vượt kỳ vọng (5/5)'}
              {rating === 4 && '👍 Rất tốt & Chuyên nghiệp (4/5)'}
              {rating === 3 && '👌 Đạt yêu cầu cơ bản (3/5)'}
              {rating === 2 && '⚠️ Còn nhiều thiếu sót (2/5)'}
              {rating === 1 && '❌ Kém & Không đúng cam kết (1/5)'}
            </span>
          </div>

          {/* Comment text */}
          <div>
            <label className="block text-xs text-slate-300 mb-1 font-semibold">
              Nhận xét chi tiết (Được giữ bí mật hai chiều)
            </label>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Chia sẻ trải nghiệm làm việc, thái độ và mức độ hoàn thành công việc..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#131E30] border border-slate-700 text-white text-xs focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            <Lock className="w-4 h-4" />
            <span>Gửi Đánh Giá Niêm Phong Hai Chiều &rarr;</span>
          </button>
        </form>
      </div>
    </div>
  );
};
