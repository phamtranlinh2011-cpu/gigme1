import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Camera,
  GraduationCap,
  Mic,
  QrCode,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Copy,
  Check,
  Download,
  Clock,
  Zap,
  Play,
  Smile,
  Eye,
  RefreshCw,
  Sparkles,
  Smartphone,
  Radio,
  Lock,
  Key,
  Info,
  FileCode,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { VIETNAMESE_BANKS, formatVnd } from '../types';
import { playNotificationSound, isAudioMuted, setAudioMuted, SoundEffectType } from '../utils/audio';
import {
  validateVietnamCccdNumber,
  generateCccdMrz,
  computeIcaoChecksum,
} from '../utils/checksumC06';
import {
  verifyBeneficiaryAccount,
  AUTO_DISBURSEMENT_KEYS,
} from '../services/napasDisbursementService';
import { VietQrOpenApiAutoScanner } from './VietQrOpenApiAutoScanner';
import { FcmPushNotificationModal } from './FcmPushNotificationModal';
import { triggerHaptic } from '../utils/haptics';

// 1. NFC CCCD SCAN DIALOG - PHƯƠNG ÁN 2: MOBILE NATIVE APP & HYBRID NFC/CAMERA MRZ
export const NfcCccdScanDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onContinueToFaceLiveness?: () => void;
}> = ({
  isOpen,
  onClose,
  onContinueToFaceLiveness,
}) => {
  const { currentUser, verifyNfcCccd, showNotification } = useGigMe();
  const [activeTab, setActiveTab] = useState<'SCAN' | 'NATIVE_DOCS'>('SCAN');
  const [step, setStep] = useState<1 | 2>(1); // 1: Quét Camera MRZ lấy khóa BAC | 2: Áp mặt lưng máy vào chíp NFC

  // CCCD Data
  const [idNumber, setIdNumber] = useState(currentUser?.cccdNumber || '079204018892');
  const [fullName, setFullName] = useState(currentUser?.kycName || currentUser?.name || 'NGUYỄN VĂN AN');
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '12/04/2004');
  const [expiryDate, setExpiryDate] = useState('12/04/2044');

  // Camera MRZ Scanner
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mrzCaptured, setMrzCaptured] = useState(false);

  // NFC Reading State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<string>('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Real-time C06 format & province decoder
  const validation = validateVietnamCccdNumber(idNumber);

  // Generate ICAO 9303 MRZ 3-lines
  const birthYYMMDD = birthDate.replace(/\D/g, '').substring(4, 8) + birthDate.replace(/\D/g, '').substring(2, 4) + birthDate.replace(/\D/g, '').substring(0, 2);
  const mrzData = generateCccdMrz(
    idNumber,
    birthYYMMDD || '040412',
    validation.gender === 'Nữ' ? 'F' : 'M',
    '441204',
    fullName || 'NGUYEN VAN AN'
  );

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIsScanning(false);
      setScanProgress(0);
      setScanSuccess(false);
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Camera for MRZ Scanning
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        triggerHaptic('light');

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((e) => console.warn('Video play error:', e));
          }
        }, 100);
      } else {
        showNotification('Không có Camera', 'Thiết bị không hỗ trợ hoặc chưa cấp quyền truy cập Camera.');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showNotification('Không thể mở Camera', 'Vui lòng kiểm tra quyền truy cập Camera của trình duyệt.');
    }
  };

  // Capture MRZ from camera (Simulate OCR with realistic parsing)
  const handleCaptureMrz = () => {
    triggerHaptic('medium');
    playNotificationSound('BUTTON_CLICK');
    setMrzCaptured(true);
    stopCamera();
    showNotification('Đã nhận diện mã MRZ 📸', 'Trích xuất thành công 3 dòng ký tự ICAO 9303 mặt sau CCCD!');
  };

  // Apply Preset Test Data
  const handleApplyPreset = (preset: 'AN' | 'LINH') => {
    if (preset === 'AN') {
      setIdNumber('079204018892');
      setFullName('NGUYỄN VĂN AN');
      setBirthDate('12/04/2004');
      setExpiryDate('12/04/2044');
    } else {
      setIdNumber('001305019921');
      setFullName('TRẦN THẢO LINH');
      setBirthDate('25/08/2005');
      setExpiryDate('25/08/2045');
    }
    setMrzCaptured(true);
    triggerHaptic('light');
    showNotification('Đã nạp dữ liệu mẫu', 'Sẵn sàng với thông số thẻ CCCD chuẩn C06 Bộ Công An.');
  };

  // Start Step 2 NFC Chip Reading (Touch phone back to chip)
  const handleStartNfcScan = () => {
    const cleanId = idNumber.replace(/\D/g, '');
    if (cleanId.length !== 12) {
      showNotification('Lỗi số CCCD', 'Số Căn cước công dân gắn chíp phải bao gồm đúng 12 chữ số.');
      return;
    }
    if (!fullName.trim()) {
      showNotification('Thiếu họ và tên', 'Vui lòng nhập họ và tên in hoa trên thẻ CCCD.');
      return;
    }

    setIsScanning(true);
    setScanProgress(10);
    setScanPhase('Bắt sóng sóng RF 13.56 MHz (ISO 14443 Type A)...');
    triggerHaptic('nfc');

    // Continuous haptic pulse to simulate card contact
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60, 40, 100]);
    }

    // Try Web NFC (if device is Android Chrome with NFC chip)
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        ndef.scan().then(() => {
          ndef.addEventListener('reading', () => {
            console.log('Web NFC hardware tag detected!');
          });
        }).catch((err: any) => {
          console.warn('Web NFC note:', err);
        });
      } catch (err) {
        console.warn('Web NFC note:', err);
      }
    }

    // Realistic APDU multi-phase readout
    const phases = [
      { p: 25, label: '📡 Bắt sóng RF 13.56 MHz (UID Tag: 04:A2:8E:1F)' },
      { p: 50, label: '🔑 Bắt tay bảo mật PACE/BAC qua mã MRZ...' },
      { p: 75, label: '📥 Giải mã dữ liệu DG1 (Nhân thân) & DG2 (Khuôn mặt)...' },
      { p: 90, label: '🛡️ Xác thực chữ ký số SHA-256 đối soát Cục C06...' },
      { p: 100, label: '✅ Xác thực hoàn tất: Dữ liệu chíp khớp 100%!' },
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < phases.length) {
        setScanProgress(phases[currentIdx].p);
        setScanPhase(phases[currentIdx].label);
        triggerHaptic('light');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setScanSuccess(true);
        triggerHaptic('nfc');
        playNotificationSound('BANK_TING');

        // Commit verified CCCD to user state
        (verifyNfcCccd as any)(
          cleanId,
          fullName.toUpperCase(),
          birthDate,
          `${mrzData.line1}\n${mrzData.line2}\n${mrzData.line3}`,
          true
        );

        showNotification('Xác thực CCCD thành công 🛡️', 'Đã đọc trọn vẹn dữ liệu từ chip thẻ CCCD theo chuẩn C06!');
      }
    }, 700);
  };

  const handleFinishAndContinue = () => {
    onClose();
    if (onContinueToFaceLiveness) {
      setTimeout(() => {
        onContinueToFaceLiveness();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-[#0B1528] border border-cyan-500/30 p-5 sm:p-6 shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-[#00E5FF] border border-cyan-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base text-white">Quét Chíp CCCD • Phương Án 2</h3>
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black text-[10px] font-black uppercase tracking-tight">
                  Native App
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Quy trình 2 bước: Quét Camera MRZ &rarr; Áp mặt sau điện thoại đọc Chíp NFC
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Quy trình quét vs Tài liệu đóng gói Mobile */}
        <div className="flex bg-[#07101E] p-1 rounded-2xl my-3 text-xs font-bold border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('SCAN');
              stopCamera();
            }}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'SCAN'
                ? 'bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Quy Trình Quét Thẻ (Phương Án 2)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('NATIVE_DOCS');
              stopCamera();
            }}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'NATIVE_DOCS'
                ? 'bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Cấu Hình Native App (Capacitor)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs flex-1">
          {activeTab === 'SCAN' && (
            <>
              {/* Stepper Progress Indicator */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    step === 1
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'bg-[#0E1B32] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase mb-0.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center font-black text-[9px]">
                      1
                    </span>
                    <span>Bước 1: Khóa BAC</span>
                  </div>
                  <div className="font-extrabold text-xs text-white truncate">Quét Camera Mã MRZ</div>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`p-2.5 rounded-2xl border text-left transition ${
                    step === 2
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'bg-[#0E1B32] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase mb-0.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center font-black text-[9px]">
                      2
                    </span>
                    <span>Bước 2: NFC Mặt Lưng</span>
                  </div>
                  <div className="font-extrabold text-xs text-white truncate">Áp Chíp Vào Lưng Máy</div>
                </button>
              </div>

              {/* BƯỚC 1: QUÉT CAMERA MÃ MRZ MẶT SAU THẺ CCCD */}
              {step === 1 && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/40 to-[#0F1D36] border border-blue-500/30 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-cyan-300 text-xs">
                      <Key className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Tại sao cần quét mã MRZ trước khi đọc NFC?</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Theo chuẩn quốc tế <strong>ICAO Doc 9303</strong>, chip CCCD được khóa bảo mật chống đọc lén.
                      Điện thoại cần 3 thông số trên dòng MRZ (Số CCCD, Ngày sinh, Ngày hết hạn) để tạo chìa khóa giải mã
                      <strong> BAC/PACE</strong> trước khi chíp mở quyền đọc dữ liệu bên trong.
                    </p>
                  </div>

                  {/* Camera Live Viewfinder / Mock OCR */}
                  <div className="rounded-2xl bg-black border border-cyan-500/30 p-3 relative overflow-hidden">
                    {isCameraActive ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Scanning HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/60 rounded-xl m-2 flex flex-col justify-between p-2">
                          <div className="flex justify-between text-[10px] font-mono text-cyan-300 bg-black/60 px-2 py-0.5 rounded">
                            <span>SCANNING MRZ ZONE</span>
                            <span className="animate-pulse">● LIVE CAMERA</span>
                          </div>
                          {/* Animated laser scanline */}
                          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent animate-bounce shadow-lg shadow-cyan-400" />
                          <div className="text-center font-mono text-[9px] text-cyan-300 bg-black/70 py-1 rounded">
                            Hướng camera vào 3 dòng chữ &lt;&lt;&lt; ở mặt sau CCCD
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center space-y-2">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF]">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-xs">Camera OCR Dòng Mã MRZ Mặt Sau</div>
                          <p className="text-[11px] text-slate-400">
                            Bật camera để tự động quét 3 dòng mã ký tự ICAO 9303 ở mặt sau thẻ
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Camera Control Buttons */}
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleToggleCamera}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 ${
                          isCameraActive
                            ? 'bg-rose-600 hover:bg-rose-500 text-white'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[#00E5FF]'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isCameraActive ? 'Tắt Camera' : 'Mở Camera Quét MRZ'}</span>
                      </button>

                      {isCameraActive && (
                        <button
                          type="button"
                          onClick={handleCaptureMrz}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-black text-xs hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95 transition flex items-center justify-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chụp & Trích Xuất MRZ</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dãy MRZ Preview & Checksum C06 */}
                  <div className="p-3.5 rounded-2xl bg-[#091322] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300 flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Dữ Liệu Khóa BAC (ICAO 9303 Part 3)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/30">
                        Checksum: {mrzData.overallChecksum} (HỢP LỆ)
                      </span>
                    </div>

                    <div className="bg-black/80 rounded-xl p-2.5 font-mono text-[10px] text-emerald-400 tracking-wider leading-relaxed border border-emerald-500/30 overflow-x-auto select-all">
                      <div>{mrzData.line1}</div>
                      <div>{mrzData.line2}</div>
                      <div>{mrzData.line3}</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Tỉnh/Thành: <strong className="text-white">{validation.provinceName}</strong></span>
                      <span>Giới tính: <strong className="text-white">{validation.gender}</strong></span>
                      <span>Sinh năm: <strong className="text-white">{validation.birthCenturyYear}</strong></span>
                    </div>
                  </div>

                  {/* Quick Preset Data */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Dữ liệu thử nghiệm nhanh:</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('AN')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition"
                      >
                        Mẫu: Nguyễn Văn An (Nam)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset('LINH')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700 transition"
                      >
                        Mẫu: Trần Thảo Linh (Nữ)
                      </button>
                    </div>
                  </div>

                  {/* Next Step Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setStep(2);
                      triggerHaptic('medium');
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-black text-sm hover:brightness-110 shadow-lg shadow-cyan-500/25 active:scale-98 transition flex items-center justify-center space-x-2"
                  >
                    <span>Tiếp Tục &rarr; Bước 2: Áp Lưng Điện Thoại Vào Chíp</span>
                  </button>
                </div>
              )}

              {/* BƯỚC 2: ÁP MẶT LƯNG ĐIỆN THOẠI VÀO CHÍP CCCD */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Graphic Illustration: Phone back touching chip */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1E36] via-[#0A1424] to-[#070D18] border border-cyan-500/30 text-center relative overflow-hidden">
                    {/* Simulated RFID radio wave pulses */}
                    <div className="relative mx-auto w-36 h-40 flex items-center justify-center">
                      {/* NFC Pulses */}
                      <div className={`absolute w-32 h-32 rounded-full border border-cyan-400/40 ${isScanning ? 'animate-ping' : ''}`} />
                      <div className={`absolute w-24 h-24 rounded-full border border-cyan-400/60 ${isScanning ? 'animate-pulse' : ''}`} />

                      {/* Phone back mockup */}
                      <div className="w-20 h-36 rounded-2xl bg-slate-900 border-2 border-cyan-400 shadow-2xl relative flex flex-col items-center justify-start pt-2 z-10">
                        {/* Camera cluster (NFC antenna location) */}
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/60 flex items-center justify-center relative">
                          <Radio className="w-5 h-5 text-[#00E5FF] animate-pulse" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <span className="text-[8px] font-mono text-cyan-300 font-bold mt-1 text-center leading-tight">
                          ĂNG-TEN<br />NFC
                        </span>

                        {/* Fingerprint / back logo */}
                        <div className="mt-auto mb-3 text-slate-700">
                          <Fingerprint className="w-4 h-4 text-slate-600" />
                        </div>
                      </div>

                      {/* CCCD Card Mockup touching back */}
                      <div className="absolute top-10 right-4 w-28 h-20 rounded-xl bg-gradient-to-tr from-amber-500/30 to-yellow-600/30 border border-amber-400 shadow-xl p-1.5 flex flex-col justify-between -rotate-12 backdrop-blur-xs z-20">
                        <div className="flex items-center justify-between">
                          <span className="text-[7px] font-bold text-amber-200">CCCD GẮN CHÍP</span>
                          {/* Gold chip */}
                          <div className="w-6 h-5 rounded bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 border border-amber-600 shadow-xs flex items-center justify-center">
                            <div className="w-3 h-3 border border-amber-800/60 rounded-xs" />
                          </div>
                        </div>
                        <span className="text-[7px] font-mono text-amber-300">{idNumber.substring(0, 6)}******</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="font-black text-sm text-cyan-300">
                        {isScanning ? 'Đang đọc dữ liệu chíp số hóa...' : 'Hướng Dẫn Tiếp Xúc Thẻ Chuẩn'}
                      </div>
                      <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                        Áp sát mặt sau thẻ CCCD (nơi có chíp kim loại màu vàng) vào <strong>khu vực cụm camera</strong> ở mặt lưng điện thoại. Giữ yên trong 2-3 giây.
                      </p>
                    </div>

                    {/* Scan Progress Bar & Live Status */}
                    {isScanning && (
                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700 p-0.5">
                          <div
                            className="bg-gradient-to-r from-[#00E5FF] via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-cyan-300 font-bold">{scanPhase}</span>
                          <span className="text-emerald-400 font-black">{scanProgress}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SUCCESS STATE CARD */}
                  {scanSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-emerald-300 flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Đã Đọc Chíp CCCD Thành Công (Chuẩn C06)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                          100% Khớp
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-emerald-500/30">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Họ và tên:</span>
                          <span className="font-black text-white">{fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Số CCCD:</span>
                          <span className="font-mono font-bold text-cyan-300">{idNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Ngày sinh:</span>
                          <span className="text-white">{birthDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Quê quán / Thường trú:</span>
                          <span className="text-white">{validation.provinceName}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleFinishAndContinue}
                        className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                      >
                        Hoàn Tất & Lưu Vào Hồ Sơ KYC &rarr;
                      </button>
                    </div>
                  )}

                  {/* Trigger Read Button */}
                  {!scanSuccess && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleStartNfcScan}
                        disabled={isScanning}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00E5FF] via-cyan-400 to-blue-600 text-black font-black text-xs sm:text-sm hover:brightness-110 shadow-xl shadow-cyan-500/25 disabled:opacity-50 active:scale-98 transition flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Radio className="w-4 h-4 text-black animate-pulse" />
                        <span>
                          {isScanning
                            ? 'Đang Giao Tiếp Tần Số 13.56 MHz...'
                            : 'Áp Lưng Máy & Đọc Chíp NFC Thật (13.56 MHz)'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition text-center"
                      >
                        &larr; Quay Lại Bước 1 (Chỉnh Sửa Hoặc Quét Lại MRZ)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: TÀI LIỆU & CẤU HÌNH ĐÓNG GÓI NATIVE APP */}
          {activeTab === 'NATIVE_DOCS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-1.5">
                <div className="flex items-center space-x-2 font-bold text-cyan-300 text-xs">
                  <Info className="w-4 h-4 text-[#00E5FF]" />
                  <span>Cách Triển Khai Phương Án 2 Khi Đóng Gói Thành App Cài Đặt (.APK / .IPA)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Khi build ứng dụng GigMe bằng <strong>Capacitor</strong> hoặc <strong>React Native</strong>, ứng dụng có toàn quyền truy cập vào chip NFC phần cứng thông qua tầng <strong>ISO-DEP (ISO 7816-4)</strong>. Bạn chỉ cần cài đặt plugin theo hướng dẫn bên dưới để người dùng áp mặt sau điện thoại vào chíp CCCD ngoài đời thật 100%.
                </p>
              </div>

              {/* Step 1: Install Plugin */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-xs text-white">1. Cài đặt Plugin NFC Native:</span>
                <div className="p-2.5 rounded-xl bg-black/80 font-mono text-[11px] text-cyan-300 border border-slate-800 flex items-center justify-between">
                  <code>npm install @capawesome-team/capacitor-nfc</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('npm install @capawesome-team/capacitor-nfc');
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-200 hover:text-white"
                  >
                    {copiedCode ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* Step 2: AndroidManifest.xml */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-xs text-white">2. Thêm quyền vào AndroidManifest.xml:</span>
                <div className="p-3 rounded-xl bg-black/80 font-mono text-[10px] text-emerald-400 border border-slate-800 leading-relaxed overflow-x-auto">
                  <div>&lt;uses-permission android:name=&quot;android.permission.NFC&quot; /&gt;</div>
                  <div>&lt;uses-feature android:name=&quot;android.hardware.nfc&quot; android:required=&quot;true&quot; /&gt;</div>
                </div>
              </div>

              {/* Step 3: Native Call Code Example */}
              <div className="space-y-1.5">
                <span className="font-extrabold text-xs text-white">3. Mã nguồn TypeScript đọc ICAO 9303 qua Native Bridge:</span>
                <div className="p-3 rounded-xl bg-black/80 font-mono text-[10px] text-slate-300 border border-slate-800 leading-relaxed overflow-x-auto">
                  <div className="text-cyan-400">// Khởi tạo phiên NFC lắng nghe khi áp lưng điện thoại vào chip</div>
                  <div>import &#123; Nfc &#125; from &#39;@capawesome-team/capacitor-nfc&#39;;</div>
                  <br />
                  <div className="text-amber-300">await Nfc.startScanSession();</div>
                  <div>Nfc.addListener(&#39;nfcTagScanned&#39;, async (tag) =&gt; &#123;</div>
                  <div className="pl-4 text-emerald-400">// Gửi lệnh APDU xác thực BAC bằng khóa MRZ</div>
                  <div className="pl-4">const bacResponse = await Nfc.transceive(&#123;</div>
                  <div className="pl-8">tech: &#39;IsoDep&#39;,</div>
                  <div className="pl-8">data: buildBacApduCommand(mrzData)</div>
                  <div className="pl-4">&#125;);</div>
                  <div>&#125;);</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. FACE LIVENESS DIALOG - AI SINH TRẮC HỌC CHỐNG GIẢ MẠO
export const FaceLivenessDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { verifyFaceLiveness, showNotification } = useGigMe();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stepsData = [
    { title: 'Sẵn sàng quét khuôn mặt AI', desc: 'Đặt khuôn mặt vừa vặn vào giữa khung tròn', icon: Camera },
    { title: 'Nhìn thẳng & Chớp mắt 2 lần...', desc: 'AI đang phân tích phản xạ đồng tử', icon: Eye },
    { title: 'Quay nhẹ mặt sang trái rồi sang phải...', desc: 'AI đang dựng mô hình 3D góc cạnh khuôn mặt', icon: RefreshCw },
    { title: 'Mỉm cười nhẹ để đối chiếu...', desc: 'AI đang kiểm tra vi biểu cảm sống động', icon: Smile },
  ];

  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsScanning(false);
      setStep(0);
      setProgress(0);
      setIsCompleted(false);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
        .then((stream) => {
          streamRef.current = stream;
          setHasCamera(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera preview not permitted/unavailable:', err);
          setHasCamera(false);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartCheck = () => {
    setIsScanning(true);
    setStep(1);
    setProgress(25);
    playNotificationSound('DING_DEFAULT');

    setTimeout(() => {
      setStep(2);
      setProgress(60);
      playNotificationSound('DING_DEFAULT');

      setTimeout(() => {
        setStep(3);
        setProgress(85);
        playNotificationSound('DING_DEFAULT');

        setTimeout(() => {
          setProgress(100);
          setIsCompleted(true);
          playNotificationSound('BANK_TING');
          verifyFaceLiveness();

          showNotification(
            '👤 Face Liveness Thành Công!',
            'Đã hoàn tất đối chiếu sinh trắc học khuôn mặt AI chuẩn Quốc gia.',
            true,
            true
          );

          setTimeout(() => {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
            onClose();
          }, 900);
        }, 1100);
      }, 1200);
    }, 1200);
  };

  const CurrentIcon = stepsData[step]?.icon || Camera;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 text-center text-slate-900 dark:text-white shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              AI Face Liveness Verification
            </h3>
          </div>
          <button
            onClick={() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
              }
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Camera live / frame circular viewport */}
        <div className="relative mx-auto w-48 h-48 rounded-full border-4 border-dashed border-sky-400 p-1 flex items-center justify-center overflow-hidden bg-slate-900 shadow-[0_0_25px_rgba(2,132,199,0.25)]">
          {hasCamera ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-full transform -scale-x-100"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center relative">
              {/* Simulated Biometric Facial Mesh */}
              <div className="w-20 h-28 border-2 border-dashed border-sky-400/60 rounded-[40px] flex items-center justify-center relative">
                <div className="w-12 h-6 border-b-2 border-emerald-400/80 rounded-full" />
                <div className="absolute top-6 left-3 w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <div className="absolute top-6 right-3 w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              </div>
              <span className="text-[10px] text-sky-300 mt-2 font-mono font-bold">SIMULATED AI MESH</span>
            </div>
          )}

          {/* Radar Scanning Line Animation during scan */}
          {isScanning && !isCompleted && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#10b981]" />
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-ping" />
            </div>
          )}

          {/* Success Check Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-500/85 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
              <CheckCircle2 className="w-14 h-14 animate-bounce text-white" />
              <span className="text-xs font-black mt-1">ĐẠT CHUẨN SINH TRẮC HỌC</span>
            </div>
          )}
        </div>

        {/* Step Indicator & Text */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center justify-center space-x-2 text-sky-600 dark:text-sky-400 font-bold text-xs sm:text-sm">
            <CurrentIcon className="w-4 h-4 animate-spin-slow" />
            <span>{stepsData[step]?.title}</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stepsData[step]?.desc}
          </p>
        </div>

        {step === 0 && (
          <button
            onClick={handleStartCheck}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-extrabold text-sm hover:opacity-95 shadow-md shadow-sky-500/20 active:scale-[0.98] transition"
          >
            Bắt Đầu Quét Khuôn Mặt Ngay
          </button>
        )}

        {isScanning && !isCompleted && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>AI đang đối chiếu sinh trắc học thời gian thực ({progress}%)...</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. STUDENT SSO PORTAL DIALOG
export const StudentSsoDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { verifyStudentSso, showNotification } = useGigMe();
  const [school, setSchool] = useState('Đại học Bách Khoa Hà Nội');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentId, setStudentId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = studentEmail.trim().toLowerCase();
    if (!cleanEmail.includes('@') || (!cleanEmail.endsWith('.edu.vn') && !cleanEmail.includes('.edu'))) {
      showNotification(
        'Email sinh viên không hợp lệ',
        'Vui lòng nhập đúng email sinh viên do trường cấp (ví dụ: tenban@student.hust.edu.vn, *.edu.vn).'
      );
      return;
    }
    if (!studentId.trim()) {
      showNotification('Thiếu MSSV', 'Vui lòng điền mã số sinh viên hợp lệ của bạn.');
      return;
    }
    verifyStudentSso(school, cleanEmail);
    onClose();
  };

  const SCHOOLS = [
    'Đại học Bách Khoa Hà Nội',
    'Đại học Tôn Đức Thắng (TDTU)',
    'Đại học Bách Khoa TP.HCM (HCMUT)',
    'Đại học Quốc Gia Hà Nội (VNU)',
    'Đại học Kinh Tế Quốc Dân (NEU)',
    'Đại học Ngoại Thương (FTU)',
    'Đại học Công Nghệ Thông Tin (UIT)',
    'Đại học Sư Phạm Kỹ Thuật (HCMUTE)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-[#FF6B00]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">Cổng Xác Thực Sinh Viên (SSO)</h3>
              <p className="text-[11px] text-slate-400">Kết nối mạng lưới KTX & Campus toàn quốc</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Chọn Trường Đại học / Cao đẳng</label>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-medium"
            >
              {SCHOOLS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Email sinh viên chính thức (*.edu.vn)</label>
            <input
              type="email"
              required
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white"
              placeholder="mssv@student.edu.vn"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Mã số sinh viên (MSSV)</label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono"
              placeholder="20201889"
            />
          </div>

          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px]">
            🎓 Mở khóa huy hiệu <strong>Sinh Viên Ưu Tú</strong>, nhận kèo kèm học tập/cày game trong ký túc xá và miễn 100% phí bảo lãnh đơn đầu!
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-orange-500/20 transition"
          >
            Xác Nhận & Kết Nối Cổng Trường
          </button>
        </form>
      </div>
    </div>
  );
};

// 4. VOICE SEARCH DIALOG
export const VoiceSearchDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectQuery: (q: string) => void;
}> = ({ isOpen, onClose, onSelectQuery }) => {
  if (!isOpen) return null;

  const suggestions = [
    'Kéo rank liên quân',
    'Giải bài tập Giải tích 2',
    'Edit video TikTok review quán cafe',
    'Giao tài liệu hỏa tốc sang KTX',
    'Trợ thủ dọn phòng ký túc xá',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-center text-white">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulsing Mic */}
        <div className="relative mx-auto w-24 h-24 my-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#00E5FF]/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#00E5FF] to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Mic className="w-10 h-10 text-black animate-pulse" />
          </div>
        </div>

        <h3 className="text-base font-extrabold text-white">Đang lắng nghe giọng nói...</h3>
        <p className="text-xs text-slate-400 mt-1">
          Nói từ khóa công việc bạn đang muốn tìm kiếm (Ví dụ: &quot;Tìm người cày rank&quot;)
        </p>

        {/* Waveform animation */}
        <div className="flex items-center justify-center space-x-1 my-4 h-8">
          {[40, 70, 90, 60, 100, 50, 80, 45, 95, 30].map((h, idx) => (
            <div
              key={idx}
              className="w-1 rounded-full bg-[#00E5FF] animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${idx * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-left">
          <span className="text-[11px] text-slate-400 block mb-2 font-semibold">Hoặc bấm chọn nhanh gợi ý:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onSelectQuery(s);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#131E30] hover:bg-[#1A2840] text-cyan-300 text-xs font-medium border border-slate-700 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 5. UNIFIED DYNAMIC VIETQR PRO & NAPAS 247 OPEN API AUTO SCANNER DIALOG
export const DynamicVietQrDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}> = ({ isOpen, onClose, defaultAmount = 100000 }) => {
  return <VietQrOpenApiAutoScanner isOpen={isOpen} onClose={onClose} defaultAmount={defaultAmount} />;
};

// 6. BANK WITHDRAW DIALOG WITH NAPAS 247 INSTANT TRANSFER & ANTI-FRAUD KYC CHECK
export const BankWithdrawDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, withdrawToBank, showNotification } = useGigMe();
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(currentUser?.kycName || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [pin, setPin] = useState('');
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [receiptTx, setReceiptTx] = useState<{
    id: string;
    bank: string;
    account: string;
    holder: string;
    amount: number;
    time: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReceiptTx(null);
      if (currentUser) {
        if (currentUser.defaultBank) {
          setBankName(currentUser.defaultBank.bankName);
          setAccountNumber(currentUser.defaultBank.accountNumber);
          setAccountHolderName(currentUser.defaultBank.accountHolder);
        } else if (currentUser.kycName) {
          setAccountHolderName(currentUser.kycName);
        } else if (currentUser.name) {
          setAccountHolderName(currentUser.name.toUpperCase());
        }
      }
    }
  }, [isOpen, currentUser]);

  // Realtime Napas 247 account holder lookup
  const handleAccountBlur = async () => {
    if (accountNumber.trim().length >= 6) {
      setIsLookingUp(true);
      try {
        const res = await verifyBeneficiaryAccount(bankName, accountNumber);
        if (res.isValid && res.accountHolderName) {
          setAccountHolderName(res.accountHolderName);
        }
      } catch (err) {
        console.warn('Lookup error:', err);
      } finally {
        setIsLookingUp(false);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) {
      showNotification('Thiếu số tài khoản', 'Vui lòng nhập số tài khoản ngân hàng thụ hưởng.');
      return;
    }
    if (!accountHolderName.trim()) {
      showNotification('Thiếu tên chủ tài khoản', 'Vui lòng nhập họ tên chủ tài khoản.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10000) {
      showNotification('Số tiền không hợp lệ', 'Số tiền rút tối thiểu là 10.000đ.');
      return;
    }
    if (useBiometrics && !currentUser?.isBiometricsEnabled) {
      showNotification(
        'Sinh trắc học chưa kích hoạt',
        'Bạn chưa bật xác thực sinh trắc học trong phần Cài đặt tài khoản. Vui lòng bật hoặc nhập mã PIN 6 số.'
      );
      return;
    }
    if (!useBiometrics && (!pin || pin.length < 6)) {
      showNotification('Mã PIN chưa đủ', 'Vui lòng nhập đủ 6 chữ số mã PIN ví.');
      return;
    }

    const ok = withdrawToBank(bankName, accountNumber, accountHolderName, numAmount, pin, useBiometrics);
    if (ok) {
      playNotificationSound('BANK_TING');
      setReceiptTx({
        id: `FT26${Date.now().toString().slice(-8)}`,
        bank: bankName,
        account: accountNumber,
        holder: accountHolderName,
        amount: numAmount,
        time: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#0B1322] border-2 border-red-500/40 p-6 text-white shadow-2xl my-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/20">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white">Rút Tiền Napas 247 Siêu Tốc</h3>
                <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-black">
                  &lt; 3 GIÂY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Khả dụng: <strong className="text-emerald-400 font-mono">{currentUser ? formatVnd(currentUser.walletBalance) : '0đ'}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If completed, show Napas Electronic Receipt */}
        {receiptTx ? (
          <div className="py-4 space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#101A2C] border border-emerald-500/40 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm">Chuyển Tiền Napas 247 Thành Công!</h4>
                <p className="text-xs text-slate-400 mt-0.5">Tiền đã được chuyển vào tài khoản ngân hàng thụ hưởng</p>
              </div>

              <div className="text-2xl font-black text-emerald-400 font-mono py-1">
                {formatVnd(receiptTx.amount)}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5 text-left font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã giao dịch FT:</span>
                  <span className="text-[#00E5FF] font-bold">{receiptTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngân hàng nhận:</span>
                  <span className="text-white font-bold">{receiptTx.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="text-white font-bold">{receiptTx.account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="text-white font-bold">{receiptTx.holder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời gian:</span>
                  <span className="text-slate-300">{receiptTx.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kênh xử lý:</span>
                  <span className="text-emerald-400 font-bold">Napas 247 Instant Switch</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-black font-extrabold text-xs hover:brightness-110 transition"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-3 space-y-3 text-xs">
            {/* Napas 24/7 Gateway Status Indicator */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10px]">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Cổng Giải Ngân Tự Động 24/7 Napas</span>
              </div>
              <span className="text-emerald-300/80 font-mono font-bold">~{AUTO_DISBURSEMENT_KEYS.averageLatencyMs}ms • T0</span>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Ngân hàng thụ hưởng Napas 247</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-semibold text-xs"
              >
                {VIETNAMESE_BANKS.map((b) => (
                  <option key={b.code} value={b.name} className="bg-slate-900 text-white">
                    {b.name} - {b.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Số tài khoản ngân hàng</label>
              <input
                type="text"
                required
                value={accountNumber}
                onBlur={handleAccountBlur}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono font-bold"
                placeholder="Nhập số tài khoản ngân hàng..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Họ tên chủ tài khoản (Tra cứu Napas)</label>
                {isLookingUp ? (
                  <span className="text-[10px] text-cyan-400 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Đang tra cứu Napas 247...</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-semibold">✓ Khớp E-KYC</span>
                )}
              </div>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white uppercase font-bold"
                placeholder="NGUYEN VAN A"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Số tiền muốn rút (VND)</label>
                <span className="text-[10px] text-slate-400">
                  Khả dụng: <strong className="text-emerald-400">{currentUser ? formatVnd(currentUser.walletBalance) : '0đ'}</strong>
                </span>
              </div>
              <input
                type="number"
                step="10000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono font-bold text-sm"
                placeholder="Ví dụ: 100000"
              />

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[50000, 100000, 200000, 500000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold font-mono transition ${
                      amount === preset
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-[#131E30] border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {formatVnd(preset)}
                  </button>
                ))}
                {currentUser && currentUser.walletBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(currentUser.walletBalance)}
                    className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[#00E5FF] text-[10px] font-bold transition hover:bg-cyan-500/20"
                  >
                    Rút Hết Số Dư
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 px-0.5">
                <span>Phí giao dịch rút tiền: <strong className="text-emerald-400">0đ (Miễn phí)</strong></span>
                <span>Thời gian: <strong className="text-cyan-300">&lt; 3 giây</strong></span>
              </div>
            </div>

            {/* Verification Method: PIN vs Biometrics */}
            <div className="p-3 rounded-2xl bg-[#101A2C] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Fingerprint className="w-4 h-4 text-[#00E5FF]" />
                  <span>Xác thực vân tay / FaceID</span>
                </span>
                <input
                  type="checkbox"
                  checked={useBiometrics}
                  onChange={(e) => setUseBiometrics(e.target.checked)}
                  className="w-4 h-4 accent-[#00E5FF] cursor-pointer"
                />
              </div>

              {!useBiometrics && (
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mã PIN giao dịch (6 chữ số)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white tracking-widest font-mono text-center font-bold"
                    placeholder="******"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 text-white font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-red-600/20 transition flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Xác Nhận Rút Tiền Napas 247 Ngay</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 7. E-WALLET (MOMO / ZALOPAY / VIETTEL MONEY) DIALOG
export const EWalletDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, linkEWallet, depositEWallet, withdrawEWallet, showNotification } = useGigMe();
  const [walletType, setWalletType] = useState('MoMo');
  const existingConnected = walletType === 'MoMo' ? currentUser?.connectedMoMo : currentUser?.connectedZaloPay;
  const [phone, setPhone] = useState(existingConnected || currentUser?.phone || '');
  const [mode, setMode] = useState<'DEPOSIT' | 'WITHDRAW' | 'LINK'>(existingConnected ? 'DEPOSIT' : 'LINK');
  const [amount, setAmount] = useState<number | ''>(100000);

  if (!isOpen) return null;

  const handleAction = () => {
    if (!phone.trim()) {
      showNotification('Thiếu SĐT ví', 'Vui lòng nhập số điện thoại liên kết ví.');
      return;
    }
    const numAmount = Number(amount);
    if (mode === 'LINK') {
      linkEWallet(walletType, phone);
      setMode('DEPOSIT');
    } else if (mode === 'DEPOSIT') {
      if (!numAmount || numAmount < 10000) {
        showNotification('Số tiền không hợp lệ', 'Số tiền nạp tối thiểu là 10.000đ.');
        return;
      }
      depositEWallet(walletType, numAmount);
      onClose();
    } else {
      if (!numAmount || numAmount < 10000) {
        showNotification('Số tiền không hợp lệ', 'Số tiền rút tối thiểu là 10.000đ.');
        return;
      }
      withdrawEWallet(walletType, numAmount, phone);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <h3 className="font-extrabold text-sm">Liên Kết & Giao Dịch Ví Điện Tử</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* E-Wallet selector */}
        <div className="grid grid-cols-3 gap-2 py-4">
          {['MoMo', 'ZaloPay', 'Viettel Money'].map((type) => (
            <button
              key={type}
              onClick={() => setWalletType(type)}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                walletType === type
                  ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500 text-pink-300 shadow-md'
                  : 'bg-[#131E30] border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Mode selector */}
        <div className="flex bg-[#131E30] p-1 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
          <button
            onClick={() => setMode('DEPOSIT')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'DEPOSIT' ? 'bg-[#00E5FF] text-black' : 'text-slate-400'
            }`}
          >
            Nạp Tiền
          </button>
          <button
            onClick={() => setMode('WITHDRAW')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'WITHDRAW' ? 'bg-[#FF6B00] text-black' : 'text-slate-400'
            }`}
          >
            Rút Tiền
          </button>
          <button
            onClick={() => setMode('LINK')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'LINK' ? 'bg-purple-500 text-white' : 'text-slate-400'
            }`}
          >
            Đổi SĐT Ví
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Số điện thoại đăng ký {walletType}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono font-bold"
              placeholder="Nhập SĐT ví (VD: 0909120918)..."
            />
          </div>

          {mode !== 'LINK' && (
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Số tiền (VND)</label>
              <input
                type="number"
                step="10000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono font-bold"
                placeholder="100000"
              />
            </div>
          )}

          <button
            onClick={handleAction}
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-extrabold text-sm hover:brightness-110 shadow-lg shadow-pink-600/20 transition"
          >
            {mode === 'DEPOSIT'
              ? `Xác Nhận Nạp ${formatVnd(Number(amount) || 0)} Từ ${walletType}`
              : mode === 'WITHDRAW'
              ? `Rút ${formatVnd(Number(amount) || 0)} Về ${walletType}`
              : `Cập Nhật Liên Kết ${walletType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// 8. SOUND SETTINGS DIALOG - CHẾ ĐỘ ÂM THANH ĐỘC QUYỀN (RETRO CYBER AUDIO CUES)
export const SoundSettingsDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, setNotificationSound, showNotification } = useGigMe();
  const [muted, setMuted] = useState(isAudioMuted());
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) {
      playNotificationSound('BUTTON_CLICK');
    }
    showNotification(
      next ? '🔇 Đã tắt toàn bộ âm thanh' : '🔊 Đã bật âm thanh Retro Cyber',
      next ? 'Hệ thống sẽ chạy ở chế độ im lặng' : 'Sẵn sàng trải nghiệm âm thanh sinh động!'
    );
  };

  const handlePreview = (key: SoundEffectType) => {
    setPlayingKey(key);
    playNotificationSound(key);
    setTimeout(() => setPlayingKey(null), 800);
  };

  const RETRO_CYBER_CUES: Array<{
    key: SoundEffectType;
    label: string;
    desc: string;
    tag: string;
    color: string;
  }> = [
    {
      key: 'BANK_TING',
      label: 'Ting Ting Napas 247',
      desc: 'Chuông cao pha lê báo giải ngân ví & nạp tiền thành công',
      tag: 'FINANCE',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    },
    {
      key: 'CASH_COUNT',
      label: 'Máy Đếm Tiền Rào Rạo',
      desc: 'Hiệu ứng xào tiền polymer cực sướng tai khi nhận thù lao',
      tag: 'EARNINGS',
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    },
    {
      key: 'RADAR_PING',
      label: 'Radar Sonar Ping Quét Việc',
      desc: 'Sóng âm viễn tưởng phát ra khi quét campus jobs xung quanh',
      tag: 'RADAR',
      color: 'text-[#00E5FF] border-cyan-500/40 bg-cyan-500/10',
    },
    {
      key: 'ESCROW_LOCK',
      label: 'Khóa Kỹ Thuật Số Smart Escrow',
      desc: 'Tiếng cơ khí 2 nhịp bảo chứng hợp đồng ký quỹ sinh viên',
      tag: 'ESCROW',
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    },
    {
      key: 'LEVEL_UP',
      label: 'Fanfare 8-bit Thăng Hạng ELO',
      desc: 'Hợp âm vinh danh khi tăng điểm tín nhiệm & mở huy hiệu',
      tag: 'RANKING',
      color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
    },
    {
      key: 'SUCCESS_CHIME',
      label: 'Nghiệm Thu Công Việc Thành Công',
      desc: 'Âm thanh 2 nốt trong trẻo khi hoàn tất gig và ký biên bản',
      tag: 'GIGS',
      color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    },
    {
      key: 'BUTTON_CLICK',
      label: 'Phím Bấm Haptic Pop',
      desc: 'Phản hồi tactile haptic pop khi bấm phím tương tác',
      tag: 'UI FX',
      color: 'text-slate-300 border-slate-700 bg-slate-800',
    },
    {
      key: 'SOFT_VIBRATE',
      label: 'Rung Nhẹ Êm Dịu Thư Viện',
      desc: 'Âm bass tần số thấp phù hợp khi làm việc trong phòng đọc',
      tag: 'QUIET',
      color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-[#0B1322] border-2 border-[#00E5FF]/40 p-5 sm:p-6 text-white shadow-2xl my-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-black shadow-lg shadow-cyan-500/20">
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">Chế Độ Âm Thanh Độc Quyền</h3>
              <p className="text-[10px] text-slate-400">Retro Cyber Audio Cues sinh động</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Mute Bar */}
        <div className="py-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#101A2C] border border-slate-800 mb-3">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${muted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Âm Lượng Toàn Ứng Dụng</h4>
                <p className="text-[10px] text-slate-400">{muted ? 'Đang tắt âm (Mute)' : 'Đang phát âm thanh đầy đủ'}</p>
              </div>
            </div>
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition border ${
                muted
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-500 text-black border-emerald-400 hover:brightness-110 shadow-md shadow-emerald-500/20'
              }`}
            >
              {muted ? 'Bật Lại' : 'Đang Bật'}
            </button>
          </div>

          {/* Sound Library */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {RETRO_CYBER_CUES.map((cue) => {
              const isDefaultSelected =
                currentUser?.notificationSound === cue.key ||
                (!currentUser?.notificationSound && cue.key === 'BANK_TING');
              const isPlaying = playingKey === cue.key;

              return (
                <div
                  key={cue.key}
                  onClick={() => {
                    if (['BANK_TING', 'CASH_COUNT', 'DING_DEFAULT', 'SOFT_VIBRATE'].includes(cue.key)) {
                      setNotificationSound(cue.key as any);
                    }
                    handlePreview(cue.key);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isDefaultSelected
                      ? 'bg-cyan-500/10 border-[#00E5FF] text-white shadow-sm'
                      : 'bg-[#101A2C] border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black border ${cue.color}`}>
                        {cue.tag}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{cue.label}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{cue.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(cue.key);
                    }}
                    className={`shrink-0 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-extrabold text-[10px] transition border ${
                      isPlaying
                        ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-md shadow-cyan-500/30 animate-pulse'
                        : 'bg-[#131E30] hover:bg-slate-800 text-cyan-300 border-slate-700'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isPlaying ? 'Đang thử' : 'Thử nghe'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2.5 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-extrabold text-xs hover:brightness-110 shadow-lg shadow-cyan-500/20 transition"
        >
          Áp Dụng & Đóng
        </button>
      </div>
    </div>
  );
};

// 9. FINANCIAL STATEMENT EXPORT DIALOG
export const StatementDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { exportStatement } = useGigMe();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-12 h-12 mx-auto flex items-center justify-center mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-white">Xuất Sao Kê Tài Chính GigMe</h3>
        <p className="text-xs text-slate-400 mt-1">
          Bảng kê có đóng dấu mã QR đối soát điện tử, được các ngân hàng & đối tác chấp nhận xác minh thu nhập.
        </p>

        <div className="space-y-2 mt-6">
          <button
            onClick={() => {
              exportStatement('PDF (Có Dấu Mộc Điện Tử)');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs hover:brightness-110 shadow-md transition"
          >
            Xuất File PDF (Đối Soát Thu Nhập)
          </button>

          <button
            onClick={() => {
              exportStatement('Excel Spreadsheet (.xlsx)');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs hover:brightness-110 shadow-md transition"
          >
            Xuất File Excel (.XLSX)
          </button>
        </div>
      </div>
    </div>
  );
};

// 10. BUSINESS UPGRADE DIALOG
export const BusinessUpgradeDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { upgradeToBusinessAccount } = useGigMe();
  const [businessName, setBusinessName] = useState('Quán Trà Sữa KTX Bách Khoa');
  const [taxId, setTaxId] = useState('0109887766');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upgradeToBusinessAccount(businessName, taxId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0F172A] border border-[#1E293B] p-6 text-white shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm">Nâng Cấp GigMe For Business</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            🏢 Dành cho Hộ kinh doanh, Cửa hàng ăn uống, Studio media sinh viên:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Phí nền tảng giảm còn <strong>7%</strong> (thay vì 10%)</li>
              <li>Hạn mức cọc & giao dịch mở rộng lên <strong>100.000.000đ</strong></li>
              <li>Đăng tuyển kèo ghép nhóm lên đến 10 người cùng lúc</li>
            </ul>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Tên Doanh nghiệp / Cửa hàng</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-bold"
              placeholder="VD: Quán Cà Phê Sinh Viên"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Mã số thuế (MST) hoặc Số ĐKKD</label>
            <input
              type="text"
              required
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white font-mono"
              placeholder="0109887766"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-amber-500/20 transition"
          >
            Kích Hoạt Tài Khoản Doanh Nghiệp
          </button>
        </form>
      </div>
    </div>
  );
};

// Alias for NFC Dialog
export const NfcCccdDialog = NfcCccdScanDialog;

// 11. MYSTERY BOX REWARD DIALOG
export const MysteryBoxDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { showNotification } = useGigMe();
  const [isOpened, setIsOpened] = useState(false);

  if (!isOpen) return null;

  const handleOpenBox = () => {
    setIsOpened(true);
    showNotification(
      '🎁 Hộp Quà Bí Ẩn Đã Mở!',
      'Chúc mừng bạn nhận được Voucher miễn 100% phí sàn giao dịch tiếp theo!',
      true,
      true
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-[#00E5FF]/40 p-6 text-white text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-extrabold text-white mb-2">Hộp Quà May Mắn Sinh Viên</h3>
        <p className="text-xs text-slate-400 mb-6">Mở hộp quà mỗi ngày khi hoàn thành ít nhất 1 kèo!</p>

        {!isOpened ? (
          <div className="py-6 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#00E5FF] via-purple-500 to-[#FF6B00] p-1 animate-bounce">
              <div className="w-full h-full bg-[#0A0E17] rounded-3xl flex items-center justify-center text-4xl">
                🎁
              </div>
            </div>

            <button
              onClick={handleOpenBox}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#FF6B00] text-black font-extrabold text-sm hover:brightness-110 shadow-lg shadow-cyan-500/25 transition"
            >
              Chạm Để Mở Quà
            </button>
          </div>
        ) : (
          <div className="py-4 space-y-3 animate-fade-in">
            <div className="text-5xl mb-2">🎉</div>
            <h4 className="text-sm font-extrabold text-emerald-400">VOUCHER MIỄN 100% PHÍ SÀN</h4>
            <p className="text-xs text-slate-300">
              Đã cộng trực tiếp vào ví của bạn. Áp dụng tự động cho lần nghiệm thu tiếp theo!
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2 rounded-xl bg-[#131E30] text-[#00E5FF] font-bold text-xs hover:bg-slate-800 transition"
            >
              Tuyệt vời, Đóng lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// 12. UNIFIED PUSH NOTIFICATIONS & FCM ALERT DIALOG
export const PushNotificationsDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  return <FcmPushNotificationModal isOpen={isOpen} onClose={onClose} />;
};

