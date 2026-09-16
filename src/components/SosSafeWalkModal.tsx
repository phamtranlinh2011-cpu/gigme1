import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Navigation,
  PhoneCall,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  X,
  Phone,
  Radio,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';

interface SosSafeWalkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SosSafeWalkModal: React.FC<SosSafeWalkModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userCoords,
    safeWalkSession,
    startSafeWalk,
    checkInSafeWalk,
    triggerSafeWalkAlarm,
    stopSafeWalk,
  } = useGigMe();

  // Setup Form
  const [origin, setOrigin] = useState('Thư viện Trung Tâm Campus');
  const [destination, setDestination] = useState('Ký Túc Xá Nhà H6 - Cổng 3');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [emergencyName, setEmergencyName] = useState('Bạn cùng phòng (Bảo Anh)');
  const [emergencyPhone, setEmergencyPhone] = useState('0909999888');

  // Countdown & Timer
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [strobeActive, setStrobeActive] = useState(false);

  // Fake Call Feature
  const [isFakeCalling, setIsFakeCalling] = useState(false);
  const [fakeCallAnswered, setFakeCallAnswered] = useState(false);
  const [fakeCallDuration, setFakeCallDuration] = useState(0);

  // SafeWalk buddies nearby
  const [buddies] = useState([
    {
      id: 'buddy_1',
      name: 'Trần Minh Tuấn (K21 CNTT)',
      route: 'Thư viện -> KTX Khu B',
      eta: 'Khởi hành sau 5 phút',
      status: 'Đang chờ ghép đôi',
    },
    {
      id: 'buddy_2',
      name: 'Nguyễn Thảo Vy (K22 QTKD)',
      route: 'Giảng đường A -> KTX Nhà H3',
      eta: 'Khởi hành ngay bây giờ',
      status: 'Đang di chuyển',
    },
  ]);

  // Sync remaining seconds
  useEffect(() => {
    if (safeWalkSession && safeWalkSession.isActive) {
      const interval = setInterval(() => {
        const diff = Math.max(0, Math.floor((safeWalkSession.endsAt - Date.now()) / 1000));
        setSecondsRemaining(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [safeWalkSession]);

  // Strobe effect when alarm triggered
  useEffect(() => {
    let strobeTimer: any;
    if (safeWalkSession?.isAlarmTriggered) {
      strobeTimer = setInterval(() => {
        setStrobeActive((prev) => !prev);
      }, 300);
    } else {
      setStrobeActive(false);
    }
    return () => clearInterval(strobeTimer);
  }, [safeWalkSession?.isAlarmTriggered]);

  // Fake call duration timer
  useEffect(() => {
    let timer: any;
    if (fakeCallAnswered) {
      timer = setInterval(() => {
        setFakeCallDuration((p) => p + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [fakeCallAnswered]);

  if (!isOpen) return null;

  const handleStart = () => {
    startSafeWalk(origin, destination, durationMinutes, emergencyName, emergencyPhone);
  };

  const handleTriggerAlarm = () => {
    triggerSafeWalkAlarm();
  };

  const handleCheckIn = () => {
    checkInSafeWalk();
  };

  const handleStop = () => {
    stopSafeWalk();
  };

  const startFakeCall = () => {
    setIsFakeCalling(true);
    setFakeCallAnswered(false);
    setFakeCallDuration(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-colors duration-300 backdrop-blur-md overflow-y-auto ${
        safeWalkSession?.isAlarmTriggered
          ? strobeActive
            ? 'bg-red-900/90'
            : 'bg-black/95'
          : 'bg-black/80'
      }`}
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/40 overflow-hidden my-4 text-slate-900 dark:text-white">
        {/* Fake Call Overlay */}
        {isFakeCalling && (
          <div className="absolute inset-0 z-50 bg-[#0B0F19] text-white flex flex-col justify-between p-6 animate-fadeIn">
            <div className="text-center pt-8 space-y-2">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-rose-500/30 animate-pulse">
                👩
              </div>
              <h3 className="text-xl font-black">Mẹ (Cuộc Gọi Giải Cứu)</h3>
              <p className="text-xs text-slate-400">
                {fakeCallAnswered
                  ? `Đang kết nối... ${formatTime(fakeCallDuration)}`
                  : 'Cuộc gọi thoại đến...'}
              </p>
            </div>

            {fakeCallAnswered ? (
              <div className="text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
                  <p className="italic">
                    "Mẹ đang ở đầu hẻm rồi con ơi, con đi đến đâu rồi mẹ đón? Đứng yên chỗ đông người mẹ tới liền nhé!"
                  </p>
                </div>
                <button
                  onClick={() => setIsFakeCalling(false)}
                  className="w-16 h-16 mx-auto rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform hover:scale-105"
                >
                  <Phone className="w-7 h-7 text-white rotate-[135deg]" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-around pb-10">
                <button
                  onClick={() => setIsFakeCalling(false)}
                  className="flex flex-col items-center space-y-1.5 group"
                >
                  <div className="w-16 h-16 rounded-full bg-red-600 group-hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40">
                    <Phone className="w-7 h-7 text-white rotate-[135deg]" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">Từ chối</span>
                </button>

                <button
                  onClick={() => setFakeCallAnswered(true)}
                  className="flex flex-col items-center space-y-1.5 group"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500 group-hover:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce">
                    <Phone className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400">Trả lời</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div
          className={`p-5 text-white flex items-center justify-between transition-colors ${
            safeWalkSession?.isAlarmTriggered
              ? 'bg-red-600'
              : 'bg-gradient-to-r from-rose-600 via-pink-700 to-indigo-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
              <ShieldAlert className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">SOS SafeWalk Sinh Viên</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 text-white font-extrabold uppercase">
                  Bảo Vệ Đêm
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-0.5">
                Giám sát lộ trình, check-in an toàn & còi báo động khẩn cấp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {safeWalkSession?.isActive ? (
            /* ACTIVE SESSION VIEW */
            <div className="space-y-4">
              {/* Emergency Status Banner */}
              <div
                className={`p-4 rounded-2xl border text-center space-y-2 ${
                  safeWalkSession.isAlarmTriggered
                    ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2 text-sm font-black uppercase tracking-wider">
                  <Radio className="w-4 h-4 animate-ping" />
                  <span>
                    {safeWalkSession.isAlarmTriggered
                      ? '🚨 ĐANG PHÁT CÒI HÚ BÁO ĐỘNG SOS!'
                      : 'Đang Giám Sát SafeWalk Theo Thời Gian Thực'}
                  </span>
                </div>
                <div className="text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
                  {formatTime(secondsRemaining)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thời gian dự kiến còn lại để về đến đích an toàn
                </p>
              </div>

              {/* Live Route Tracker Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Điểm đi:</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {safeWalkSession.originName}
                    </p>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-2 pl-4 py-1 flex items-center space-x-2 text-slate-400 text-[11px]">
                  <Navigation className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  <span>
                    Tọa độ GPS: {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
                  </span>
                </div>

                <div className="flex items-start space-x-2.5">
                  <Compass className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Điểm đến:</span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {safeWalkSession.destinationName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">
                      {safeWalkSession.emergencyContactName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {safeWalkSession.emergencyContactPhone}
                    </span>
                  </div>
                </div>

                <a
                  href={`tel:${safeWalkSession.emergencyContactPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm transition"
                >
                  Gọi Ngay
                </a>
              </div>

              {/* BIG ACTIONS: SOS Alarm & Check-in */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCheckIn}
                  className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tôi Vẫn An Toàn</span>
                </button>

                <button
                  onClick={handleTriggerAlarm}
                  className="py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition animate-pulse"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>CÒI HÚ SOS BÁO ĐỘNG</span>
                </button>
              </div>

              {/* Fake Call Trigger */}
              <button
                onClick={startFakeCall}
                className="w-full py-2.5 px-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition"
              >
                <Phone className="w-4 h-4" />
                <span>Kích Hoạt "Cuộc Gọi Cứu Nguy Giả Vờ" (Fake Call)</span>
              </button>

              {/* Stop Walk */}
              <button
                onClick={handleStop}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition"
              >
                Đã Về Đến Phòng • Kết Thúc SafeWalk
              </button>
            </div>
          ) : (
            /* SETUP NEW SESSION VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-500/30 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center space-x-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>Tính năng bảo vệ sinh viên khi đi lại ban đêm:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tự động đếm ngược hành trình từ thư viện/lab về phòng. Nếu có nguy hiểm, chỉ cần 1 chạm để phát còi hú âm lượng cực đại và gửi SMS tọa độ cho người thân & Đội Bảo Vệ KTX.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Điểm xuất phát:
                  </label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Điểm đến an toàn (Phòng / KTX):
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Thời gian đi bộ dự kiến (phút):
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 15, 20, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                          durationMinutes === mins
                            ? 'bg-rose-500 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {mins} phút
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Tên người nhận tin SOS:
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Số điện thoại khẩn cấp:
                    </label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Start SafeWalk Button */}
              <button
                onClick={handleStart}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Bắt Đầu Giám Sát SafeWalk An Toàn Ngay</span>
              </button>

              {/* SafeWalk Buddies (Bạn Đồng Hành Cùng Tuyến Đường) */}
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>Bạn sinh viên đang tìm người đi bộ cùng:</span>
                </h5>
                <div className="space-y-2">
                  {buddies.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">
                          {b.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                          <span>{b.route}</span>
                          <span>•</span>
                          <span className="text-rose-500 font-bold">{b.eta}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Đã gửi yêu cầu ghép đôi đi chung với ${b.name}!`)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] transition shadow-sm"
                      >
                        Ghép Đôi
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Tổng đài an ninh Campus khẩn cấp: <span className="font-bold text-rose-500">1900-9889</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};
