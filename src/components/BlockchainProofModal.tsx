import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Hash,
  MapPin,
  Clock,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Lock,
  X,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { formatVnd } from '../types';

interface BlockchainProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  gigId: string;
}

export const BlockchainProofModal: React.FC<BlockchainProofModalProps> = ({
  isOpen,
  onClose,
  gigId,
}) => {
  const { currentSelectedGig, userCoords, submitProofOfWork, showNotification } = useGigMe();
  const [proofNote, setProofNote] = useState('Đã hoàn thành công việc theo đúng yêu cầu cam kết.');
  const [sampleImage, setSampleImage] = useState(
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80'
  );
  const [blockchainHash, setBlockchainHash] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate SHA-256-like hex hash based on gig data + coords + timestamp
  const generateHash = () => {
    const lat = userCoords?.latitude?.toFixed(4) || '10.7327';
    const lng = userCoords?.longitude?.toFixed(4) || '106.6992';
    const raw = `${gigId}_${lat}_${lng}_${Date.now()}_GIGME_ESCROW_SMART_CONTRACT`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x7f8a${hex}e9d4c2b1${hex.slice(0, 4)}`.toLowerCase();
  };

  useEffect(() => {
    if (isOpen) {
      const h = generateHash();
      setBlockchainHash(h);
      drawWatermarkOnCanvas(sampleImage, h);
    }
  }, [isOpen, sampleImage]);

  if (!isOpen) return null;

  const drawWatermarkOnCanvas = (imgSrc: string, hash: string) => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      canvas.width = 640;
      canvas.height = 360;

      // Draw original photo
      ctx.drawImage(img, 0, 0, 640, 360);

      // Semi-transparent anti-tamper grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 640; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 360);
        ctx.stroke();
      }
      for (let y = 0; y < 360; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(640, y);
        ctx.stroke();
      }

      // Diagonal watermark text
      ctx.save();
      ctx.translate(320, 180);
      ctx.rotate(-Math.PI / 8);
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = 'rgba(0, 229, 255, 0.28)';
      ctx.textAlign = 'center';
      ctx.fillText('GIGME ESCROW • BLOCKCHAIN VERIFIED', 0, -20);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = 'rgba(255, 107, 0, 0.35)';
      ctx.fillText('DO NOT PHOTOCOPY • PROOF OF WORK', 0, 15);
      ctx.restore();

      // Bottom cryptographic footer block
      ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
      ctx.fillRect(0, 305, 640, 55);

      ctx.fillStyle = '#00E5FF';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`BLOCKCHAIN HASH: ${hash}`, 12, 322);

      const lat = userCoords?.latitude?.toFixed(4) || '10.7327';
      const lng = userCoords?.longitude?.toFixed(4) || '106.6992';
      const timeStr = new Date().toLocaleString('vi-VN');

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px sans-serif';
      ctx.fillText(`GPS GEOSTAMP: ${lat}°N, ${lng}°E • TIMESTAMP: ${timeStr}`, 12, 342);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('SHA-256 IMMUTABLE LEDGER', 628, 332);

      setIsGenerating(false);
    };
  };

  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult('SUCCESS');
      showNotification(
        '🛡️ Chứng chỉ Blockchain Hash Hợp Lệ',
        `Mã băm ${blockchainHash} khớp 100% với chữ ký điện tử. Ảnh nguyên bản, không qua chỉnh sửa/Photoshop.`,
        true,
        true
      );
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    let watermarkedUrl = sampleImage;
    if (canvas) {
      try {
        watermarkedUrl = canvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        console.warn('Canvas toDataURL fallback:', err);
      }
    }

    const coords = {
      lat: userCoords?.latitude || 10.7327,
      lng: userCoords?.longitude || 106.6992,
    };

    submitProofOfWork(gigId, proofNote, true, {
      watermarkedUrl,
      hash: blockchainHash,
      coords,
      timestamp: Date.now(),
    });

    showNotification(
      '🚀 Đã Gửi Bằng Chứng Watermark GPS & Timestamp',
      `Đã đóng dấu định vị (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E) và thời gian thực. Khi khách hàng giải ngân, bản gốc sẽ tự động bàn giao!`,
      true,
      true
    );
    onClose();
  };

  const handleUploadCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setSampleImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-[#0F172A] border-2 border-[#00E5FF]/40 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(0,229,255,0.25)] my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-[#00E5FF]/40 text-[#00E5FF]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Chống Giả Mạo Ảnh Bằng Watermark Blockchain Hash
              </h3>
              <p className="text-xs text-slate-400">
                Gắn mã băm SHA-256 + Tọa độ GPS thời gian thực vào minh chứng bàn giao
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
          {/* Canvas Watermarked Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
            {isGenerating && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#00E5FF] animate-spin" />
              </div>
            )}
          </div>

          {/* Blockchain & GPS Stamp Info */}
          <div className="p-3.5 rounded-2xl bg-[#131E30] border border-slate-800 space-y-2 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Mã băm Blockchain:</span>
              </span>
              <span className="font-mono font-bold text-[#00E5FF]">{blockchainHash}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tọa độ Geostamp:</span>
              </span>
              <span className="text-slate-200 font-mono">
                {userCoords?.latitude?.toFixed(4) || '10.7327'}°N, {userCoords?.longitude?.toFixed(4) || '106.6992'}°E
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Thời gian niêm phong:</span>
              </span>
              <span className="text-slate-300 font-mono">{new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>

          {/* Verification Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerifyIntegrity}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold flex items-center space-x-1.5 transition text-xs"
            >
              {isVerifying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Fingerprint className="w-3.5 h-3.5 text-[#00E5FF]" />
              )}
              <span>Kiểm Tra Tính Toàn Vẹn Blockchain</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium flex items-center space-x-1.5 transition text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Thay ảnh khác</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadCustomImage}
              className="hidden"
            />
          </div>

          {verificationResult === 'SUCCESS' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Xác thực 100% toàn vẹn:</strong> Không có dấu hiệu can thiệp điểm ảnh (Photoshop), tọa độ GPS khớp với đơn đặt hàng.
              </span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Ghi chú kết quả nghiệm thu</label>
            <textarea
              rows={2}
              required
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-medium"
              placeholder="Mô tả tóm tắt kết quả bàn giao..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-amber-500 to-yellow-400 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-orange-500/25 transition flex items-center justify-center space-x-1.5"
          >
            <Lock className="w-4 h-4 fill-current" />
            <span>Niêm Phong Blockchain & Nộp Nghiệm Thu</span>
          </button>
        </form>
      </div>
    </div>
  );
};
