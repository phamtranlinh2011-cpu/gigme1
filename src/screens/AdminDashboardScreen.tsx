import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Lock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ShieldCheck,
  RefreshCw,
  Power,
  Flame,
  ArrowUpRight,
  Smartphone,
  CreditCard,
  Building,
  BarChart3,
  TrendingUp,
  Bot,
  Fingerprint,
  Ban,
  GraduationCap,
  PieChart,
  Eye,
  Check,
  Wrench,
  Trash2,
  X,
  AlertOctagon,
  Copy,
  Terminal,
  Send,
  Radio,
  FileCode,
  HelpCircle,
  ExternalLink,
  Zap,
  CheckCheck,
  QrCode,
  MessageSquare,
  Sparkles,
  Clock,
  Repeat,
  UserPlus,
  Edit,
  Shield,
  Key,
  EyeOff,
  CheckSquare,
  Square,
  Scale,
  Database,
  ShoppingBag,
  FileSpreadsheet,
  LifeBuoy,
  Wallet,
  FileText,
  Briefcase,
} from 'lucide-react';
import { useGigMe } from '../context/GigMeContext';
import { useTranslation } from '../context/LanguageContext';
import {
  formatVnd,
  USER_TIERS,
  UserEntity,
  VIETNAMESE_BANKS,
  WalletTransactionEntity,
  ModPermission,
  DEFAULT_MOD_PERMISSIONS,
  ALL_MOD_PERMISSIONS,
  ALL_FALSE_PERMISSIONS,
} from '../types';
import { auditSybilAndReviewRings, SybilAuditSummary } from '../utils/sybilDetector';
import { AdminMaintenanceModal } from '../components/AdminMaintenanceModal';
import { cloudService } from '../services/cloudSync';
import { triggerHaptic } from '../utils/haptics';

interface AdminDashboardScreenProps {
  onBack: () => void;
}

export const MOD_PERMISSIONS_CONFIG: Array<{
  key: keyof ModPermission;
  label: string;
  desc: string;
  category: 'KIỂM DUYỆT CỐT LÕI' | 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU' | 'VẬN HÀNH CAMPUS & AN NINH';
}> = [
  // 1. Kiểm duyệt cốt lõi (5 quyền)
  {
    key: 'canApproveKyc',
    label: 'Duyệt Thẻ SV & CCCD Chip',
    desc: 'Xét duyệt định danh KYC sinh viên campus',
    category: 'KIỂM DUYỆT CỐT LÕI',
  },
  {
    key: 'canResolveDisputes',
    label: 'Phán Xử Tranh Chấp Kèo',
    desc: 'Trọng tài quỹ Escrow & hòa giải tranh chấp',
    category: 'KIỂM DUYỆT CỐT LÕI',
  },
  {
    key: 'canModerateUsers',
    label: 'Khóa / Mở Khóa Tài Khoản',
    desc: 'Đình chỉ hoặc mở khóa tài khoản vi phạm',
    category: 'KIỂM DUYỆT CỐT LÕI',
  },
  {
    key: 'canModerateGigs',
    label: 'Ẩn / Gỡ Bài Đăng Vi Phạm',
    desc: 'Dọn dẹp bài đăng việc làm vi phạm, spam',
    category: 'KIỂM DUYỆT CỐT LÕI',
  },
  {
    key: 'canManageFinance',
    label: 'Tra Soát Ví Nạp & Rút Tiền',
    desc: 'Kiểm tra lịch sử nạp rút tiền ngân hàng',
    category: 'KIỂM DUYỆT CỐT LÕI',
  },

  // 2. Quản trị Tài Khoản & Người Dùng (3 quyền mới)
  {
    key: 'canCreateUsers',
    label: 'Tạo Tài Khoản Người Dùng Mới',
    desc: 'Cấp tài khoản sinh viên/đối tác trực tiếp',
    category: 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU',
  },
  {
    key: 'canDeleteUsers',
    label: 'Xóa Vĩnh Viễn Tài Khoản',
    desc: 'Xóa hoàn toàn tài khoản gian lận/ảo',
    category: 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU',
  },
  {
    key: 'canEditUsers',
    label: 'Chỉnh Sửa Hồ Sơ & Số Dư',
    desc: 'Cập nhật thông tin & điều chỉnh ví người dùng',
    category: 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU',
  },

  // 3. Quản trị CSDL & Dữ Liệu (2 quyền mới)
  {
    key: 'canManageDatabase',
    label: 'Quản Trị CSDL & Backup Data',
    desc: 'Sao lưu & kiểm tra toàn vẹn dữ liệu Firestore',
    category: 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU',
  },
  {
    key: 'canPurgeData',
    label: 'Xóa / Làm Sạch Dữ Liệu Rác (Purge)',
    desc: 'Làm sạch bài rác, tin nhắn rác & log cũ',
    category: 'QUẢN TRỊ NGƯỜI DÙNG & DỮ LIỆU',
  },

  // 4. Vận hành Dịch Vụ Campus & An Ninh (5 quyền mới)
  {
    key: 'canManageMarketplace',
    label: 'Quản Lý Chợ KTX Campus',
    desc: 'Duyệt/Gỡ tin bán đồ cũ sinh viên thanh lý',
    category: 'VẬN HÀNH CAMPUS & AN NINH',
  },
  {
    key: 'canSendPushBroadcast',
    label: 'Gửi Thông Báo Broadcast',
    desc: 'Đẩy thông báo tới toàn thể sinh viên',
    category: 'VẬN HÀNH CAMPUS & AN NINH',
  },
  {
    key: 'canAuditTransactions',
    label: 'Giám Sát Giao Dịch Bất Thường',
    desc: 'Phát hiện rửa tiền, cọc bất thường & phòng chống gian lận',
    category: 'VẬN HÀNH CAMPUS & AN NINH',
  },
  {
    key: 'canConfigureMaintenance',
    label: 'Cấu Hình Bảo Trì Hệ Thống',
    desc: 'Bật/tắt chế độ bảo trì toàn bộ sàn',
    category: 'VẬN HÀNH CAMPUS & AN NINH',
  },
  {
    key: 'canExportAuditLogs',
    label: 'Xem & Xuất Nhật Ký Kiểm Toán',
    desc: 'Trích xuất file báo cáo kiểm toán & đối soát',
    category: 'VẬN HÀNH CAMPUS & AN NINH',
  },
];

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const {
    currentUser,
    rawGigs,
    adminAllUsers,
    adminAllTransactions,
    adminResolveDispute,
    adminToggleLockUser,
    adminDeleteUser,
    adminPurgeAllUsersExceptAdmin,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    withdrawEWallet,
    withdrawToBank,
    showNotification,
    maintenanceConfig,
    isMaintenanceActive,
    mods,
    createModUser,
    updateModUser,
    deleteModUser,
    updateModPermissions,
    releaseEscrowPayout,
    requestGigRevision,
    deleteGig,
  } = useGigMe();
  const { language, t } = useTranslation();

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserEntity | null>(null);
  const [showPurgeConfirmModal, setShowPurgeConfirmModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserEntity | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const allUsers: UserEntity[] = adminAllUsers || [];
  const adminUser = allUsers.find((u) => u.role === 'ADMIN' || u.id === 'admin_root') || currentUser;
  const adminBalance = adminUser?.walletBalance || 0;
  const adminPhone = adminUser?.phone || '0909120918';
  const adminMoMo = adminUser?.connectedMoMo || '0909120918';

  const [emergencyFreeze, setEmergencyFreeze] = useState(false);
  const toggleEmergencyFreeze = () => setEmergencyFreeze((p) => !p);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(100000);
  const [withdrawTarget, setWithdrawTarget] = useState<'MOMO' | 'BANK'>('MOMO');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccNumber, setBankAccNumber] = useState('');
  const [bankAccHolder, setBankAccHolder] = useState(adminUser?.kycName || 'QUẢN TRỊ VIÊN HỆ THỐNG');

  const totalEscrowLockedVault = allUsers.reduce((sum, u) => sum + (u.escrowLockedBalance || 0), 0);
  const totalPlatformFeesCollected = allUsers.reduce((sum, u) => sum + Math.round((u.totalSpent || 0) * 0.1), 0);

  const [activeTab, setActiveTab] = useState<
    'GIGS' | 'DISPUTES' | 'WITHDRAWALS' | 'USERS' | 'MODS' | 'VAULT' | 'ANALYTICS' | 'SYBIL_DETECTION' | 'BANK_BOT'
  >('GIGS');
  const [gigFilterStatus, setGigFilterStatus] = useState<
    'ALL' | 'SUBMITTED' | 'IN_PROGRESS' | 'OPEN' | 'COMPLETED' | 'DISPUTED'
  >('SUBMITTED');
  const [gigSearchQuery, setGigSearchQuery] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // --- MOD MANAGEMENT STATE & HANDLERS ---
  const [modSearch, setModSearch] = useState('');
  const [modStatusFilter, setModStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [showCreateModModal, setShowCreateModModal] = useState(false);
  const [editingMod, setEditingMod] = useState<UserEntity | null>(null);
  const [modToDelete, setModToDelete] = useState<UserEntity | null>(null);
  const [revealedModPasswords, setRevealedModPasswords] = useState<Record<string, boolean>>({});
  const [copiedModId, setCopiedModId] = useState<string | null>(null);

  // Create form state
  const [newModId, setNewModId] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newModEmail, setNewModEmail] = useState('');
  const [newModPhone, setNewModPhone] = useState('');
  const [newModPassword, setNewModPassword] = useState('');
  const [newModPermissions, setNewModPermissions] = useState<ModPermission>(DEFAULT_MOD_PERMISSIONS);

  // Edit form state
  const [editModName, setEditModName] = useState('');
  const [editModEmail, setEditModEmail] = useState('');
  const [editModPhone, setEditModPhone] = useState('');
  const [editModPassword, setEditModPassword] = useState('');
  const [editModPermissions, setEditModPermissions] = useState<ModPermission>(DEFAULT_MOD_PERMISSIONS);

  // All mod users list reactive to adminAllUsers
  const allMods = useMemo(() => {
    const list = (adminAllUsers || []).filter(
      (u) => u.role === 'MOD' || u.id === '000000001' || u.id === '000000002' || u.id === '000000003'
    );
    return list;
  }, [adminAllUsers]);

  const filteredMods = useMemo(() => {
    return allMods.filter((m) => {
      if (modStatusFilter === 'ACTIVE' && m.isLocked) return false;
      if (modStatusFilter === 'LOCKED' && !m.isLocked) return false;
      if (modSearch.trim()) {
        const q = modSearch.toLowerCase();
        const mName = (m.name || '').toLowerCase().includes(q);
        const mEmail = (m.email || '').toLowerCase().includes(q);
        const mId = (m.id || '').includes(q);
        const mPhone = (m.phone || '').includes(q);
        return mName || mEmail || mId || mPhone;
      }
      return true;
    });
  }, [allMods, modStatusFilter, modSearch]);

  const handleOpenCreateMod = () => {
    const existingIds = new Set(allUsers.map((u) => u.id));
    let nextNum = 1;
    while (existingIds.has(String(nextNum).padStart(9, '0'))) {
      nextNum++;
    }
    const defaultId = String(nextNum).padStart(9, '0');
    setNewModId(defaultId);
    setNewModName(`Kiểm Duyệt Viên ${nextNum}`);
    setNewModEmail(`mod${nextNum}@gigme.vn`);
    setNewModPhone('');
    setNewModPassword(`mod${nextNum}${nextNum}${nextNum}`);
    setNewModPermissions(DEFAULT_MOD_PERMISSIONS);
    setShowCreateModModal(true);
  };

  const handleCreateModSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModName.trim()) {
      showNotification('Thiếu thông tin', 'Vui lòng nhập họ tên kiểm duyệt viên!');
      return;
    }
    if (!newModEmail.trim() || !newModEmail.includes('@')) {
      showNotification('Email không hợp lệ', 'Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }
    triggerHaptic('medium');
    const res = await createModUser({
      id: newModId.trim() || undefined,
      name: newModName.trim(),
      email: newModEmail.trim(),
      phone: newModPhone.trim() || undefined,
      password: newModPassword.trim() || undefined,
      permissions: newModPermissions,
    });
    if (res.success) {
      setShowCreateModModal(false);
    } else {
      showNotification('Không thể tạo mod', res.error || 'Có lỗi xảy ra khi tạo mod');
    }
  };

  const handleOpenEditMod = (mod: UserEntity) => {
    setEditingMod(mod);
    setEditModName(mod.name || '');
    setEditModEmail(mod.email || '');
    setEditModPhone(mod.phone || '');
    setEditModPassword(mod.password || '');
    setEditModPermissions(mod.modPermissions || DEFAULT_MOD_PERMISSIONS);
  };

  const handleEditModSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMod) return;
    triggerHaptic('medium');
    const res = await updateModUser(editingMod.id, {
      name: editModName.trim(),
      email: editModEmail.trim(),
      phone: editModPhone.trim(),
      password: editModPassword.trim() || editingMod.password,
      modPermissions: editModPermissions,
    });
    if (res.success) {
      setEditingMod(null);
    } else {
      showNotification('Lỗi cập nhật', res.error || 'Không thể lưu thay đổi!');
    }
  };

  const handleToggleSinglePermission = async (mod: UserEntity, permKey: keyof ModPermission) => {
    triggerHaptic('light');
    const current = mod.modPermissions || DEFAULT_MOD_PERMISSIONS;
    const updated: ModPermission = {
      ...current,
      [permKey]: !current[permKey],
    };
    await updateModPermissions(mod.id, updated);
  };

  const handleGrantAllPermissions = async (mod: UserEntity) => {
    triggerHaptic('medium');
    await updateModPermissions(mod.id, ALL_MOD_PERMISSIONS);
  };

  const handleRevokeAllPermissions = async (mod: UserEntity) => {
    triggerHaptic('medium');
    await updateModPermissions(mod.id, ALL_FALSE_PERMISSIONS);
  };

  const handleConfirmDeleteMod = async () => {
    if (!modToDelete) return;
    triggerHaptic('error');
    const res = await deleteModUser(modToDelete.id);
    if (res.success) {
      setModToDelete(null);
    } else {
      showNotification('Lỗi xóa mod', res.error || 'Không thể xóa tài khoản này');
    }
  };

  const handleCopyModId = (id: string) => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(id);
    setCopiedModId(id);
    setTimeout(() => setCopiedModId(null), 2000);
    showNotification('Đã sao chép ID', `Đã chép ID 9 số "${id}" vào khay nhớ tạm.`);
  };

  // WITHDRAWALS MANAGEMENT (CÁCH 1: DUYỆT THỦ CÔNG & CHUYỂN KHOẢN QUA VIETQR)
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING');
  const [selectedWithdrawalForQr, setSelectedWithdrawalForQr] = useState<WalletTransactionEntity | null>(null);
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [copiedWithdrawalText, setCopiedWithdrawalText] = useState<string | null>(null);

  const allWithdrawals = useMemo(() => {
    return (adminAllTransactions || []).filter((t) => t.type === 'BANK_WITHDRAWAL');
  }, [adminAllTransactions]);

  const pendingWithdrawals = useMemo(() => {
    return allWithdrawals.filter((t) => t.status === 'PENDING' || (!t.status && !t.isSuccess));
  }, [allWithdrawals]);

  const filteredWithdrawals = useMemo(() => {
    if (withdrawalFilter === 'ALL') return allWithdrawals;
    if (withdrawalFilter === 'PENDING') return pendingWithdrawals;
    if (withdrawalFilter === 'COMPLETED') return allWithdrawals.filter((t) => t.status === 'COMPLETED' || (t.isSuccess && t.status !== 'REJECTED'));
    if (withdrawalFilter === 'REJECTED') return allWithdrawals.filter((t) => t.status === 'REJECTED');
    return allWithdrawals;
  }, [allWithdrawals, pendingWithdrawals, withdrawalFilter]);

  const getBankCode = (bName?: string) => {
    if (!bName) return 'MB';
    const found = VIETNAMESE_BANKS.find(
      (b) =>
        b.code.toLowerCase() === bName.toLowerCase() ||
        b.name.toLowerCase().includes(bName.toLowerCase()) ||
        bName.toLowerCase().includes(b.name.toLowerCase())
    );
    return found ? found.code : 'MB';
  };

  // BANK BOT / SELF-HOSTED WEBHOOK & TELEGRAM CONFIGURATION
  const [bankBotConfig, setBankBotConfig] = useState({
    bankName: 'MBBank',
    bankCode: 'MB',
    accountNumber: '0909120918',
    accountHolder: 'LY HOANG GIA BAO',
    secretKey: 'gigme_secret_bot_2026',
    telegramBotToken: '',
    telegramChatId: '',
    enabled: true,
  });
  const [isSavingBankBot, setIsSavingBankBot] = useState(false);
  const [bankBotSubTab, setBankBotSubTab] = useState<
    'SETUP' | 'WEBHOOK' | 'TELEGRAM' | 'SIMULATOR' | 'SCRIPTS' | 'HISTORY'
  >('SETUP');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Simulator state
  const [testNotificationText, setTestNotificationText] = useState(
    'MB: TK 0909120918 +50,000VND luc 12:30. ND: GIGME 0909120918'
  );
  const [isTestingSimulate, setIsTestingSimulate] = useState(false);
  const [simulateResult, setSimulateResult] = useState<any | null>(null);

  // Telegram Test state
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<any | null>(null);

  // Manual Assign Tx State
  const [assignModalTx, setAssignModalTx] = useState<any | null>(null);
  const [assignTargetInput, setAssignTargetInput] = useState('');
  const [isAssigningTx, setIsAssigningTx] = useState(false);
  const [webhookTxs, setWebhookTxs] = useState<any[]>([]);
  const [isLoadingWebhookTxs, setIsLoadingWebhookTxs] = useState(false);

  const loadBankBotData = async () => {
    try {
      const cfg = await cloudService.getBankBotConfig();
      if (cfg) {
        setBankBotConfig((prev) => ({ ...prev, ...cfg }));
      }
      setIsLoadingWebhookTxs(true);
      const res = await fetch('/api/webhook/status');
      if (res.ok) {
        const data = await res.json();
        setWebhookTxs(data.recentTransactions || []);
      }
    } catch (e) {
      console.warn('loadBankBotData error:', e);
    } finally {
      setIsLoadingWebhookTxs(false);
    }
  };

  useEffect(() => {
    loadBankBotData();
  }, []);

  useEffect(() => {
    if (activeTab === 'BANK_BOT') {
      loadBankBotData();
    }
  }, [activeTab]);

  const handleSaveBankBotConfig = async () => {
    setIsSavingBankBot(true);
    triggerHaptic('medium');
    try {
      const res = await cloudService.saveBankBotConfig(bankBotConfig);
      if (res && res.success !== false) {
        triggerHaptic('success');
        showNotification(
          'Đã Lưu Cấu Hình Bot Thành Công! 🤖',
          'Mã QR nạp tiền và thông số Webhook đã được đồng bộ toàn hệ thống.'
        );
      } else {
        triggerHaptic('error');
        showNotification('Lỗi Lưu Cấu Hình', res?.error || 'Không thể lưu cấu hình');
      }
    } catch (err: any) {
      triggerHaptic('error');
      showNotification('Lỗi Lưu Cấu Hình', err?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSavingBankBot(false);
    }
  };

  const handleTestSimulate = async () => {
    if (!testNotificationText.trim()) {
      triggerHaptic('error');
      showNotification('Thiếu nội dung', 'Vui lòng nhập nội dung thông báo ngân hàng để kiểm tra!');
      return;
    }
    setIsTestingSimulate(true);
    triggerHaptic('medium');
    try {
      const res = await cloudService.testSimulateBankBot(testNotificationText, bankBotConfig.secretKey);
      setSimulateResult(res);
      if (res.success) {
        triggerHaptic('success');
        showNotification(
          'Mô Phỏng Nạp Tiền Thành Công! ⚡',
          `Đã bóc tách: +${res.parsed?.amount?.toLocaleString('vi-VN')}đ (${res.parsed?.bank})`
        );
        loadBankBotData();
      } else {
        triggerHaptic('error');
        showNotification('Phân tích thất bại', res.error || 'Không tìm thấy số tiền hợp lệ');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setSimulateResult({ success: false, error: err?.message || 'Lỗi gửi yêu cầu' });
    } finally {
      setIsTestingSimulate(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!bankBotConfig.telegramBotToken || !bankBotConfig.telegramChatId) {
      triggerHaptic('error');
      showNotification('Thiếu thông tin Telegram', 'Vui lòng nhập cả Telegram Bot Token và Telegram Chat ID!');
      return;
    }
    setIsTestingTelegram(true);
    triggerHaptic('medium');
    try {
      const res = await cloudService.testTelegramBot(
        bankBotConfig.telegramBotToken,
        bankBotConfig.telegramChatId
      );
      setTelegramTestResult(res);
      if (res.success) {
        triggerHaptic('success');
        showNotification(
          'Đã Gửi Tin Nhắn Telegram! 📱',
          'Vui lòng mở ứng dụng Telegram để kiểm tra tin nhắn xác nhận.'
        );
      } else {
        triggerHaptic('error');
        showNotification('Lỗi Telegram', res.error || 'Kiểm tra lại Token hoặc Chat ID');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setTelegramTestResult({ success: false, error: err?.message || 'Lỗi mạng' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleAssignTx = async () => {
    if (!assignModalTx || !assignTargetInput.trim()) {
      triggerHaptic('error');
      showNotification('Thiếu thông tin', 'Vui lòng nhập SĐT hoặc ID sinh viên muốn gán số dư!');
      return;
    }
    setIsAssigningTx(true);
    triggerHaptic('medium');
    try {
      const res = await cloudService.assignBankTransaction(assignModalTx.id, assignTargetInput.trim());
      if (res.success) {
        triggerHaptic('success');
        showNotification('Đối Soát Thành Công! ✅', res.message);
        setAssignModalTx(null);
        setAssignTargetInput('');
        loadBankBotData();
      } else {
        triggerHaptic('error');
        showNotification('Đối Soát Thất Bại', res.error || 'Không tìm thấy sinh viên');
      }
    } catch (err: any) {
      triggerHaptic('error');
      showNotification('Lỗi', err?.message || 'Lỗi không xác định');
    } finally {
      setIsAssigningTx(false);
    }
  };

  const handleCopyClipboard = (text: string, keyName: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
    showNotification('Đã sao chép! 📋', text);
  };

  // Sybil and Bot Audit State
  const [sybilAudit, setSybilAudit] = useState<SybilAuditSummary>(() => auditSybilAndReviewRings(allUsers, rawGigs));
  const [isScanningSybil, setIsScanningSybil] = useState(false);
  const [handledThreatIds, setHandledThreatIds] = useState<string[]>([]);

  // Tự động đồng bộ và loại bỏ các tài khoản đã bị xóa khỏi danh sách cảnh báo nghi vấn
  useEffect(() => {
    const updatedAudit = auditSybilAndReviewRings(allUsers, rawGigs);
    setSybilAudit(updatedAudit);
    // Tự động dọn dẹp các ID đã xử lý nếu người dùng không còn tồn tại
    const currentActiveIds = new Set(allUsers.map((u) => u.id));
    setHandledThreatIds((prev) =>
      prev.filter((threatId) => {
        const uid = threatId.replace('sybil_', '');
        return currentActiveIds.has(uid);
      })
    );
  }, [allUsers, rawGigs]);

  // Bộ lọc chỉ hiển thị các cảnh báo của tài khoản thực tế còn tồn tại trong hệ thống (Loại trừ hoàn toàn tài khoản đã bị xóa)
  const activeThreats = useMemo(() => {
    const activeUserMap = new Map(allUsers.map((u) => [u.id, u]));
    return sybilAudit.threats.filter((t) => {
      const u = activeUserMap.get(t.userId);
      return Boolean(u && u.id !== '000000000' && u.id !== 'admin_root' && u.role !== 'ADMIN' && u.email !== 'admin@admin.vn');
    });
  }, [sybilAudit.threats, allUsers]);

  const activeFlaggedCount = activeThreats.length;
  const activeHighRiskRingsCount = activeThreats.filter((t) => t.threatLevel === 'HIGH_RISK_SYBIL_RING').length;

  const handleRunSybilScan = () => {
    setIsScanningSybil(true);
    setTimeout(() => {
      const res = auditSybilAndReviewRings(allUsers, rawGigs);
      setSybilAudit(res);
      setIsScanningSybil(false);
      showNotification('Quét An Toàn Hoàn Tất! 🛡️', `Đã quét ${res.totalScannedUsers} tài khoản, phát hiện ${res.flaggedCount} trường hợp nghi vấn.`);
    }, 600);
  };

  const handleFreezeUser = (userId: string, threatId: string) => {
    setHandledThreatIds((prev) => [...prev, threatId]);
    showNotification('Đã Đóng Băng Tài Khoản! 🚫', `Tài khoản mã ${userId} đã bị vô hiệu hóa quyền rút tiền và nhận việc.`);
  };

  const handleDismissThreat = (threatId: string) => {
    setHandledThreatIds((prev) => [...prev, threatId]);
    showNotification('Đã Đánh Dấu An Toàn', 'Trường hợp nghi vấn đã được bỏ qua và lưu nhật ký.');
  };

  const disputedGigs = rawGigs.filter((g) => g.status === 'DISPUTED');
  const submittedGigs = rawGigs.filter((g) => g.status === 'SUBMITTED');

  const filteredDashboardGigs = useMemo(() => {
    return rawGigs.filter((g) => {
      if (gigFilterStatus === 'SUBMITTED' && g.status !== 'SUBMITTED') return false;
      if (gigFilterStatus === 'IN_PROGRESS' && g.status !== 'IN_PROGRESS') return false;
      if (gigFilterStatus === 'OPEN' && g.status !== 'OPEN') return false;
      if (gigFilterStatus === 'COMPLETED' && g.status !== 'COMPLETED') return false;
      if (gigFilterStatus === 'DISPUTED' && g.status !== 'DISPUTED') return false;
      if (gigSearchQuery.trim()) {
        const q = gigSearchQuery.toLowerCase();
        const mTitle = (g.title || '').toLowerCase().includes(q);
        const mClient = (g.clientName || '').toLowerCase().includes(q);
        const mWorker = (g.freelancerName || '').toLowerCase().includes(q);
        const mId = (g.id || '').toLowerCase().includes(q);
        return mTitle || mClient || mWorker || mId;
      }
      return true;
    });
  }, [rawGigs, gigFilterStatus, gigSearchQuery]);

  // Analytics Metrics
  const completedGigs = rawGigs.filter((g) => g.status === 'COMPLETED');
  const inProgressGigs = rawGigs.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'SUBMITTED');
  const openGigs = rawGigs.filter((g) => g.status === 'OPEN');
  const totalEscrowVolume = rawGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disbursedEscrowVolume = completedGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const pendingEscrowVolume = inProgressGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disputedEscrowVolume = disputedGigs.reduce((acc, g) => acc + (g.price || 0), 0);
  const disputeRate = ((disputedGigs.length / Math.max(1, rawGigs.length)) * 100).toFixed(1);

  const campusStats = [
    {
      name: 'ĐHQG TP.HCM (KTX Khu A, Khu B, Trường TV)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('đhqg') || (g.locationName || g.location || '').toLowerCase().includes('ktx') || (g.locationName || g.location || '').toLowerCase().includes('khu a') || (g.locationName || g.location || '').toLowerCase().includes('khu b')).length || Math.max(4, Math.floor(rawGigs.length * 0.45)),
      color: 'bg-blue-500',
    },
    {
      name: 'ĐH Bách Khoa TP.HCM (Q10 & Thủ Đức)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('bách khoa') || (g.locationName || g.location || '').toLowerCase().includes('q10')).length || Math.max(2, Math.floor(rawGigs.length * 0.2)),
      color: 'bg-cyan-500',
    },
    {
      name: 'ĐH Kinh Tế TP.HCM (UEH Nguyễn Tri Phương)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('ueh') || (g.locationName || g.location || '').toLowerCase().includes('kinh tế')).length || Math.max(2, Math.floor(rawGigs.length * 0.15)),
      color: 'bg-amber-500',
    },
    {
      name: 'ĐH FPT TP.HCM (Khu Công Nghệ Cao Q9)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('fpt') || (g.locationName || g.location || '').toLowerCase().includes('q9')).length || Math.max(1, Math.floor(rawGigs.length * 0.1)),
      color: 'bg-orange-500',
    },
    {
      name: 'ĐH Sư Phạm Kỹ Thuật (HCMUTE Võ Văn Ngân)',
      count: rawGigs.filter((g) => (g.locationName || g.location || '').toLowerCase().includes('spkt') || (g.locationName || g.location || '').toLowerCase().includes('hcmute')).length || Math.max(1, Math.floor(rawGigs.length * 0.07)),
      color: 'bg-emerald-500',
    },
    {
      name: 'Các Campus & KTX khác trong thành phố',
      count: Math.max(1, Math.floor(rawGigs.length * 0.05)),
      color: 'bg-purple-500',
    },
  ];

  const handleAdminWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      showNotification('Lỗi số tiền', 'Vui lòng nhập số tiền hợp lệ lớn hơn 0đ.');
      return;
    }
    if (withdrawAmount > adminBalance) {
      showNotification('Số dư không đủ', `Số dư ví doanh thu sàn hiện có ${formatVnd(adminBalance)}, không đủ để rút.`);
      return;
    }

    if (withdrawTarget === 'MOMO') {
      const ok = withdrawEWallet('MoMo', withdrawAmount, adminMoMo);
      if (ok) {
        showNotification(
          'Đã Rút Tiền Về MoMo Thành Công! 📱',
          `Đã chuyển ${formatVnd(withdrawAmount)} từ tài khoản trang mạng về MoMo số ${adminMoMo}.`,
          true,
          true
        );
        setShowWithdrawForm(false);
      }
    } else {
      if (!bankAccNumber.trim()) {
        showNotification('Thiếu số tài khoản', 'Vui lòng nhập số tài khoản ngân hàng nhận tiền.');
        return;
      }
      const ok = withdrawToBank(bankName, bankAccNumber, bankAccHolder, withdrawAmount, adminUser?.securityPin || '123456');
      if (ok) {
        showNotification(
          'Đã Rút Tiền Về Ngân Hàng Thành Công! 🏦',
          `Đã chuyển ${formatVnd(withdrawAmount)} tới ${bankName} (${bankAccNumber}) qua Napas247.`,
          true,
          true
        );
        setShowWithdrawForm(false);
      }
    }
  };

  const cleanSearch = (userSearch || '').trim().toLowerCase();
  const filteredUsers = allUsers.filter((u: UserEntity) => {
    if (!u) return false;
    if (!cleanSearch) return true;
    const name = String(u.name || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const phone = String(u.phone || '').toLowerCase();
    const id = String(u.id || '').toLowerCase();
    const kycName = String(u.kycName || '').toLowerCase();
    const cccd = String(u.cccdNumber || '').toLowerCase();
    return (
      name.includes(cleanSearch) ||
      email.includes(cleanSearch) ||
      phone.includes(cleanSearch) ||
      id.includes(cleanSearch) ||
      kycName.includes(cleanSearch) ||
      cccd.includes(cleanSearch)
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-28 text-white space-y-6 text-xs">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#C5E5EC]/20">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-[#12233B] hover:bg-[#152844] text-[#C5E5EC] border border-[#C5E5EC]/25 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white flex items-center">
                <ShieldAlert className="w-5 h-5 text-rose-400 mr-1.5" />
                GigMe Master Admin Console
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600/80 text-white font-black border border-rose-400/40">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-[11px] text-[#C5E5EC]/70">
              Hệ thống giám sát quỹ Smart Escrow Vault & Trọng tài phân xử khiếu nại
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* System Maintenance Button */}
          <button
            type="button"
            onClick={() => setShowMaintenanceModal(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-extrabold text-xs transition border cursor-pointer ${
              isMaintenanceActive
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-[#12233B] border-[#C5E5EC]/25 text-[#C5E5EC] hover:text-white hover:border-[#C5E5EC]/50'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>{isMaintenanceActive ? 'ĐANG BẢO TRÌ' : 'Cài Đặt Bảo Trì'}</span>
            {isMaintenanceActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </button>

          {/* Emergency Freeze Switch */}
          <button
            onClick={toggleEmergencyFreeze}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-extrabold text-xs transition border cursor-pointer ${
              emergencyFreeze
                ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-[#12233B] border-[#C5E5EC]/25 text-[#C5E5EC] hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{emergencyFreeze ? 'ĐANG ĐÓNG BĂNG HỆ THỐNG' : 'Công Tắc Khẩn Cấp'}</span>
          </button>
        </div>
      </div>

      {/* Global Maintenance Alert Banner for Admin */}
      {isMaintenanceActive && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#12233B] to-amber-950/70 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 flex-shrink-0">
              <Wrench className="w-5 h-5 text-amber-400 animate-spin" />
            </div>
            <div>
              <div className="font-extrabold text-amber-300 flex items-center space-x-2">
                <span>CHẾ ĐỘ BẢO TRÌ ĐANG KÍCH HOẠT TRÊN TOÀN SÀN</span>
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 font-mono">
                  CLOUD SYNC ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-[#C5E5EC]/80 mt-0.5">
                Dự kiến kết thúc: <span className="text-white font-bold">{new Date(maintenanceConfig.endTime).toLocaleString('vi-VN')}</span>. Người dùng thông thường chỉ có quyền xem thông tin cá nhân.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs hover:brightness-110 transition whitespace-nowrap shadow cursor-pointer"
          >
            Quản Lý Thời Gian & Nội Dung
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 shadow-lg">
          <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
            <Lock className="w-4 h-4 text-[#C5E5EC]" />
            <span>Tổng Quỹ Escrow Đang Khóa</span>
          </span>
          <span className="text-xl font-black text-[#C5E5EC] font-mono">
            {formatVnd(totalEscrowLockedVault)}
          </span>
          <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Đảm bảo an toàn không thể rút gian lận</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 shadow-lg">
          <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
            <DollarSign className="w-4 h-4 text-[#E0FAEB]" />
            <span>Doanh Thu Phí Sàn (7-10%)</span>
          </span>
          <span className="text-xl font-black text-[#E0FAEB] font-mono">
            {formatVnd(totalPlatformFeesCollected)}
          </span>
          <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Tự động trích từ các giao dịch hoàn tất</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 shadow-lg">
          <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Tranh Chấp Cần Xử Lý</span>
          </span>
          <span className="text-xl font-black text-rose-400 font-mono">
            {disputedGigs.length} vụ việc
          </span>
          <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Yêu cầu phán quyết trong 24 giờ</p>
        </div>
      </div>

      {/* ADMIN REVENUE WALLET & AUTO-WITHDRAWAL HUB */}
      <div className="rounded-3xl bg-gradient-to-br from-[#12233B] via-[#0E1B2E] to-[#0A1628] border border-[#C5E5EC]/30 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C5E5EC]/20">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-[#3064AE]/30 text-[#C5E5EC] border border-[#C5E5EC]/20">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">Ví Doanh Thu Trang Mạng Của Admin</h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  Tiền phí 10% từ các giao dịch tự động đổ vào ví này để Admin tự rút về
                </p>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-[#C5E5EC]/80 font-semibold block">Số dư quỹ doanh thu:</span>
            <span className="text-2xl font-black text-[#E0FAEB] font-mono tracking-tight">
              {formatVnd(adminBalance)}
            </span>
          </div>
        </div>

        {/* Connected MoMo and Bank details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-pink-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-pink-500/15 text-pink-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Ví MoMo Admin</span>
                <span className="text-[11px] text-[#C5E5EC]/70 font-mono">SĐT: {adminMoMo}</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              ĐÃ LIÊN KẾT
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#12233B] text-[#C5E5EC]">
                <Building className="w-4 h-4 text-[#E0FAEB]" />
              </div>
              <div>
                <span className="font-bold text-white block">Tài Khoản SĐT Admin</span>
                <span className="text-[11px] text-[#C5E5EC]/70 font-mono">{adminPhone}</span>
              </div>
            </div>
            <button
              onClick={() => setShowWithdrawForm((p) => !p)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white font-extrabold text-xs hover:brightness-110 shadow-sm border border-[#E0FAEB]/30 transition flex items-center space-x-1 cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{showWithdrawForm ? 'Đóng Form' : 'Rút Doanh Thu'}</span>
            </button>
          </div>
        </div>

        {/* Withdrawal Form */}
        {showWithdrawForm && (
          <form onSubmit={handleAdminWithdraw} className="p-4 rounded-2xl bg-[#081120] border border-[#C5E5EC]/25 space-y-3 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-xs">Tạo Lệnh Rút Tiền Doanh Thu</span>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setWithdrawTarget('MOMO')}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                    withdrawTarget === 'MOMO'
                      ? 'bg-pink-600 text-white shadow'
                      : 'bg-[#12233B] text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  Rút Về MoMo ({adminMoMo})
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawTarget('BANK')}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                    withdrawTarget === 'BANK'
                      ? 'bg-gradient-to-r from-[#3064AE] to-[#25735B] text-white shadow border border-[#E0FAEB]/30'
                      : 'bg-[#12233B] text-[#C5E5EC]/70 hover:text-white'
                  }`}
                >
                  Rút Về Ngân Hàng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#C5E5EC]/80 mb-1 font-semibold">Số tiền muốn rút (VND)</label>
                <input
                  type="number"
                  step="10000"
                  min="10000"
                  max={adminBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono font-bold focus:border-[#C5E5EC] focus:outline-none"
                  placeholder="50000"
                />
                <span className="text-[10px] text-[#C5E5EC]/60 mt-1 block">
                  Khả dụng: {formatVnd(adminBalance)}
                </span>
              </div>

              {withdrawTarget === 'MOMO' ? (
                <div>
                  <label className="block text-[#C5E5EC]/80 mb-1 font-semibold">Số MoMo thụ hưởng</label>
                  <input
                    type="text"
                    disabled
                    value={adminMoMo}
                    className="w-full px-3 py-2 rounded-xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-pink-300 font-mono font-bold cursor-not-allowed"
                  />
                  <span className="text-[10px] text-pink-400 mt-1 block">
                    Tiền chuyển tức thì sang ví MoMo chính chủ của Admin
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[#C5E5EC]/80 mb-1 font-semibold">Ngân hàng</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-[#C5E5EC] focus:outline-none"
                    >
                      <option value="Vietcombank">Vietcombank - NHTM Ngoại Thương</option>
                      <option value="MBBank">MBBank - Ngân Hàng Quân Đội</option>
                      <option value="Techcombank">Techcombank - Kỹ Thương</option>
                      <option value="ACB">ACB - Á Châu</option>
                      <option value="TPBank">TPBank - Tiên Phong</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#C5E5EC]/80 mb-1 font-semibold">Số tài khoản nhận</label>
                    <input
                      type="text"
                      required
                      value={bankAccNumber}
                      onChange={(e) => setBankAccNumber(e.target.value)}
                      placeholder="0909120918"
                      className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-[#C5E5EC] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={adminBalance <= 0 || withdrawAmount > adminBalance}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] disabled:opacity-50 text-white font-extrabold text-xs hover:brightness-110 shadow-lg border border-[#E0FAEB]/30 transition cursor-pointer"
              >
                Xác Nhận Rút {formatVnd(withdrawAmount)}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap bg-[#0E1B2E] p-1 rounded-2xl border border-[#C5E5EC]/20 font-bold text-xs gap-1">
        <button
          onClick={() => setActiveTab('GIGS')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'GIGS'
              ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white shadow-lg border border-[#E0FAEB]/30'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-[#E0FAEB]" />
          <span>Duyệt Việc Làm</span>
          {submittedGigs.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-900 text-[9px] font-black animate-pulse">
              {submittedGigs.length}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] text-[9px] font-mono font-bold">
              {rawGigs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'DISPUTES' ? 'bg-rose-600 text-white shadow' : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          Khiếu Nại ({disputedGigs.length})
        </button>

        <button
          onClick={() => setActiveTab('WITHDRAWALS')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'WITHDRAWALS'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg border border-cyan-400/40'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Duyệt Rút Tiền</span>
          {pendingWithdrawals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse">
              {pendingWithdrawals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition cursor-pointer ${
            activeTab === 'USERS' ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white shadow border border-[#E0FAEB]/30' : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          Người Dùng ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('MODS')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'MODS'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-950/40 border border-purple-400/40'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
          <span>Quản Lý Mods</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold border border-purple-400/30">
            {allMods.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
            activeTab === 'ANALYTICS' ? 'bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] text-white shadow border border-[#E0FAEB]/30' : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Báo Cáo & Phân Tích</span>
        </button>

        <button
          onClick={() => setActiveTab('SYBIL_DETECTION')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
            activeTab === 'SYBIL_DETECTION' ? 'bg-amber-600 text-white shadow' : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chống Bot & Sybil</span>
          {activeFlaggedCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black">
              {activeFlaggedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('BANK_BOT')}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'BANK_BOT'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/40'
              : 'text-[#C5E5EC]/70 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bot Webhook Nạp Tiền</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-400/30">
            100% Free
          </span>
        </button>
      </div>

      {/* TAB 0: GIGS MANAGEMENT & COMPLETION APPROVAL */}
      {activeTab === 'GIGS' && (
        <div className="space-y-4">
          {/* Top Control Bar: Filters & Search */}
          <div className="p-4 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-[#E0FAEB]" />
                  <span>Kiểm Duyệt & Quản Lý Công Việc Campus</span>
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                  Duyệt nghiệm thu đơn việc, giải ngân Escrow cho sinh viên, giải quyết yêu cầu sửa hoặc xóa bài vi phạm.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'SUBMITTED', label: 'Chờ Duyệt', count: submittedGigs.length, highlight: true },
                    { id: 'IN_PROGRESS', label: 'Đang Làm', count: inProgressGigs.filter((g) => g.status === 'IN_PROGRESS').length, highlight: false },
                    { id: 'OPEN', label: 'Đang Mở', count: openGigs.length, highlight: false },
                    { id: 'ALL', label: 'Tất Cả', count: rawGigs.length, highlight: false },
                    { id: 'COMPLETED', label: 'Đã Xong', count: completedGigs.length, highlight: false },
                    { id: 'DISPUTED', label: 'Khiếu Nại', count: disputedGigs.length, highlight: false },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setGigFilterStatus(f.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      gigFilterStatus === f.id
                        ? f.highlight
                          ? 'bg-emerald-500 text-slate-900 shadow-md font-black'
                          : 'bg-gradient-to-r from-[#3064AE] to-[#25735B] text-white shadow-md'
                        : 'bg-[#12233B] text-[#C5E5EC]/70 hover:text-white border border-[#C5E5EC]/15'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        gigFilterStatus === f.id
                          ? 'bg-black/20 text-current font-black'
                          : 'bg-[#3064AE]/30 text-[#C5E5EC]'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3 top-2.5" />
              <input
                type="text"
                value={gigSearchQuery}
                onChange={(e) => setGigSearchQuery(e.target.value)}
                placeholder="Tìm việc làm theo tiêu đề, ID đơn, người đăng, người nhận..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/20 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-hidden focus:border-[#C5E5EC]"
              />
            </div>
          </div>

          {/* List of Gigs */}
          {filteredDashboardGigs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC]/60 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#E0FAEB] mx-auto" />
              <p className="font-bold text-white text-sm">Không có công việc nào trong danh mục này!</p>
              <p className="text-xs text-[#C5E5EC]/70">Hãy thử chọn bộ lọc khác hoặc tìm kiếm từ khóa khác.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDashboardGigs.map((gig) => {
                const isSubmitted = gig.status === 'SUBMITTED';
                const isInProgress = gig.status === 'IN_PROGRESS';
                const isOpen = gig.status === 'OPEN';
                const isCompleted = gig.status === 'COMPLETED';

                return (
                  <div
                    key={gig.id}
                    className={`p-4 sm:p-5 rounded-3xl bg-[#0E1B2E] border transition shadow-xl space-y-3 relative overflow-hidden ${
                      isSubmitted
                        ? 'border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-emerald-950/30'
                        : isInProgress
                        ? 'border-[#3064AE]/50'
                        : 'border-[#C5E5EC]/20'
                    }`}
                  >
                    {isSubmitted && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5E5EC] to-teal-400" />
                    )}

                    {/* Header Row: Status, Category, ID, Price */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            isSubmitted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                              : isInProgress
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : isOpen
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : isCompleted
                              ? 'bg-[#E0FAEB]/20 text-[#E0FAEB] border-[#E0FAEB]/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {isSubmitted
                            ? '📸 CHỜ DUYỆT NGHIỆM THU'
                            : isInProgress
                            ? '⚡ ĐANG THỰC HIỆN'
                            : isOpen
                            ? '🟢 ĐANG MỞ NHẬN VIỆC'
                            : isCompleted
                            ? '✅ ĐÃ HOÀN TẤT & GIẢI NGÂN'
                            : gig.status}
                        </span>

                        <span className="text-[10px] text-[#C5E5EC] font-bold px-2 py-0.5 rounded-full bg-[#12233B] border border-[#C5E5EC]/20">
                          {gig.category}
                        </span>

                        <span className="text-[10px] font-mono text-[#C5E5EC]/60 hidden sm:inline">
                          #{gig.id}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#C5E5EC]/60 block font-semibold">
                          Thù lao Escrow:
                        </span>
                        <span className="text-base font-black text-[#E0FAEB] font-mono">
                          {formatVnd(gig.price)}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{gig.title}</h4>
                      <p className="text-xs text-[#C5E5EC]/80 mt-1 line-clamp-2">{gig.description}</p>
                    </div>

                    {/* Client & Freelancer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-[#12233B]/70 border border-[#C5E5EC]/15">
                      <div>
                        <span className="text-[10px] text-[#C5E5EC]/60 block font-semibold">Người Đăng Việc (Client):</span>
                        <span className="font-bold text-white">{gig.clientName}</span>
                        <span className="text-[10px] text-[#C5E5EC]/60 block font-mono">ID: {gig.clientId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#C5E5EC]/60 block font-semibold">Người Nhận Việc (Worker):</span>
                        <span className="font-bold text-white">
                          {gig.freelancerName || (isOpen ? '— Chưa có ai nhận —' : 'Không xác định')}
                        </span>
                        {gig.freelancerId && (
                          <span className="text-[10px] text-[#C5E5EC]/60 block font-mono">ID: {gig.freelancerId}</span>
                        )}
                      </div>
                    </div>

                    {/* PROOF OF WORK DETAILS (If SUBMITTED) */}
                    {isSubmitted && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-[#12233B] border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Bằng Chứng Nghiệm Thu Thợ Đã Nộp:</span>
                          </span>
                          {gig.proofTimestamp && (
                            <span className="text-[10px] text-[#C5E5EC]/70 font-mono">
                              {new Date(gig.proofTimestamp).toLocaleTimeString('vi-VN')} {new Date(gig.proofTimestamp).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {gig.proofNote && (
                          <p className="text-xs text-slate-200 bg-black/30 p-2 rounded-xl italic">
                            "{gig.proofNote}"
                          </p>
                        )}

                        {gig.proofImageUrl && (
                          <div className="relative rounded-xl overflow-hidden border border-[#C5E5EC]/30 max-h-56 bg-black flex items-center justify-center">
                            <img
                              src={gig.proofImageUrl}
                              alt="Proof of work"
                              className="max-h-56 w-auto object-contain"
                            />
                            {gig.proofGpsCoords && (
                              <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-cyan-300">
                                GPS: {gig.proofGpsCoords.lat.toFixed(4)}°N, {gig.proofGpsCoords.lng.toFixed(4)}°E
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons for Moderators / Admin */}
                    <div className="pt-2 border-t border-[#C5E5EC]/15 flex flex-wrap items-center justify-end gap-2">
                      {/* BUTTON 1: DUYỆT HOÀN THÀNH & GIẢI NGÂN ESCROW */}
                      {(isSubmitted || isInProgress) && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('success');
                            const confirmApprove = window.confirm(
                              `Xác nhận phê duyệt hoàn thành đơn "${gig.title}" và giải ngân ${formatVnd(gig.price)} từ Quỹ Escrow cho thợ ${gig.freelancerName || 'làm việc'}?`
                            );
                            if (confirmApprove) {
                              const ok = releaseEscrowPayout(gig.id);
                              if (ok) {
                                showNotification(
                                  'Đã Phê Duyệt & Giải Ngân!',
                                  `Đã giải ngân thành công ${formatVnd(gig.price)} cho sinh viên ${gig.freelancerName || 'làm việc'}.`,
                                  true,
                                  true
                                );
                              }
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 transition flex items-center space-x-1.5 active:scale-95 cursor-pointer border border-emerald-400/40"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Duyệt Hoàn Thành & Giải Ngân Escrow ({formatVnd(gig.price)})</span>
                        </button>
                      )}

                      {/* BUTTON 2: YÊU CẦU CHỈNH SỬA LẠI */}
                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => {
                            const note = window.prompt('Nhập lý do / nội dung yêu cầu thợ chỉnh sửa lại:');
                            if (note && note.trim()) {
                              requestGigRevision(gig.id, note.trim());
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Yêu Cầu Sửa Lại</span>
                        </button>
                      )}

                      {/* BUTTON 3: GỠ / XÓA BÀI ĐĂNG */}
                      <button
                        type="button"
                        onClick={async () => {
                          const confirmDel = window.confirm(
                            `Bạn có chắc chắn muốn xóa bài đăng "${gig.title}"? Tiền cọc Escrow (nếu chưa giải ngân) sẽ được hoàn trả cho người đăng.`
                          );
                          if (confirmDel) {
                            await deleteGig(gig.id);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Gỡ / Xóa Đơn</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: DISPUTES ARBITRATION */}
      {activeTab === 'DISPUTES' && (
        <div className="space-y-3">
          {disputedGigs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC]/60">
              <CheckCircle2 className="w-10 h-10 text-[#E0FAEB] mx-auto mb-2" />
              <p className="font-bold text-white">Hệ thống đang hoạt động an toàn!</p>
              <p className="text-[#C5E5EC]/70 mt-1">Không có khiếu nại tranh chấp nào đang chờ xử lý.</p>
            </div>
          ) : (
            disputedGigs.map((gig) => (
              <div
                key={gig.id}
                className="p-5 rounded-3xl bg-[#0E1B2E] border border-rose-500/40 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 font-black border border-rose-700/50">
                      TRANH CHẤP
                    </span>
                    <h3 className="font-extrabold text-sm text-white mt-1">{gig.title}</h3>
                  </div>
                  <span className="font-mono font-black text-base text-[#E0FAEB]">
                    {formatVnd(gig.price)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20 space-y-1">
                  <p className="text-[#C5E5EC]">
                    <strong>Người thuê:</strong> {gig.clientName}
                  </p>
                  <p className="text-[#C5E5EC]">
                    <strong>Người làm:</strong> {gig.freelancerName || 'Chưa nhận'}
                  </p>
                  <p className="text-rose-300">
                    <strong>Nội dung khiếu nại:</strong> &quot;{gig.disputeReason || 'Bất đồng chất lượng hoặc thời hạn'}&quot;
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => adminResolveDispute(gig.id, 'Hoàn tiền cho người thuê', true, 'Phán quyết trọng tài')}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Phán Quyết: Hoàn Tiền Cho Người Thuê</span>
                  </button>

                  <button
                    onClick={() => adminResolveDispute(gig.id, 'Giải ngân cho freelancer', false, 'Phán quyết trọng tài')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3064AE] via-[#2A5594] to-[#25735B] hover:brightness-110 text-white font-extrabold transition flex items-center justify-center space-x-1.5 border border-[#E0FAEB]/30 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phán Quyết: Giải Ngân Cho Freelancer</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: WITHDRAWALS MANAGEMENT (CÁCH 1: DUYỆT THỦ CÔNG & CHUYỂN KHOẢN VIETQR) */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#12233B] via-[#0E1B2E] to-[#0A1628] border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
                  <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-base text-white">Duyệt Rút Tiền & Chuyển Khoản (Cách 1)</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CHỦ ĐỘNG 100%
                    </span>
                  </div>
                  <p className="text-xs text-[#C5E5EC]/80 mt-0.5">
                    Kiểm soát 100% dòng tiền ra: Quét mã VietQR trên điện thoại của bạn để chuyển tiền siêu tốc, sau đó bấm Xác nhận.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#C5E5EC]/15">
              <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-amber-500/30">
                <span className="text-[11px] text-amber-300 font-bold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đang Chờ Duyệt</span>
                </span>
                <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">
                  {pendingWithdrawals.length} lệnh
                </span>
                <span className="text-[10px] text-[#C5E5EC]/60 block font-mono">
                  {formatVnd(pendingWithdrawals.reduce((sum, w) => sum + Math.abs(w.amount), 0))}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-emerald-500/30">
                <span className="text-[11px] text-emerald-300 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã Hoàn Tất</span>
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  {allWithdrawals.filter((w) => w.status === 'COMPLETED' || (w.isSuccess && w.status !== 'REJECTED')).length} lệnh
                </span>
                <span className="text-[10px] text-[#C5E5EC]/60 block font-mono">
                  {formatVnd(
                    allWithdrawals
                      .filter((w) => w.status === 'COMPLETED' || (w.isSuccess && w.status !== 'REJECTED'))
                      .reduce((sum, w) => sum + Math.abs(w.amount), 0)
                  )}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[#C5E5EC]/70 font-bold flex items-center space-x-1">
                  <Building className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tổng Yêu Cầu</span>
                </span>
                <span className="text-lg font-black text-white font-mono mt-0.5 block">
                  {allWithdrawals.length} lệnh
                </span>
                <span className="text-[10px] text-[#C5E5EC]/60 block">
                  Cập nhật theo thời gian thực
                </span>
              </div>
            </div>
          </div>

          {/* Filter Sub-Tabs */}
          <div className="flex bg-[#0E1B2E] p-1 rounded-2xl border border-[#C5E5EC]/20 text-xs font-bold gap-1 overflow-x-auto">
            <button
              onClick={() => setWithdrawalFilter('PENDING')}
              className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                withdrawalFilter === 'PENDING'
                  ? 'bg-amber-500 text-black shadow font-black'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <span>Chờ chuyển ({pendingWithdrawals.length})</span>
            </button>
            <button
              onClick={() => setWithdrawalFilter('COMPLETED')}
              className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                withdrawalFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow font-black'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <span>Đã chuyển</span>
            </button>
            <button
              onClick={() => setWithdrawalFilter('REJECTED')}
              className={`flex-1 min-w-[110px] py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                withdrawalFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow font-black'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <span>Đã từ chối</span>
            </button>
            <button
              onClick={() => setWithdrawalFilter('ALL')}
              className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                withdrawalFilter === 'ALL'
                  ? 'bg-[#3064AE] text-white shadow font-black'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <span>Tất cả ({allWithdrawals.length})</span>
            </button>
          </div>

          {/* Withdrawals List */}
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-14 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC]/60 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-sm">
                {withdrawalFilter === 'PENDING' ? 'Hiện không có yêu cầu rút tiền nào đang chờ xử lý!' : 'Không có giao dịch nào trong mục này.'}
              </p>
              <p className="text-xs text-[#C5E5EC]/60">
                Khi sinh viên rút tiền về tài khoản ngân hàng, yêu cầu sẽ lập tức xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWithdrawals.map((w) => {
                const targetUser = allUsers.find((u) => u.id === w.userId);
                const isPending = w.status === 'PENDING' || (!w.status && !w.isSuccess);
                const isCompleted = w.status === 'COMPLETED' || (w.isSuccess && w.status !== 'REJECTED');
                const isRejected = w.status === 'REJECTED';
                const bank = w.bankName || 'Ngân hàng';
                const accNum = w.accountNumber || '';
                const holder = w.accountHolderName || targetUser?.kycName || targetUser?.name || 'CHỦ TÀI KHOẢN';
                const amountVal = Math.abs(w.amount);
                const bankCode = getBankCode(bank);

                return (
                  <div
                    key={w.id}
                    className={`p-4 sm:p-5 rounded-3xl bg-[#0E1B2E] border transition shadow-xl space-y-3 ${
                      isPending
                        ? 'border-amber-500/50 bg-gradient-to-br from-[#12233B] to-[#0E1B2E]'
                        : isCompleted
                        ? 'border-emerald-500/30'
                        : 'border-rose-500/30 opacity-75'
                    }`}
                  >
                    {/* Top Row: User info & Amount */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C5E5EC]/15">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#162B48] border border-[#C5E5EC]/20 flex items-center justify-center font-bold text-white uppercase text-sm">
                          {targetUser?.name ? targetUser.name.slice(0, 2) : 'SV'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-white text-sm">
                              {targetUser?.name || 'Sinh viên'}
                            </h4>
                            {targetUser?.studentId && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3064AE]/30 text-[#C5E5EC] font-mono font-bold">
                                {targetUser.studentId}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#C5E5EC]/70 flex items-center space-x-2 mt-0.5">
                            <span>SĐT: <strong className="text-white font-mono">{targetUser?.phone || targetUser?.email || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>ID: <strong className="text-white font-mono">{targetUser?.id ? targetUser.id.slice(-9) : 'N/A'}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                          {formatVnd(amountVal)}
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center space-x-1 ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isPending && <Clock className="w-2.5 h-2.5 animate-spin" />}
                          {isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {isRejected && <XCircle className="w-2.5 h-2.5" />}
                          <span>{isPending ? 'Chờ Chuyển Tiền' : isCompleted ? 'Đã Chuyển Khoản' : 'Đã Từ Chối'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bank Transfer Details Card */}
                    <div className="p-3.5 rounded-2xl bg-[#12233B]/90 border border-[#C5E5EC]/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#C5E5EC]/60 text-[11px] block">Ngân hàng thụ hưởng:</span>
                        <span className="text-white font-bold flex items-center space-x-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{bank}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono font-bold">
                            {bankCode}
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[#C5E5EC]/60 text-[11px] block">Số tài khoản:</span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-emerald-300 font-mono font-black text-sm">{accNum}</span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              navigator.clipboard.writeText(accNum);
                              setCopiedWithdrawalText(accNum);
                              setTimeout(() => setCopiedWithdrawalText(null), 2000);
                            }}
                            className="p-1 rounded bg-[#0E1B2E] hover:bg-slate-700 text-[#C5E5EC] transition text-[10px] flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedWithdrawalText === accNum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedWithdrawalText === accNum ? 'Đã chép' : 'Sao chép'}</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#C5E5EC]/60 text-[11px] block">Tên chủ tài khoản:</span>
                        <span className="text-white font-extrabold uppercase mt-0.5 flex items-center space-x-1">
                          <span>{holder}</span>
                          <span className="text-emerald-400 text-[10px] font-bold">✓ Khớp KYC</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[#C5E5EC]/60 text-[11px] block">Thời gian tạo:</span>
                        <span className="text-slate-300 font-mono mt-0.5 block">
                          {new Date(w.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {isRejected && w.rejectionReason && (
                        <div className="sm:col-span-2 p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
                          <strong>Lý do từ chối:</strong> {w.rejectionReason} (Đã hoàn lại tiền vào ví sinh viên)
                        </div>
                      )}
                    </div>

                    {/* Action Buttons (For Pending Withdrawals) */}
                    {isPending && (
                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        {/* 1. Quick VietQR Scan Button */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('medium');
                            setSelectedWithdrawalForQr(w);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30 border border-cyan-300/40 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Quét Mã VietQR Chuyển Tiền</span>
                        </button>

                        {/* 2. Approve Button */}
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('success');
                            adminApproveWithdrawal(w.id);
                          }}
                          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/30 border border-emerald-400/40 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Xác Nhận Đã Chuyển Tiền</span>
                        </button>

                        {/* 3. Reject Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingTxId(w.id);
                            setRejectReasonText('Thông tin tài khoản ngân hàng không chính xác');
                          }}
                          className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs transition border border-rose-500/40 flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Từ Chối & Hoàn Tiền</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS & KYC MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="space-y-3">
          {/* Action & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#C5E5EC]/50 absolute left-3 top-3" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:border-[#C5E5EC] focus:outline-none"
                placeholder="Tìm kiếm theo tên, email, SĐT hoặc ID 9 số..."
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPurgeConfirmModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 shrink-0 shadow-lg shadow-rose-950/50 cursor-pointer"
              title="Xóa toàn bộ người dùng, chỉ giữ lại duy nhất 1 tài khoản Admin 000000000"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Xóa sạch dữ liệu (Trừ Admin)</span>
            </button>
          </div>

          {/* Quick Stats Pill */}
          <div className="p-3 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-[#C5E5EC]/80">
              <Users className="w-4 h-4 text-[#C5E5EC]" />
              <span>
                Tổng số: <strong className="text-white font-mono">{allUsers.length}</strong> tài khoản
              </span>
              <span className="text-[#C5E5EC]/30">|</span>
              <span>
                Bị cấm / khóa:{' '}
                <strong className="text-rose-400 font-mono">
                  {allUsers.filter((u) => u.isLocked).length}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-[#C5E5EC]/60 italic">
              💡 Bấm vào tài khoản bất kỳ để xem thông tin chi tiết & quản trị
            </span>
          </div>

          <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 overflow-hidden shadow-xl">
            <div className="divide-y divide-[#C5E5EC]/15">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-[#C5E5EC]/60 text-xs">
                  Không tìm thấy tài khoản nào khớp với từ khóa tìm kiếm.
                </div>
              ) : (
                filteredUsers.map((u: UserEntity) => {
                  const isRootAdmin = u.id === '000000000';
                  const trustClamped = Math.min(100, Math.max(0, u.trustScore ?? 0));
                  const displayName = u.name || `Người dùng (ID: ${u.id})`;
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserForModal(u)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#12233B] transition cursor-pointer group ${
                        u.isLocked ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white border shrink-0 ${
                            isRootAdmin
                              ? 'bg-gradient-to-tr from-amber-600 to-rose-600 border-amber-400 shadow-md shadow-rose-900/40'
                              : u.isLocked
                              ? 'bg-gray-800 border-rose-500/40 text-rose-300'
                              : 'bg-gradient-to-tr from-[#3064AE] to-[#25735B] border-[#E0FAEB]/30'
                          }`}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-extrabold text-white text-sm group-hover:text-[#C5E5EC] transition truncate">
                              {displayName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/10">
                              ID: {u.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3064AE]/30 text-[#C5E5EC] font-bold border border-[#C5E5EC]/30">
                              {u.tier}
                            </span>
                            {isRootAdmin && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 font-extrabold border border-rose-600/70">
                                ROOT ADMIN
                              </span>
                            )}
                            {u.isLocked && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-extrabold animate-pulse">
                                ĐÃ CẤM / KHÓA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5 truncate">
                            {u.email || 'Không có email'} • {u.phone || 'Chưa cập nhật SĐT'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#C5E5EC]/10">
                        <div className="text-left sm:text-right">
                          <span className="font-mono font-bold text-white text-xs block">
                            Ví: {formatVnd(u.walletBalance)}
                          </span>
                          <span className="text-[10px] text-amber-300 font-semibold">
                            Uy tín: {trustClamped}/100
                          </span>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isRootAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => adminToggleLockUser(u.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                                  u.isLocked
                                    ? 'bg-[#25735B]/40 hover:bg-[#25735B]/60 text-[#E0FAEB] border-[#25735B]'
                                    : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border-amber-600/40'
                                }`}
                                title={u.isLocked ? 'Mở cấm tài khoản' : 'Cấm / Khóa tài khoản'}
                              >
                                {u.isLocked ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#E0FAEB]" />
                                    <span className="hidden md:inline">Mở cấm</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3.5 h-3.5 text-amber-300" />
                                    <span className="hidden md:inline">Cấm</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setUserToDelete(u)}
                                className="p-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-600/40 transition cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForModal(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#3064AE]/30 hover:bg-[#3064AE]/50 text-[#C5E5EC] border border-[#C5E5EC]/30 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: QUẢN LÝ MODS & PHÂN QUYỀN HỆ THỐNG */}
      {activeTab === 'MODS' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Card */}
          <div className="rounded-3xl bg-gradient-to-r from-purple-950/70 via-[#12233B] to-[#0A1628] border border-purple-500/30 p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Quản Lý Đội Ngũ Kiểm Duyệt Viên (Mods)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/40">
                      {allMods.length} Tài Khoản
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-[#C5E5EC]/80 max-w-2xl leading-relaxed">
                  Thiết lập, chỉnh sửa, phân quyền (Duyệt KYC, Phán xử tranh chấp Escrow, Khóa người dùng vi phạm, Ẩn kèo, Tra soát ví) và quản lý tài khoản cho đội ngũ Moderator.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenCreateMod}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 border border-purple-400/40 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tạo Tài Khoản Mod Mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-purple-500/20 shadow-md">
              <span className="text-[11px] font-bold text-[#C5E5EC]/70 block mb-0.5">Tổng Số Mods</span>
              <span className="text-xl font-black text-white font-mono">{allMods.length}</span>
              <p className="text-[10px] text-purple-300 mt-0.5">Bao gồm mod1, mod2, mod3</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-emerald-500/20 shadow-md">
              <span className="text-[11px] font-bold text-[#C5E5EC]/70 block mb-0.5">Đang Hoạt Động</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {allMods.filter((m) => !m.isLocked).length}
              </span>
              <p className="text-[10px] text-emerald-300/80 mt-0.5">Sẵn sàng trực ca campus</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-rose-500/20 shadow-md">
              <span className="text-[11px] font-bold text-[#C5E5EC]/70 block mb-0.5">Tạm Khóa Quyền</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                {allMods.filter((m) => m.isLocked).length}
              </span>
              <p className="text-[10px] text-rose-300/80 mt-0.5">Bị đình chỉ quyền hạn</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-cyan-500/20 shadow-md">
              <span className="text-[11px] font-bold text-[#C5E5EC]/70 block mb-0.5">Trọng Tài Escrow</span>
              <span className="text-xl font-black text-cyan-300 font-mono">
                {allMods.filter((m) => m.modPermissions?.canResolveDisputes).length}
              </span>
              <p className="text-[10px] text-cyan-300/80 mt-0.5">Có quyền phán quyết kèo</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-[#0E1B2E] p-3 rounded-2xl border border-[#C5E5EC]/20 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#C5E5EC]/60 absolute left-3 top-2.5" />
              <input
                type="text"
                value={modSearch}
                onChange={(e) => setModSearch(e.target.value)}
                placeholder="Tìm kiếm mod theo ID 9 số (000000001...), tên, email, SĐT..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-none focus:border-[#C5E5EC]"
              />
              {modSearch && (
                <button
                  type="button"
                  onClick={() => setModSearch('')}
                  className="absolute right-2.5 top-2 text-[#C5E5EC]/50 hover:text-white"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setModStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  modStatusFilter === 'ALL'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-[#12233B] text-[#C5E5EC] border-[#C5E5EC]/20 hover:text-white'
                }`}
              >
                Tất cả ({allMods.length})
              </button>
              <button
                type="button"
                onClick={() => setModStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  modStatusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-[#12233B] text-[#C5E5EC] border-[#C5E5EC]/20 hover:text-white'
                }`}
              >
                Hoạt động ({allMods.filter((m) => !m.isLocked).length})
              </button>
              <button
                type="button"
                onClick={() => setModStatusFilter('LOCKED')}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  modStatusFilter === 'LOCKED'
                    ? 'bg-rose-600 text-white border-rose-400'
                    : 'bg-[#12233B] text-[#C5E5EC] border-[#C5E5EC]/20 hover:text-white'
                }`}
              >
                Bị khóa ({allMods.filter((m) => m.isLocked).length})
              </button>
            </div>
          </div>

          {/* Mod Cards List */}
          <div className="space-y-3">
            {filteredMods.length === 0 ? (
              <div className="py-12 text-center rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC]/70 text-xs shadow-lg">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#C5E5EC]/30" />
                <p className="font-bold">Không tìm thấy tài khoản Mod nào phù hợp</p>
                <p className="text-[11px] text-[#C5E5EC]/50 mt-1">
                  Nhấn "+ Tạo Tài Khoản Mod Mới" để thêm kiểm duyệt viên vào hệ thống.
                </p>
              </div>
            ) : (
              filteredMods.map((mod) => {
                const perms = mod.modPermissions || {
                  canApproveKyc: true,
                  canResolveDisputes: true,
                  canModerateUsers: true,
                  canModerateGigs: true,
                  canManageFinance: false,
                };
                const isPasswordShown = !!revealedModPasswords[mod.id];
                const activePermCount = Object.values(perms).filter(Boolean).length;

                return (
                  <div
                    key={mod.id}
                    className="p-4 sm:p-5 rounded-3xl bg-[#0E1B2E] border border-purple-500/25 hover:border-purple-500/40 transition shadow-xl space-y-4"
                  >
                    {/* Top Row: Info & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C5E5EC]/15">
                      <div className="flex items-start sm:items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0 font-black text-sm">
                          <Shield className="w-5 h-5 text-purple-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-black text-white text-sm truncate">{mod.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-black border border-purple-500/30">
                              MOD
                            </span>
                            {mod.isLocked ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 font-bold text-[10px] border border-rose-500/40 animate-pulse">
                                BỊ KHÓA
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                                HOẠT ĐỘNG
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#C5E5EC]/70 mt-1">
                            {/* ID 9 Số with 1-click copy */}
                            <button
                              type="button"
                              onClick={() => handleCopyModId(mod.id)}
                              className="font-mono text-white font-bold bg-[#12233B] px-2 py-0.5 rounded-lg border border-[#C5E5EC]/20 hover:border-[#C5E5EC]/50 flex items-center space-x-1 cursor-pointer"
                              title="Sao chép ID 9 số"
                            >
                              <span>ID: {mod.id}</span>
                              {copiedModId === mod.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-[#C5E5EC]/60" />
                              )}
                            </button>
                            <span>•</span>
                            <span className="font-semibold text-white">{mod.email}</span>
                            <span>•</span>
                            {mod.phone ? (
                              <span className="font-mono text-white">{mod.phone}</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 text-[10px] font-medium border border-amber-500/30">
                                Chưa thêm SĐT
                              </span>
                            )}
                            <span>•</span>
                            <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 text-[11px]">
                              Ví: {formatVnd(mod.walletBalance ?? 500000)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Password reveal & management */}
                      <div className="flex items-center space-x-2 text-xs bg-[#12233B] p-2 rounded-2xl border border-[#C5E5EC]/20 self-start sm:self-auto">
                        <Key className="w-3.5 h-3.5 text-purple-300" />
                        <span className="text-[#C5E5EC]/70 text-[11px] font-semibold">Mật khẩu:</span>
                        <span className="font-mono font-bold text-white text-xs">
                          {isPasswordShown ? mod.password || 'mod123456' : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedModPasswords((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                          }
                          className="p-1 rounded-md text-[#C5E5EC]/70 hover:text-white cursor-pointer"
                          title={isPasswordShown ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                        >
                          {isPasswordShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Permissions Matrix Block (Phân Quyền / Add Quyền / Xóa Quyền - 15 Quyền) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-xs text-white">Ma Trận Phân Quyền Hạn (15 Quyền):</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                            {activePermCount}/15 Quyền Được Cấp
                          </span>
                        </div>

                        {/* Quick Grant/Revoke All Buttons */}
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleGrantAllPermissions(mod)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition cursor-pointer active:scale-95"
                          >
                            + Cấp Tất Cả 15 Quyền
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeAllPermissions(mod)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition cursor-pointer active:scale-95"
                          >
                            - Thu Hồi Hết Quyền
                          </button>
                        </div>
                      </div>

                      {/* 15 Permission Toggle Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                        {MOD_PERMISSIONS_CONFIG.map((pConf) => {
                          const isGranted = Boolean(perms[pConf.key]);
                          return (
                            <button
                              key={pConf.key}
                              type="button"
                              onClick={() => handleToggleSinglePermission(mod, pConf.key)}
                              className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                                isGranted
                                  ? 'bg-purple-950/30 border-purple-500/50 text-white shadow-xs'
                                  : 'bg-[#12233B]/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-1">
                                {isGranted ? (
                                  <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className={`block font-bold text-xs truncate ${isGranted ? 'text-white' : 'text-slate-400'}`}>
                                    {pConf.label}
                                  </span>
                                  <span className="text-[10px] text-[#C5E5EC]/60 block truncate">
                                    {pConf.desc}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                  isGranted ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isGranted ? 'ĐÃ CẤP' : 'CHƯA CẤP'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#C5E5EC]/15">
                      <div className="text-[11px] text-[#C5E5EC]/60">
                        <span>Đăng nhập qua </span>
                        <code className="bg-[#12233B] px-1.5 py-0.5 rounded text-white font-mono">{mod.email}</code>
                        <span> hoặc ID </span>
                        <code className="bg-[#12233B] px-1.5 py-0.5 rounded text-purple-300 font-mono font-bold">{mod.id}</code>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Edit Mod */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditMod(mod)}
                          className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] hover:text-white border border-[#C5E5EC]/20 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Sửa Thông Tin</span>
                        </button>

                        {/* Lock / Unlock */}
                        <button
                          type="button"
                          onClick={() => adminToggleLockUser(mod.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border cursor-pointer ${
                            mod.isLocked
                              ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {mod.isLocked ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mở Khóa Mod</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>Khóa Tạm Thời</span>
                            </>
                          )}
                        </button>

                        {/* Delete Mod */}
                        <button
                          type="button"
                          onClick={() => setModToDelete(mod)}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition cursor-pointer"
                          title="Xóa tài khoản mod"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SMART ESCROW AUDIT */}
      {activeTab === 'VAULT' && (
        <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <Lock className="w-4 h-4 text-[#C5E5EC]" />
            <span>Nguyên Tắc Bất Biến Của Smart Escrow Vault</span>
          </h3>

          <div className="space-y-2 text-[#C5E5EC]/85 leading-relaxed text-xs">
            <p>
              1. <strong>Không ai được phép rút trước:</strong> Toàn bộ số tiền thù lao thỏa thuận của người thuê được
              đóng băng trong Smart Escrow Vault ngay khi đăng việc.
            </p>
            <p>
              2. <strong>Bảo vệ hai đầu:</strong> Freelancer được bảo vệ không bị quỵt tiền khi hoàn thành đúng hạn;
              Người thuê được bảo vệ hoàn tiền 100% nếu Freelancer không giao việc.
            </p>
            <p>
              3. <strong>Minh bạch chiết khấu:</strong> Phí sàn tự động được hệ thống trừ trực tiếp theo biểu phí Cấp bậc
              (10% cho Cấp 1 & 2, 7% cho Cấp 3 VIP Pro).
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: BÁO CÁO PHÂN TÍCH & DOANH THU SÀN (ANALYTICS - NHÓM 5 - UPDATE 6) */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Top Analytics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#E0FAEB]/30">
              <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
                <TrendingUp className="w-4 h-4 text-[#E0FAEB]" />
                <span>Doanh Thu Phí Sàn</span>
              </span>
              <span className="text-2xl font-black text-[#E0FAEB] font-mono">
                {formatVnd(totalPlatformFeesCollected)}
              </span>
              <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Trích 10% tự động từ đơn thành công</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/30">
              <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#C5E5EC]" />
                <span>Tỷ Lệ Tranh Chấp</span>
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white font-mono">{disputeRate}%</span>
                <span className="text-[11px] font-bold text-[#E0FAEB]">({(100 - Number(disputeRate)).toFixed(1)}% an toàn)</span>
              </div>
              <p className="text-[10px] text-[#C5E5EC]/60 mt-1">{disputedGigs.length} vụ / {rawGigs.length} tổng đơn việc</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/30">
              <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
                <Lock className="w-4 h-4 text-[#C5E5EC]" />
                <span>Tổng Dòng Tiền Escrow</span>
              </span>
              <span className="text-2xl font-black text-[#C5E5EC] font-mono">
                {formatVnd(totalEscrowVolume)}
              </span>
              <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Toàn bộ thù lao ký quỹ trung gian</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#3064AE]/50">
              <span className="text-[#C5E5EC]/80 flex items-center space-x-1.5 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#3064AE]" />
                <span>Đã Giải Ngân Cho SV</span>
              </span>
              <span className="text-2xl font-black text-[#E0FAEB] font-mono">
                {formatVnd(disbursedEscrowVolume)}
              </span>
              <p className="text-[10px] text-[#C5E5EC]/60 mt-1">Chi trả trực tiếp về ví thợ</p>
            </div>
          </div>

          {/* Section: Lượng việc theo từng trường đại học */}
          <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C5E5EC]/20">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-[#C5E5EC]" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Phân Phối Lượng Việc Theo Từng Trường Đại Học (Campus Analytics)
                  </h3>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Thống kê tỷ lệ mật độ công việc sinh viên tại các làng đại học & khu ký túc xá
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3064AE]/30 text-[#C5E5EC] font-bold border border-[#C5E5EC]/30">
                Toàn Khu Vực TP.HCM
              </span>
            </div>

            <div className="space-y-3.5">
              {campusStats.map((c, i) => {
                const totalCampusGigs = campusStats.reduce((s, x) => s + x.count, 0) || 1;
                const percent = Math.round((c.count / totalCampusGigs) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center space-x-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                        <span>{c.name}</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#C5E5EC]/70 font-mono">{c.count} việc</span>
                        <span className="font-mono font-black text-[#E0FAEB] w-10 text-right">{percent}%</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-[#081120] rounded-full overflow-hidden border border-[#C5E5EC]/15">
                      <div
                        className={`h-full ${c.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Dòng tiền Escrow thời gian thực */}
          <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/25 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#C5E5EC]/20">
              <PieChart className="w-5 h-5 text-[#C5E5EC]" />
              <div>
                <h3 className="text-sm font-black text-white">
                  Dòng Tiền Smart Escrow Vault Thời Gian Thực
                </h3>
                <p className="text-[11px] text-[#C5E5EC]/70">
                  Đối soát dòng tiền tức thời, không thất thoát bất kỳ giao dịch nào
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
                <span className="text-[#C5E5EC]/70 font-semibold block mb-1">1. Đã Giải Ngân Hoàn Tất</span>
                <span className="text-base font-black text-[#E0FAEB] font-mono">{formatVnd(disbursedEscrowVolume)}</span>
                <span className="text-[10px] text-[#C5E5EC]/50 block mt-1">{completedGigs.length} đơn hoàn thành 100%</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
                <span className="text-[#C5E5EC]/70 font-semibold block mb-1">2. Đang Ký Quỹ Thực Hiện</span>
                <span className="text-base font-black text-[#C5E5EC] font-mono">{formatVnd(pendingEscrowVolume)}</span>
                <span className="text-[10px] text-[#C5E5EC]/50 block mt-1">{inProgressGigs.length} đơn đang làm việc</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
                <span className="text-[#C5E5EC]/70 font-semibold block mb-1">3. Tạm Giữ Tranh Chấp</span>
                <span className="text-base font-black text-rose-400 font-mono">{formatVnd(disputedEscrowVolume)}</span>
                <span className="text-[10px] text-[#C5E5EC]/50 block mt-1">{disputedGigs.length} đơn chờ trọng tài</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#12233B] border border-[#C5E5EC]/20">
                <span className="text-[#C5E5EC]/70 font-semibold block mb-1">4. Quỹ Sàn Khả Dụng</span>
                <span className="text-base font-black text-amber-300 font-mono">{formatVnd(adminBalance)}</span>
                <span className="text-[10px] text-[#C5E5EC]/50 block mt-1">Admin có thể rút ngay</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PHÁT HIỆN BOT & NICK ẢO GIAN LẬN (SYBIL_DETECTION - NHÓM 5 - UPDATE 3) */}
      {activeTab === 'SYBIL_DETECTION' && (
        <div className="space-y-6">
          {/* Header & Re-scan Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#0E1B2E] to-[#0A1628] border border-amber-500/40 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm text-white">
                    Hệ Thống Rà Soát Sybil Attack & Vòng Lặp Đánh Giá Ảo
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/40">
                    Thuật toán AI
                  </span>
                </div>
                <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                  Phát hiện tự book đơn ảo cày điểm tín nhiệm ELO, rửa tiền hoặc dùng chung phần cứng thiết bị
                </p>
              </div>
            </div>

            <button
              onClick={handleRunSybilScan}
              disabled={isScanningSybil}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningSybil ? 'animate-spin' : ''}`} />
              <span>{isScanningSybil ? 'Đang Quét Mạng Lưới...' : 'Quét Phân Tích Lại'}</span>
            </button>
          </div>

          {/* 3 Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20">
              <span className="text-[#C5E5EC]/70 font-bold block mb-1">Tổng Tài Khoản Đã Rà Soát</span>
              <span className="text-2xl font-black text-white font-mono">{sybilAudit.totalScannedUsers}</span>
              <span className="text-[10px] text-[#C5E5EC]/50 block mt-1">Đối chiếu toàn bộ user & lịch sử kèo</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-amber-500/30">
              <span className="text-amber-400 font-bold block mb-1">Tài Khoản Nghi Vấn Gắn Cờ</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{activeFlaggedCount}</span>
              <span className="text-[10px] text-amber-300/70 block mt-1">Điểm rủi ro (Risk Score &gt; 30)</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-rose-500/30">
              <span className="text-rose-400 font-bold block mb-1">Nhóm Vòng Lặp Đánh Giá Chéo</span>
              <span className="text-2xl font-black text-rose-400 font-mono">{activeHighRiskRingsCount}</span>
              <span className="text-[10px] text-rose-300/70 block mt-1">Cặp tài khoản tự khen nhau kiếm ELO</span>
            </div>
          </div>

          {/* List of Flagged Threats */}
          <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/20">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Fingerprint className="w-4 h-4 text-[#C5E5EC]" />
                <span>Danh Sách Cảnh Báo Tài Khoản Nghi Vấn ({activeThreats.length})</span>
              </h3>
              <span className="text-[10px] text-[#C5E5EC]/70">Sắp xếp theo mức độ nguy hại</span>
            </div>

            {activeThreats.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-[#081120] border border-[#C5E5EC]/20 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#E0FAEB] mx-auto" />
                <p className="font-bold text-white">Mạng lưới hoàn toàn trong sạch!</p>
                <p className="text-[#C5E5EC]/70 text-[11px]">Không phát hiện dấu vết tấn công Sybil hoặc buff đánh giá chéo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeThreats.map((t) => {
                  const isHandled = handledThreatIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        isHandled
                          ? 'bg-[#12233B]/40 border-[#C5E5EC]/15 opacity-60'
                          : t.threatLevel === 'HIGH_RISK_SYBIL_RING'
                          ? 'bg-rose-950/20 border-rose-500/40'
                          : 'bg-amber-950/15 border-amber-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-[#12233B] flex items-center justify-center font-bold text-white text-sm border border-[#C5E5EC]/20">
                            {t.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white text-xs">{t.userName}</span>
                              <span className="text-[10px] text-[#C5E5EC]/70 font-mono">{t.userPhone}</span>
                              {t.threatLevel === 'HIGH_RISK_SYBIL_RING' ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px]">
                                  NGUY CƠ CAO (VÒNG LẶP CHÉO)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/40">
                                  NGHI VẤN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#C5E5EC]/70">Mã tài khoản: {t.userId}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 sm:text-right">
                          <div>
                            <span className="text-[10px] text-[#C5E5EC]/70 block font-semibold">Điểm Rủi Ro:</span>
                            <span className={`font-mono font-black text-sm ${t.score >= 50 ? 'text-rose-400' : 'text-amber-400'}`}>
                              {t.score}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasons detected */}
                      <div className="p-3 rounded-xl bg-[#081120] border border-[#C5E5EC]/20 space-y-1 text-[11px]">
                        <span className="font-bold text-[#C5E5EC] block mb-1">Dấu hiệu phát hiện bởi thuật toán:</span>
                        {t.reasons.map((r, ri) => (
                          <div key={ri} className="flex items-start space-x-1.5 text-amber-200">
                            <span className="text-amber-400 shrink-0">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        {isHandled ? (
                          <span className="text-[10px] font-bold text-[#E0FAEB] flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã xử lý & ghi nhật ký</span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDismissThreat(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-[#C5E5EC] border border-[#C5E5EC]/20 text-xs font-bold transition cursor-pointer"
                            >
                              Bỏ Qua
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFreezeUser(t.userId, t.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center space-x-1 shadow-md shadow-rose-600/20 cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Đóng Băng & Trừ ELO</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const target = allUsers.find((u) => u.id === t.userId) || ({
                                  id: t.userId,
                                  name: t.userName,
                                  phone: t.userPhone,
                                  role: 'FREELANCER',
                                } as unknown as UserEntity);
                                setUserToDelete(target);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BOT WEBHOOK & TELEGRAM NẠP TIỀN TỰ ĐỘNG (100% FREE SELF-HOSTED) */}
      {activeTab === 'BANK_BOT' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#0E1B2E] to-[#0A1628] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/30 shrink-0">
                  <Zap className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      Trung Tâm Điều Hành Bot Webhook & Telegram Nạp Tiền
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-400/40">
                      100% FREE TRỌN ĐỜI
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-400/30">
                      Self-Hosted Engine
                    </span>
                  </div>
                  <p className="text-xs text-[#C5E5EC]/80 mt-1 max-w-2xl leading-relaxed">
                    Tự động đọc thông báo biến động số dư ngân hàng qua điện thoại Android (MacroDroid/Tasker), Telegram Bot hai chiều hoặc script mã nguồn mở. Khớp lệnh tự động 24/7, cộng số dư tức thời vào ví sinh viên không mất phí trung gian.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setBankBotConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border cursor-pointer ${
                    bankBotConfig.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{bankBotConfig.enabled ? 'Bot Đang Bật' : 'Bot Đang Tắt'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveBankBotConfig}
                  disabled={isSavingBankBot}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingBankBot ? 'Đang Lưu...' : 'Lưu Cấu Hình'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-[#0E1B2E] p-1.5 rounded-2xl border border-[#C5E5EC]/20 text-xs font-bold">
            <button
              onClick={() => setBankBotSubTab('SETUP')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'SETUP'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>1. STK Nhận & VietQR</span>
            </button>

            <button
              onClick={() => setBankBotSubTab('WEBHOOK')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'WEBHOOK'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>2. Webhook & Secret Key</span>
            </button>

            <button
              onClick={() => setBankBotSubTab('TELEGRAM')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'TELEGRAM'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>3. Telegram Bot 2 Chiều</span>
            </button>

            <button
              onClick={() => setBankBotSubTab('SIMULATOR')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'SIMULATOR'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>4. Bắn Test Thông Báo</span>
            </button>

            <button
              onClick={() => setBankBotSubTab('SCRIPTS')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'SCRIPTS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>5. App & Script Mã Nguồn</span>
            </button>

            <button
              onClick={() => setBankBotSubTab('HISTORY')}
              className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                bankBotSubTab === 'HISTORY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow'
                  : 'text-[#C5E5EC]/70 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>6. Lịch Sử GD ({webhookTxs.length})</span>
            </button>
          </div>

          {/* SUBTAB 1: SETUP BANK ACCOUNT & VIETQR */}
          {bankBotSubTab === 'SETUP' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 shadow-xl">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#C5E5EC]/15">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-black text-sm text-white">
                    Thông Tin Tài Khoản Ngân Hàng Nhận Tiền
                  </h4>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Chọn Ngân Hàng Thụ Hưởng
                    </label>
                    <select
                      value={bankBotConfig.bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const found = VIETNAMESE_BANKS.find((b) => b.code === code);
                        setBankBotConfig((prev) => ({
                          ...prev,
                          bankCode: code,
                          bankName: found?.name || code,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-semibold focus:border-emerald-400 focus:outline-none"
                    >
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name} ({b.code}) - {b.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Số Tài Khoản Ngân Hàng
                    </label>
                    <input
                      type="text"
                      value={bankBotConfig.accountNumber}
                      onChange={(e) =>
                        setBankBotConfig((prev) => ({ ...prev, accountNumber: e.target.value.trim() }))
                      }
                      placeholder="Ví dụ: 0909120918 hoặc 1903..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono font-bold text-sm focus:border-emerald-400 focus:outline-none"
                    />
                    <p className="text-[11px] text-[#C5E5EC]/60 mt-1">
                      Đây là số tài khoản của bạn sẽ nhận tiền khi sinh viên quét mã VietQR trên app.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Tên Chủ Tài Khoản (In Hoa Không Dấu)
                    </label>
                    <input
                      type="text"
                      value={bankBotConfig.accountHolder}
                      onChange={(e) =>
                        setBankBotConfig((prev) => ({
                          ...prev,
                          accountHolder: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Ví dụ: LY HOANG GIA BAO"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-bold text-sm focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#081120] border border-[#C5E5EC]/15 space-y-1.5 text-[11px] text-[#C5E5EC]/80">
                    <span className="font-bold text-emerald-400 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cơ Chế Đồng Bộ Tức Thời</span>
                    </span>
                    <p>
                      Khi bấm <strong>"Lưu Cấu Hình"</strong>, toàn bộ mã VietQR của tất cả sinh viên trên ứng dụng sẽ lập tức hiển thị thông tin ngân hàng này. Tiền sinh viên chuyển sẽ vào thẳng tài khoản ngân hàng của bạn.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveBankBotConfig}
                    disabled={isSavingBankBot}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingBankBot ? 'Đang Lưu...' : 'Cập Nhật Toàn Bộ Mã VietQR Trên Hệ Thống'}</span>
                  </button>
                </div>
              </div>

              {/* QR Preview Column */}
              <div className="lg:col-span-5 rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-xs font-black text-white flex items-center space-x-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Mẫu Mã VietQR Sinh Viên Sẽ Thấy</span>
                </span>

                <div className="p-4 rounded-2xl bg-white shadow-2xl border-4 border-emerald-500/30 max-w-[260px]">
                  <img
                    src={`https://img.vietqr.io/image/${bankBotConfig.bankCode || 'MB'}-${bankBotConfig.accountNumber || '0909120918'}-compact2.png?amount=50000&addInfo=GIGME%200909120918&accountName=${encodeURIComponent(
                      bankBotConfig.accountHolder || 'CHỦ TÀI KHOẢN'
                    )}`}
                    alt="VietQR Preview"
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                <div className="text-xs text-[#C5E5EC]/80 space-y-1">
                  <p className="font-bold text-white">{bankBotConfig.bankName} • {bankBotConfig.accountNumber}</p>
                  <p className="font-semibold text-emerald-300">{bankBotConfig.accountHolder}</p>
                  <p className="text-[11px] text-[#C5E5EC]/60">
                    Cú pháp chuẩn nạp tiền: <code className="text-amber-300 font-mono font-bold">GIGME &lt;SĐT/ID&gt;</code>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: WEBHOOK ENDPOINT & SECRET KEY */}
          {bankBotSubTab === 'WEBHOOK' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-black text-sm text-white">
                        Cấu Hình Webhook Endpoint Tiếp Nhận Thông Báo
                      </h4>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Địa chỉ endpoint trên máy chủ GigMe để nhận thông báo biến động số dư từ điện thoại hoặc bot
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/30">
                    Sẵn Sàng 24/7
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Webhook URL Box */}
                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Đường Dẫn Webhook Tiếp Nhận (Webhook URL)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot`}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#081120] border border-[#C5E5EC]/25 text-emerald-300 font-mono font-bold text-xs select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyClipboard(
                            `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot`,
                            'webhook_url'
                          )
                        }
                        className="px-4 py-2.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/30 font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'webhook_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === 'webhook_url' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Secret Key Box */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[#C5E5EC]/80 font-bold">
                        Secret Key Bảo Mật (Token Chống Spam & Giả Mạo)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newKey = `gigme_bot_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString().slice(-4)}`;
                          setBankBotConfig((prev) => ({ ...prev, secretKey: newKey }));
                          showNotification('Đã tạo Secret Key mới! 🔑', 'Nhớ bấm "Lưu Cấu Hình" để áp dụng.');
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition cursor-pointer"
                      >
                        Tạo ngẫu nhiên key mới
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={bankBotConfig.secretKey}
                        onChange={(e) =>
                          setBankBotConfig((prev) => ({ ...prev, secretKey: e.target.value.trim() }))
                        }
                        placeholder="gigme_secret_bot_2026"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-amber-300 font-mono font-bold text-xs focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyClipboard(bankBotConfig.secretKey, 'secret_key')}
                        className="px-4 py-2.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/30 font-bold transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'secret_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === 'secret_key' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#C5E5EC]/60 mt-1">
                      Gửi kèm qua Header <code>x-bot-secret: {bankBotConfig.secretKey}</code> hoặc Bearer Token để bảo vệ server khỏi tin rác.
                    </p>
                  </div>

                  {/* Format Payloads Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-[#081120] border border-[#C5E5EC]/15 space-y-2">
                      <span className="font-bold text-white flex items-center space-x-1.5">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span>Định dạng 1: Text Thông Báo Thô (Dành cho App MacroDroid)</span>
                      </span>
                      <pre className="p-2.5 rounded-xl bg-black/50 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`POST /api/webhook/bank-bot
Header: x-bot-secret: ${bankBotConfig.secretKey}
Body (JSON):
{
  "text": "MB: TK 0909120918 +50,000VND. ND: GIGME 0909120918"
}`}
                      </pre>
                      <p className="text-[10px] text-[#C5E5EC]/60">
                        Thuật toán AI Regex trên server sẽ tự động trích xuất Ngân hàng, Số tiền, và Người nhận!
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#081120] border border-[#C5E5EC]/15 space-y-2">
                      <span className="font-bold text-white flex items-center space-x-1.5">
                        <Terminal className="w-4 h-4 text-amber-400" />
                        <span>Định dạng 2: JSON Đã Bóc Tách (Dành cho Python/NodeJS)</span>
                      </span>
                      <pre className="p-2.5 rounded-xl bg-black/50 text-[11px] font-mono text-amber-300 overflow-x-auto">
{`POST /api/webhook/bank-bot
Header: x-bot-secret: ${bankBotConfig.secretKey}
Body (JSON):
{
  "amount": 50000,
  "content": "GIGME 0909120918",
  "bank": "${bankBotConfig.bankName}"
}`}
                      </pre>
                      <p className="text-[10px] text-[#C5E5EC]/60">
                        Khớp số tiền và SĐT người nhận lập tức, độ trễ xử lý dưới 50ms!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: TELEGRAM BOT 2-WAY ENGINE */}
          {bankBotSubTab === 'TELEGRAM' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
                  <div className="flex items-center space-x-2">
                    <Send className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h4 className="font-black text-sm text-white">
                        Tích Hợp Telegram Bot Điều Hành & Báo Động 2 Chiều
                      </h4>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Nhận báo động tiền về ngay trên điện thoại và điều khiển nạp tiền sinh viên bằng câu lệnh chat
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] border border-cyan-400/30">
                    Miễn Phí Từ Telegram
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Telegram Bot Token (Từ @BotFather)
                    </label>
                    <input
                      type="text"
                      value={bankBotConfig.telegramBotToken}
                      onChange={(e) =>
                        setBankBotConfig((prev) => ({ ...prev, telegramBotToken: e.target.value.trim() }))
                      }
                      placeholder="Ví dụ: 789123456:AAFlk_xyz123..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#C5E5EC]/80 font-bold mb-1.5">
                      Telegram Chat ID (Cá Nhân Hoặc Nhóm Admin)
                    </label>
                    <input
                      type="text"
                      value={bankBotConfig.telegramChatId}
                      onChange={(e) =>
                        setBankBotConfig((prev) => ({ ...prev, telegramChatId: e.target.value.trim() }))
                      }
                      placeholder="Ví dụ: 123456789 hoặc -100123456789"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3 Step Setup Guide */}
                <div className="p-4 rounded-2xl bg-[#081120] border border-[#C5E5EC]/15 space-y-2 text-xs">
                  <span className="font-extrabold text-cyan-400 flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4" />
                    <span>Hướng Dẫn Lấy Token & Chat ID Trong 30 Giây (100% Miễn Phí):</span>
                  </span>
                  <div className="space-y-1.5 text-[#C5E5EC]/80 text-[11px] leading-relaxed">
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">1</span>
                      <span>Mở app Telegram trên điện thoại hoặc máy tính, tìm kiếm bot <strong>@BotFather</strong>, gõ lệnh <code>/newbot</code>, đặt tên cho bot. Bạn sẽ nhận được <strong>Bot Token</strong>.</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">2</span>
                      <span>Tìm kiếm bot <strong>@userinfobot</strong> hoặc <strong>@myidbot</strong> trên Telegram, bấm Start để xem dãy số <strong>Id</strong> của bạn (Ví dụ: <code>987654321</code>).</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">3</span>
                      <span>Dán cả 2 vào 2 ô phía trên, bấm nút <strong>"Lưu Cấu Hình"</strong> rồi bấm <strong>"Gửi Tin Nhắn Thử Nghiệm"</strong> bên dưới.</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons & Test Output */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingTelegram ? 'animate-bounce' : ''}`} />
                    <span>{isTestingTelegram ? 'Đang Gửi Test...' : '🚀 Gửi Tin Nhắn Thử Nghiệm Tới Telegram'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveBankBotConfig}
                    disabled={isSavingBankBot}
                    className="px-4 py-2.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/30 font-bold text-xs transition cursor-pointer"
                  >
                    Lưu Cấu Hình Telegram
                  </button>
                </div>

                {telegramTestResult && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs ${
                      telegramTestResult.success
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold mb-1">
                      {telegramTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>
                        {telegramTestResult.success
                          ? 'Đã gửi thành công tin nhắn xác nhận tới Telegram!'
                          : 'Gửi thất bại'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80">
                      {telegramTestResult.message || telegramTestResult.error}
                    </p>
                  </div>
                )}

                {/* Telegram Commands Reference */}
                <div className="pt-2">
                  <h5 className="font-bold text-white text-xs mb-2">Các lệnh điều khiển khả dụng từ Telegram:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#081120] border border-[#C5E5EC]/15 space-y-1">
                      <code className="text-cyan-300 font-bold block">/status</code>
                      <span className="text-[11px] text-[#C5E5EC]/70 block">
                        Xem nhanh số dư ví sàn, tổng đơn việc và giao dịch nạp tiền.
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081120] border border-[#C5E5EC]/15 space-y-1">
                      <code className="text-emerald-300 font-bold block">/topup &lt;SĐT&gt; &lt;Tiền&gt;</code>
                      <span className="text-[11px] text-[#C5E5EC]/70 block">
                        Nạp tiền trực tiếp cho sinh viên ngay từ tin nhắn Telegram!
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#081120] border border-[#C5E5EC]/15 space-y-1">
                      <span className="text-amber-300 font-bold block">Dán tin nhắn ngân hàng</span>
                      <span className="text-[11px] text-[#C5E5EC]/70 block">
                        Paste SMS/thông báo vào chat, bot sẽ tự bóc tách và cộng tiền!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: LIVE SIMULATOR & TEST NOTIFICATION PARSER */}
          {bankBotSubTab === 'SIMULATOR' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-black text-sm text-white">
                        Trình Thử Nghiệm Mô Phỏng & Bóc Tách Thông Báo
                      </h4>
                      <p className="text-[11px] text-[#C5E5EC]/70">
                        Kiểm tra thử nghiệm thuật toán nhận diện thông báo từ các ngân hàng thực tế ngoài đời
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <label className="block text-[#C5E5EC]/80 font-bold text-xs">
                    Mẫu Thông Báo Ngân Hàng Thông Dụng (Nhấn chọn nhanh):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('MB: TK 0909120918 +50,000VND luc 12:30. ND: GIGME 0909120918')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-xs font-semibold text-white border border-[#C5E5EC]/25 transition cursor-pointer"
                    >
                      MBBank (+50,000đ)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('VCB: 0909120918 - GD: +100,000VND luc 14:00. ND: GIGME 0909120918')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-xs font-semibold text-white border border-[#C5E5EC]/25 transition cursor-pointer"
                    >
                      Vietcombank (+100,000đ)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('Techcombank: TK ...888 +200.000d vao 10:15. ND: GIGME 0909120918')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-xs font-semibold text-white border border-[#C5E5EC]/25 transition cursor-pointer"
                    >
                      Techcombank (+200,000đ)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('ACB: +50,000VND vao TK 0909120918. Noi dung: GIGME 0909120918')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-xs font-semibold text-white border border-[#C5E5EC]/25 transition cursor-pointer"
                    >
                      ACB (+50,000đ)
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setTestNotificationText('MoMo: Ban da nhan duoc 50.000d tu Tran Thi B. Loi nhan: GIGME 0909120918')
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-xs font-semibold text-white border border-[#C5E5EC]/25 transition cursor-pointer"
                    >
                      MoMo (+50,000đ)
                    </button>
                  </div>
                </div>

                {/* Input Textarea */}
                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold text-xs mb-1.5">
                    Nội dung thông báo (Paste từ SMS hoặc Notification app ngân hàng):
                  </label>
                  <textarea
                    rows={3}
                    value={testNotificationText}
                    onChange={(e) => setTestNotificationText(e.target.value)}
                    placeholder="Dán nội dung tin nhắn ngân hàng vào đây..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* Execute Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestSimulate}
                    disabled={isTestingSimulate}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Zap className={`w-4 h-4 ${isTestingSimulate ? 'animate-spin' : ''}`} />
                    <span>{isTestingSimulate ? 'Đang Xử Lý...' : '🚀 Bắn Test Webhook & Khớp Tiền Thật Vào Ví'}</span>
                  </button>
                </div>

                {/* Simulation Output */}
                {simulateResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                      simulateResult.success
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold pb-2 border-b border-white/10">
                      {simulateResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span>
                        {simulateResult.success
                          ? 'Trích xuất và khớp lệnh thành công!'
                          : 'Không thể xử lý giao dịch thử nghiệm'}
                      </span>
                    </div>

                    {simulateResult.success ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <span className="text-[#C5E5EC]/60 block text-[10px]">Ngân hàng nhận diện:</span>
                          <span className="font-bold text-white">{simulateResult.parsed?.bank}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <span className="text-[#C5E5EC]/60 block text-[10px]">Số tiền bóc tách:</span>
                          <span className="font-bold text-emerald-300 font-mono">
                            +{simulateResult.parsed?.amount?.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <span className="text-[#C5E5EC]/60 block text-[10px]">Người nhận khớp:</span>
                          <span className="font-bold text-white">
                            {simulateResult.depositResult?.creditedUserName || 'Chờ đối soát'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40">
                          <span className="text-[#C5E5EC]/60 block text-[10px]">Số dư mới:</span>
                          <span className="font-bold text-cyan-300 font-mono">
                            {simulateResult.depositResult?.newBalance
                              ? `${simulateResult.depositResult.newBalance.toLocaleString('vi-VN')}đ`
                              : '---'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-300">{simulateResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 5: APP & SCRIPTS REPOSITORY */}
          {bankBotSubTab === 'SCRIPTS' && (
            <div className="space-y-6">
              <div className="rounded-3xl bg-[#0E1B2E] border border-[#C5E5EC]/20 p-6 space-y-6 shadow-xl text-xs">
                <div>
                  <h4 className="font-black text-sm text-white flex items-center space-x-2">
                    <FileCode className="w-5 h-5 text-emerald-400" />
                    <span>Bộ Cài Đặt & Mã Nguồn Mở Tự Động Hóa 100% Free</span>
                  </h4>
                  <p className="text-[11px] text-[#C5E5EC]/70 mt-1">
                    Chọn 1 trong 3 phương thức dưới đây để bắt đầu tự động đọc biến động số dư về máy chủ GigMe
                  </p>
                </div>

                {/* Option 1: MacroDroid (Android App) */}
                <div className="p-5 rounded-2xl bg-[#081120] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-white text-sm">
                        Cách 1: App MacroDroid Trên Điện Thoại Android (Khuyên Dùng - 0 Cần Code)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Dễ nhất - 2 phút
                    </span>
                  </div>

                  <div className="space-y-2 text-[#C5E5EC]/85 text-[11px] leading-relaxed">
                    <p>1. Cài ứng dụng <strong>MacroDroid</strong> miễn phí từ Google Play Store trên điện thoại nhận tiền.</p>
                    <p>2. Thêm Macro mới:
                      <br />• <strong>Trigger:</strong> Chọn <code>Notification</code> &gt; <code>Notification Received</code> &gt; Chọn App Ngân Hàng của bạn (MBBank, Vietcombank, Techcombank, MoMo...).
                      <br />• <strong>Action:</strong> Chọn <code>HTTP Request</code>:
                      <br />&nbsp;&nbsp;- Phương thức: <code>POST</code>
                      <br />&nbsp;&nbsp;- URL: <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot`}</code>
                      <br />&nbsp;&nbsp;- Header: <code>x-bot-secret: {bankBotConfig.secretKey}</code>
                      <br />&nbsp;&nbsp;- Content-Type: <code>application/json</code>
                      <br />&nbsp;&nbsp;- Body: <code>{`{"text": "[not_title] [not_body]"}`}</code>
                    </p>
                    <p>3. Lưu lại và bật chạy ngầm. Khi có người chuyển tiền, MacroDroid tự đọc thông báo và gửi ngay về server GigMe!</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyClipboard(
                        JSON.stringify(
                          {
                            url: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot`,
                            method: 'POST',
                            headers: { 'x-bot-secret': bankBotConfig.secretKey, 'Content-Type': 'application/json' },
                            body: '{"text": "[not_title] [not_body]"}',
                          },
                          null,
                          2
                        ),
                        'macrodroid_json'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Cấu Hình JSON Cho MacroDroid</span>
                  </button>
                </div>

                {/* Option 2: NodeJS Script */}
                <div className="p-5 rounded-2xl bg-[#081120] border border-[#C5E5EC]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      <span className="font-black text-white text-sm">
                        Cách 2: Script Node.js Chạy Trên Máy Tính / VPS
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      Node.js
                    </span>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/60 text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`// forwarder.js - Chạy bằng lệnh: node forwarder.js
const WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot";
const SECRET_KEY = "${bankBotConfig.secretKey}";

async function sendDepositNotification(rawText) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': SECRET_KEY,
    },
    body: JSON.stringify({ text: rawText }),
  });
  console.log("Kết quả:", await res.json());
}

// Bắn thông báo nạp tiền:
sendDepositNotification("MB: TK 0909120918 +50,000VND. ND: GIGME 0909120918");`}
                  </pre>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyClipboard(
                        `const WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot";
const SECRET_KEY = "${bankBotConfig.secretKey}";

async function sendDepositNotification(rawText) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-secret': SECRET_KEY,
    },
    body: JSON.stringify({ text: rawText }),
  });
  console.log("Kết quả:", await res.json());
}

sendDepositNotification("MB: TK 0909120918 +50,000VND. ND: GIGME 0909120918");`,
                        'nodejs_code'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/30 font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Script Node.js</span>
                  </button>
                </div>

                {/* Option 3: Python Script */}
                <div className="p-5 rounded-2xl bg-[#081120] border border-[#C5E5EC]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      <span className="font-black text-white text-sm">
                        Cách 3: Script Python (Termux Android hoặc Raspberry Pi)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Python 3
                    </span>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/60 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`# bank_bot.py - Chạy bằng lệnh: python3 bank_bot.py
import requests

WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot"
SECRET_KEY = "${bankBotConfig.secretKey}"

def send_bank_alert(text):
    headers = {
        "Content-Type": "application/json",
        "x-bot-secret": SECRET_KEY
    }
    payload = {"text": text}
    res = requests.post(WEBHOOK_URL, json=payload, headers=headers)
    print("Response:", res.json())

send_bank_alert("MB: TK 0909120918 +100,000VND. ND: GIGME 0909120918")`}
                  </pre>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyClipboard(
                        `import requests

WEBHOOK_URL = "${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/bank-bot"
SECRET_KEY = "${bankBotConfig.secretKey}"

def send_bank_alert(text):
    headers = {
        "Content-Type": "application/json",
        "x-bot-secret": SECRET_KEY
    }
    payload = {"text": text}
    res = requests.post(WEBHOOK_URL, json=payload, headers=headers)
    print("Response:", res.json())

send_bank_alert("MB: TK 0909120918 +100,000VND. ND: GIGME 0909120918")`,
                        'python_code'
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/30 font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Script Python</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 6: TRANSACTION HISTORY & MANUAL MATCHING */}
          {bankBotSubTab === 'HISTORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#C5E5EC]/15">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-black text-sm text-white">
                    Lịch Sử Giao Dịch Webhook & Đối Soát ({webhookTxs.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={loadBankBotData}
                  disabled={isLoadingWebhookTxs}
                  className="px-3 py-1.5 rounded-xl bg-[#12233B] hover:bg-[#152844] text-white border border-[#C5E5EC]/25 font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWebhookTxs ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {webhookTxs.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 text-[#C5E5EC]/60 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white text-xs">Chưa có giao dịch webhook nào</p>
                  <p className="text-[11px] text-[#C5E5EC]/70">
                    Hãy thử qua tab "4. Bắn Test Thông Báo" để kiểm tra khớp tiền thực tế!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {webhookTxs.map((tx: any, idx: number) => {
                    const isUnassigned = tx.userId === 'admin_root' || tx.title?.includes('cần đối soát');
                    return (
                      <div
                        key={tx.id || idx}
                        className={`p-4 rounded-2xl border transition space-y-2.5 ${
                          isUnassigned
                            ? 'bg-amber-950/20 border-amber-500/40'
                            : 'bg-[#0E1B2E] border-[#C5E5EC]/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                isUnassigned
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-white text-xs">{tx.title}</span>
                                {isUnassigned ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/40">
                                    CHỜ ĐỐI SOÁT
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/40">
                                    ĐÃ KHỚP LỆNH
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#C5E5EC]/70 mt-0.5">
                                {tx.subtitle || tx.note || 'Không có mô tả'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end space-x-3 text-right">
                            <div>
                              <span className="font-mono font-black text-emerald-300 text-sm block">
                                +{Number(tx.amount || 0).toLocaleString('vi-VN')}đ
                              </span>
                              <span className="text-[10px] text-[#C5E5EC]/60 block font-mono">
                                Mã: {tx.bankInfo || tx.id}
                              </span>
                            </div>

                            {isUnassigned && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAssignModalTx(tx);
                                  setAssignTargetInput('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow-md shadow-amber-500/20 cursor-pointer"
                              >
                                Gán Cho Sinh Viên
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Assign Deposit Modal */}
      {assignModalTx && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignModalTx(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#09111D] border border-amber-500/40 shadow-2xl p-6 text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-sm text-white">Đối Soát & Gán Số Dư Thủ Công</h4>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalTx(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#C5E5EC]/60">Số tiền biến động:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  +{Number(assignModalTx.amount || 0).toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C5E5EC]/60">Nội dung chuyển khoản:</span>
                <span className="font-mono text-white font-bold">{assignModalTx.note || 'Không có'}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-[#C5E5EC]/80 font-bold">
                Nhập Số Điện Thoại Hoặc Mã ID 9 Số Của Sinh Viên:
              </label>
              <input
                type="text"
                value={assignTargetInput}
                onChange={(e) => setAssignTargetInput(e.target.value.trim())}
                placeholder="Ví dụ: 0909120918 hoặc 000000002"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#12233B] border border-amber-500/40 text-white font-mono font-bold focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[11px] text-[#C5E5EC]/60">
                Hệ thống sẽ lập tức cộng tiền vào ví của sinh viên này và gửi thông báo đẩy trực tiếp.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalTx(null)}
                className="px-4 py-2 rounded-xl bg-[#12233B] text-[#C5E5EC] text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleAssignTx}
                disabled={isAssigningTx || !assignTargetInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isAssigningTx ? 'Đang Xử Lý...' : 'Xác Nhận Cộng Tiền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserForModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedUserForModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#09111D] border border-[#C5E5EC]/30 shadow-2xl p-6 text-white space-y-5"
          >
            {/* Header */}
            {(() => {
              const isModalRootAdmin = selectedUserForModal.id === '000000000';
              const modalDisplayName = selectedUserForModal.name || `Người dùng (ID: ${selectedUserForModal.id})`;
              return (
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#C5E5EC]/20">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-lg ${
                        isModalRootAdmin
                          ? 'bg-gradient-to-tr from-amber-600 to-rose-600 border-amber-400 text-white'
                          : selectedUserForModal.isLocked
                          ? 'bg-gray-800 border-rose-500/50 text-rose-300'
                          : 'bg-gradient-to-tr from-[#3064AE] to-[#25735B] border-[#E0FAEB]/40 text-white'
                      }`}
                    >
                      {modalDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-lg text-white">{modalDisplayName}</h3>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/10 text-white border border-white/20">
                          ID: {selectedUserForModal.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3064AE]/40 text-[#C5E5EC] border border-[#C5E5EC]/30">
                          {selectedUserForModal.tier}
                        </span>
                        {isModalRootAdmin ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-900/90 text-rose-200 border border-rose-600">
                            ROOT ADMIN
                          </span>
                        ) : null}
                        {selectedUserForModal.isLocked && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                            ĐÃ BỊ CẤM / KHÓA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#C5E5EC]/70 mt-1">
                        Họ tên KYC: {selectedUserForModal.kycName || 'Chưa định danh'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUserForModal(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })()}

            {/* Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Thông tin định danh & Liên lạc */}
              <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-2.5">
                <h4 className="font-extrabold text-[#C5E5EC] text-xs flex items-center space-x-1.5 pb-1 border-b border-[#C5E5EC]/15">
                  <Users className="w-3.5 h-3.5 text-[#C5E5EC]" />
                  <span>Định Danh & Liên Lạc</span>
                </h4>
                <div className="space-y-1.5 text-[#C5E5EC]/85">
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Mã ID 9 Số:</span>
                    <span className="font-mono font-bold text-white">{selectedUserForModal.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Email:</span>
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {selectedUserForModal.email || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Số điện thoại:</span>
                    <span className="font-mono text-white">{selectedUserForModal.phone || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Giới tính & Ngày sinh:</span>
                    <span className="text-white">
                      {selectedUserForModal.gender || 'Khác'} • {selectedUserForModal.birthDate || '01/01/2000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Mật khẩu đăng nhập:</span>
                    <span className="font-mono text-amber-300">
                      {selectedUserForModal.password || '******'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Ví & Tài chính */}
              <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-2.5">
                <h4 className="font-extrabold text-[#C5E5EC] text-xs flex items-center space-x-1.5 pb-1 border-b border-[#C5E5EC]/15">
                  <DollarSign className="w-3.5 h-3.5 text-[#E0FAEB]" />
                  <span>Ví Tiền & Ký Quỹ Escrow</span>
                </h4>
                <div className="space-y-1.5 text-[#C5E5EC]/85">
                  <div className="flex justify-between items-center">
                    <span className="text-[#C5E5EC]/60">Số dư khả dụng:</span>
                    <span className="font-mono font-bold text-[#E0FAEB] text-sm">
                      {formatVnd(selectedUserForModal.walletBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C5E5EC]/60">Ký quỹ Escrow khóa:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatVnd(selectedUserForModal.escrowLockedBalance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C5E5EC]/60">Tổng đã chi tiêu:</span>
                    <span className="font-mono text-white">
                      {formatVnd(selectedUserForModal.totalSpent || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#C5E5EC]/60">Ví MoMo liên kết:</span>
                    <span className="font-mono text-white">
                      {selectedUserForModal.connectedMoMo || 'Chưa liên kết'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Điểm Uy Tín & Hiệu Suất */}
              <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-2.5">
                <h4 className="font-extrabold text-[#C5E5EC] text-xs flex items-center space-x-1.5 pb-1 border-b border-[#C5E5EC]/15">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                  <span>Uy Tín & Hiệu Suất Campus</span>
                </h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-[#C5E5EC]/70">Điểm uy tín hệ thống:</span>
                      <span className="font-mono font-extrabold text-amber-300 text-sm">
                        {Math.min(100, Math.max(0, selectedUserForModal.trustScore ?? 0))} / 100
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-[#E0FAEB] rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, selectedUserForModal.trustScore ?? 0))}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#C5E5EC]/50 italic block mt-1">
                      * Tối đa 100 điểm. Khi đạt 100 điểm sẽ không cộng dồn thêm nữa.
                    </span>
                  </div>

                  <div className="flex justify-between text-[#C5E5EC]/85 pt-1">
                    <span className="text-[#C5E5EC]/60">Đánh giá sao:</span>
                    <span className="font-bold text-amber-300">
                      {selectedUserForModal.rating || 0} ★ ({selectedUserForModal.reviewCount || 0} đánh giá)
                    </span>
                  </div>
                  <div className="flex justify-between text-[#C5E5EC]/85">
                    <span className="text-[#C5E5EC]/60">Việc hoàn thành:</span>
                    <span className="font-bold text-white">
                      {selectedUserForModal.completedGigs || 0} việc
                    </span>
                  </div>
                  <div className="flex justify-between text-[#C5E5EC]/85">
                    <span className="text-[#C5E5EC]/60">Điểm ELO / Hạng:</span>
                    <span className="font-mono text-white">
                      {selectedUserForModal.eloRating ?? 200} ({selectedUserForModal.eloTier || 'BRONZE'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 4: Xác thực Bảo Mật & KYC */}
              <div className="p-4 rounded-2xl bg-[#0E1B2E] border border-[#C5E5EC]/20 space-y-2.5">
                <h4 className="font-extrabold text-[#C5E5EC] text-xs flex items-center space-x-1.5 pb-1 border-b border-[#C5E5EC]/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E0FAEB]" />
                  <span>Xác Minh Danh Tính & KYC</span>
                </h4>
                <div className="space-y-1.5 text-[#C5E5EC]/85">
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Duyệt KYC C06:</span>
                    <span className={selectedUserForModal.isKycApproved ? 'text-[#E0FAEB] font-bold' : 'text-amber-400'}>
                      {selectedUserForModal.isKycApproved ? '✅ Đã xác thực' : '⏳ Chưa xác thực'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Quét chip NFC CCCD:</span>
                    <span className={selectedUserForModal.isNfcVerified ? 'text-[#E0FAEB] font-bold' : 'text-[#C5E5EC]/50'}>
                      {selectedUserForModal.isNfcVerified ? '✅ Đạt chuẩn C06' : 'Chưa quét NFC'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Nhận diện Face Liveness:</span>
                    <span className={selectedUserForModal.isFaceLivenessPassed ? 'text-[#E0FAEB] font-bold' : 'text-[#C5E5EC]/50'}>
                      {selectedUserForModal.isFaceLivenessPassed ? '✅ Khuôn mặt sống động' : 'Chưa quét'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Sinh viên trường:</span>
                    <span className="text-white truncate max-w-[170px]">
                      {selectedUserForModal.studentSchool || 'Chưa liên kết trường'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5E5EC]/60">Trạng thái tài khoản:</span>
                    <span className={selectedUserForModal.isLocked ? 'text-rose-400 font-bold' : 'text-[#E0FAEB] font-bold'}>
                      {selectedUserForModal.isLocked ? '🔴 BỊ CẤM / KHÓA' : '🟢 HOẠT ĐỘNG BÌNH THƯỜNG'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons inside Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#C5E5EC]/20">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {selectedUserForModal.id === '000000000' ? (
                  <span className="text-xs text-amber-300 italic font-semibold">
                    🛡️ Tài khoản Quản trị viên tối cao (000000000) được bảo vệ 100%. Không thể cấm hoặc xóa.
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        adminToggleLockUser(selectedUserForModal.id);
                        setSelectedUserForModal((prev) => (prev ? { ...prev, isLocked: !prev.isLocked } : null));
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-2xl font-bold text-xs transition flex items-center justify-center space-x-1.5 border cursor-pointer ${
                        selectedUserForModal.isLocked
                          ? 'bg-[#25735B] hover:bg-[#25735B]/80 text-[#E0FAEB] border-[#25735B]/50'
                          : 'bg-amber-950/70 hover:bg-amber-900 text-amber-200 border-amber-600/50'
                      }`}
                    >
                      {selectedUserForModal.isLocked ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                          <span>Mở cấm tài khoản</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 text-amber-300" />
                          <span>Cấm / Khóa tài khoản</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserToDelete(selectedUserForModal);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa tài khoản này</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForModal(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single User Confirmation Modal */}
      {userToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingUser) setUserToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#09111D] border border-rose-500/50 shadow-2xl p-6 text-white space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-lg text-white">Xác Nhận Xóa Tài Khoản?</h3>
              <p className="text-xs text-[#C5E5EC]/80 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của{' '}
                <strong className="text-white font-bold">{userToDelete.name}</strong> (ID: {userToDelete.id})
                khỏi toàn bộ hệ thống?
              </p>
              <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50 text-left mt-2">
                ⚠️ Thao tác này sẽ gỡ bỏ tài khoản và dữ liệu người dùng khỏi cả Firestore Cloud và Express DB.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={async () => {
                  setIsDeletingUser(true);
                  try {
                    const deletedId = userToDelete.id;
                    await adminDeleteUser(deletedId);
                    // Tức thì loại bỏ ngay khỏi danh sách nghi vấn trên giao diện (Zero-delay cleanup)
                    setSybilAudit((prev) => {
                      const remainingThreats = prev.threats.filter((t) => t.userId !== deletedId);
                      return {
                        ...prev,
                        totalScannedUsers: Math.max(0, prev.totalScannedUsers - 1),
                        flaggedCount: remainingThreats.length,
                        highRiskRingsCount: remainingThreats.filter((t) => t.threatLevel === 'HIGH_RISK_SYBIL_RING').length,
                        threats: remainingThreats,
                      };
                    });
                    setHandledThreatIds((prev) => prev.filter((id) => id !== `sybil_${deletedId}`));
                    setUserToDelete(null);
                    setSelectedUserForModal(null);
                  } finally {
                    setIsDeletingUser(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/50 cursor-pointer"
              >
                {isDeletingUser ? (
                  <span>Đang xóa...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Purge All Non-Admin Users Confirmation Modal */}
      {showPurgeConfirmModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPurging) setShowPurgeConfirmModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#09111D] border-2 border-rose-500 shadow-2xl shadow-rose-950/60 p-6 text-white space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-950/90 border border-rose-500 flex items-center justify-center text-rose-400 mx-auto animate-bounce">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-black text-xl text-white">XÓA SẠCH DỮ LIỆU NGƯỜI DÙNG?</h3>
              <p className="text-xs text-[#C5E5EC]/90 leading-relaxed">
                Hệ thống sẽ thực hiện dọn sạch <strong className="text-rose-400">TOÀN BỘ</strong> tài khoản người
                dùng, công việc, tin nhắn, và lịch sử giao dịch.
              </p>
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-700/60 text-left space-y-1.5 text-xs text-rose-200">
                <div className="flex items-center space-x-2 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#E0FAEB]" />
                  <span>Duy nhất 1 tài khoản được giữ lại an toàn tuyệt đối:</span>
                </div>
                <div className="ml-6 font-mono text-[11px] text-[#E0FAEB] space-y-0.5">
                  <p>• ID: <strong>000000000</strong></p>
                  <p>• Email: <strong>admin@admin.vn</strong></p>
                  <p>• Số điện thoại: <strong>0909120918</strong></p>
                  <p>• Mật khẩu: <strong>admin1507</strong></p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setShowPurgeConfirmModal(false)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ (Giữ nguyên)
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={async () => {
                  setIsPurging(true);
                  try {
                    await adminPurgeAllUsersExceptAdmin();
                    setShowPurgeConfirmModal(false);
                    setSelectedUserForModal(null);
                  } finally {
                    setIsPurging(false);
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center justify-center space-x-2 shadow-xl shadow-rose-900/60 cursor-pointer"
              >
                {isPurging ? (
                  <span>Đang dọn sạch hệ thống...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xác nhận xóa sạch (Chỉ giữ lại Admin)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIETQR TRANSFER MODAL FOR ADMIN */}
      {selectedWithdrawalForQr && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedWithdrawalForQr(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#0B1528] border-2 border-cyan-500/40 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Quét Mã Chuyển Tiền Napas 247</h4>
                  <p className="text-[11px] text-slate-400">Cách 1: Quét bằng App Ngân Hàng của bạn</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWithdrawalForQr(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Image Box */}
            <div className="bg-white p-3 rounded-2xl shadow-inner text-center">
              <img
                src={`https://img.vietqr.io/image/${getBankCode(selectedWithdrawalForQr.bankName)}-${selectedWithdrawalForQr.accountNumber}-compact2.png?amount=${Math.abs(selectedWithdrawalForQr.amount)}&addInfo=${encodeURIComponent(`GIGME THU LAO ${selectedWithdrawalForQr.userId.slice(-6)}`)}&accountName=${encodeURIComponent(selectedWithdrawalForQr.accountHolderName || '')}`}
                alt="VietQR Chuyển Tiền"
                className="w-56 h-56 mx-auto object-contain"
              />
              <p className="text-[11px] text-slate-600 font-bold mt-2">
                Quét mã qua MB / Vietcombank / Techcombank...
              </p>
            </div>

            {/* Info Summary */}
            <div className="p-3 rounded-xl bg-[#12233B] border border-cyan-500/20 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="text-emerald-400 font-black text-sm">{formatVnd(Math.abs(selectedWithdrawalForQr.amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="text-white font-bold">{selectedWithdrawalForQr.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="text-cyan-300 font-bold">{selectedWithdrawalForQr.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="text-white font-bold uppercase">{selectedWithdrawalForQr.accountHolderName}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('success');
                  adminApproveWithdrawal(selectedWithdrawalForQr.id);
                  setSelectedWithdrawalForQr(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs hover:brightness-110 shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tôi Đã Chuyển Tiền Xong &rarr; Bấm Xác Nhận</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWithdrawalForQr(null)}
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL REASON MODAL */}
      {rejectingTxId && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectingTxId(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#0B1528] border-2 border-rose-500/40 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Từ Chối & Hoàn Tiền Vào Ví</span>
            </div>
            <p className="text-xs text-slate-300">
              Vui lòng nhập lý do từ chối. Số tiền sẽ được hoàn trả lại ngay lập tức vào ví của sinh viên.
            </p>
            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-[#12233B] border border-rose-500/40 text-white text-xs focus:outline-none focus:border-rose-400"
              placeholder="Nhập lý do (ví dụ: Số tài khoản không đúng, tên chủ thẻ không khớp...)"
            />
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingTxId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('error');
                  adminRejectWithdrawal(rejectingTxId, rejectReasonText || 'Không đủ điều kiện rút tiền');
                  setRejectingTxId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-500 transition shadow-lg"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO TÀI KHOẢN MOD MỚI */}
      {showCreateModModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0B1528] border border-purple-500/40 p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-white">Tạo Tài Khoản Kiểm Duyệt Viên Mới</h3>
                  <p className="text-[11px] text-[#C5E5EC]/70">Khởi tạo Mod và thiết lập phân quyền hạn ngay lập tức</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">
                    ID 9 Chữ Số <span className="text-purple-300 font-mono">(Tự động hoặc tùy chỉnh)</span>
                  </label>
                  <input
                    type="text"
                    value={newModId}
                    onChange={(e) => setNewModId(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="VD: 000000004"
                    maxLength={9}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono font-bold focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Họ Và Tên Kiểm Duyệt Viên *</label>
                  <input
                    type="text"
                    required
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    placeholder="VD: Kiểm Duyệt Viên 4"
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-purple-400 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Email Đăng Nhập *</label>
                  <input
                    type="email"
                    required
                    value={newModEmail}
                    onChange={(e) => setNewModEmail(e.target.value)}
                    placeholder="mod4@gigme.vn"
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={newModPhone}
                    onChange={(e) => setNewModPhone(e.target.value)}
                    placeholder="0904000004"
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#C5E5EC]/80 font-bold mb-1">Mật Khẩu Đăng Nhập *</label>
                <input
                  type="text"
                  required
                  value={newModPassword}
                  onChange={(e) => setNewModPassword(e.target.value)}
                  placeholder="mod4444"
                  className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono font-bold focus:border-purple-400 focus:outline-none"
                />
              </div>

              {/* Permissions Checkboxes - 15 Permissions */}
              <div className="pt-2 border-t border-[#C5E5EC]/15 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-extrabold text-[#E0FAEB] text-xs">Phân Quyền Cho Mod Mới (15 Quyền):</span>
                  <div className="space-x-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewModPermissions(ALL_MOD_PERMISSIONS)}
                      className="text-purple-300 hover:underline font-bold"
                    >
                      Cấp tất cả (15)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewModPermissions(ALL_FALSE_PERMISSIONS)}
                      className="text-rose-300 hover:underline font-bold"
                    >
                      Thu hồi hết
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setNewModPermissions(DEFAULT_MOD_PERMISSIONS)}
                      className="text-[#C5E5EC] hover:underline font-bold"
                    >
                      Mặc định
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 bg-[#0E1B2E] p-3 rounded-2xl border border-[#C5E5EC]/15 max-h-60 overflow-y-auto pr-1 divide-y divide-[#C5E5EC]/10">
                  {MOD_PERMISSIONS_CONFIG.map((pConf) => (
                    <label
                      key={pConf.key}
                      className="flex items-start space-x-2.5 cursor-pointer hover:bg-[#12233B]/60 p-2 rounded-xl transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(newModPermissions[pConf.key])}
                        onChange={(e) =>
                          setNewModPermissions((p) => ({ ...p, [pConf.key]: e.target.checked }))
                        }
                        className="w-4 h-4 accent-purple-500 rounded mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-white text-xs">{pConf.label}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#12233B] text-[#C5E5EC]/70 shrink-0">
                            {pConf.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#C5E5EC]/60 block leading-tight">{pConf.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-purple-900/50 border border-purple-400/40 cursor-pointer"
                >
                  Tạo Tài Khoản Mod Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA THÔNG TIN & PHÂN QUYỀN MOD */}
      {editingMod && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingMod(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0B1528] border border-purple-500/40 p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C5E5EC]/15">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Edit className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-white">Chỉnh Sửa Thông Tin Mod</h3>
                  <p className="text-[11px] text-purple-300 font-mono">ID: {editingMod.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMod(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditModSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Họ Và Tên</label>
                  <input
                    type="text"
                    required
                    value={editModName}
                    onChange={(e) => setEditModName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-purple-400 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={editModPhone}
                    onChange={(e) => setEditModPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editModEmail}
                    onChange={(e) => setEditModEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#C5E5EC]/80 font-bold mb-1">Mật Khẩu Mới (Nếu muốn đổi)</label>
                  <input
                    type="text"
                    value={editModPassword}
                    onChange={(e) => setEditModPassword(e.target.value)}
                    placeholder="Giữ nguyên hoặc nhập mới"
                    className="w-full px-3 py-2 rounded-xl bg-[#12233B] border border-[#C5E5EC]/25 text-white font-mono focus:border-purple-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions Checklist - 15 Permissions */}
              <div className="pt-2 border-t border-[#C5E5EC]/15 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-extrabold text-[#E0FAEB] text-xs">Cập Nhật Bảng Phân Quyền (15 Quyền):</span>
                  <div className="space-x-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEditModPermissions(ALL_MOD_PERMISSIONS)}
                      className="text-purple-300 hover:underline font-bold"
                    >
                      Cấp tất cả (15)
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditModPermissions(ALL_FALSE_PERMISSIONS)}
                      className="text-rose-300 hover:underline font-bold"
                    >
                      Thu hồi hết
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setEditModPermissions(DEFAULT_MOD_PERMISSIONS)}
                      className="text-[#C5E5EC] hover:underline font-bold"
                    >
                      Mặc định
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 bg-[#0E1B2E] p-3 rounded-2xl border border-[#C5E5EC]/15 max-h-60 overflow-y-auto pr-1 divide-y divide-[#C5E5EC]/10">
                  {MOD_PERMISSIONS_CONFIG.map((pConf) => (
                    <label
                      key={pConf.key}
                      className="flex items-start space-x-2.5 cursor-pointer hover:bg-[#12233B]/60 p-2 rounded-xl transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editModPermissions[pConf.key])}
                        onChange={(e) =>
                          setEditModPermissions((p) => ({ ...p, [pConf.key]: e.target.checked }))
                        }
                        className="w-4 h-4 accent-purple-500 rounded mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-white text-xs">{pConf.label}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-[#12233B] text-[#C5E5EC]/70 shrink-0">
                            {pConf.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#C5E5EC]/60 block leading-tight">{pConf.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMod(null)}
                  className="px-4 py-2 rounded-xl bg-[#12233B] hover:bg-[#162B48] text-[#C5E5EC] font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-purple-900/50 border border-purple-400/40 cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XÁC NHẬN XÓA TÀI KHOẢN MOD */}
      {modToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#0B1528] border-2 border-rose-500/50 p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Xác Nhận Xóa Tài Khoản Mod</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản kiểm duyệt <strong>{modToDelete.name}</strong> (ID:{' '}
              <code className="text-purple-300 font-mono">{modToDelete.id}</code>)? Mọi quyền hạn sẽ bị thu hồi ngay lập tức.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMod}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-500 transition shadow-lg"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Maintenance Modal */}
      <AdminMaintenanceModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />
    </div>
  );
};
