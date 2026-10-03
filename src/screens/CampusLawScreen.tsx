import React, { useState, useMemo } from 'react';
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Copy,
  Check,
  ShieldAlert,
  HelpCircle,
  Bookmark,
  ArrowLeft,
  Download,
  X,
  Send,
  Search,
  CheckCircle2,
  ShoppingBag,
  Gavel,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useGigMe } from '../context/GigMeContext';
import {
  FULL_LAW_ARTICLES,
  LAW_CHAPTER_LIST,
  LawArticle,
} from '../data/campusLawData';

interface CampusLawScreenProps {
  onBack?: () => void;
  onOpenContactAdmin?: () => void;
}

export const CampusLawScreen: React.FC<CampusLawScreenProps> = ({
  onBack,
  onOpenContactAdmin,
}) => {
  const { currentUser, showNotification, sendChat, language } = useGigMe();
  const [selectedChapter, setSelectedChapter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({
    'art-1': true,
    'art-4': true,
    'art-5': true,
    'art-16': true,
    'art-18': true,
  });

  const lawChapters = useMemo(
    () =>
      LAW_CHAPTER_LIST.map((chap) => ({
        ...chap,
        label: language === 'vi' ? chap.labelVi : chap.labelEn,
      })),
    [language]
  );

  // Persistent digital signature state
  const [signatureInfo, setSignatureInfo] = useState<{
    isSigned: boolean;
    signedAt?: number;
    signatureHash?: string;
  }>(() => {
    try {
      const key = `gigme_law_signed_${currentUser?.id || '000000000'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
      return { isSigned: false };
    } catch {
      return { isSigned: false };
    }
  });

  // Bookmarked articles state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const key = `gigme_law_bookmarks_${currentUser?.id || '000000000'}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : ['art-4', 'art-18'];
    } catch {
      return ['art-4', 'art-18'];
    }
  });

  const [copiedArticleId, setCopiedArticleId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportTargetArticle, setReportTargetArticle] = useState<string>('art-5');
  const [reportViolationContent, setReportViolationContent] = useState<string>('');
  const [reportSuspectId, setReportSuspectId] = useState<string>('');

  // Helpers for localized article properties
  const getArticleNumber = (a: LawArticle) =>
    language === 'vi' ? a.articleNumberVi : a.articleNumberEn;
  const getArticleTitle = (a: LawArticle) =>
    language === 'vi' ? a.titleVi : a.titleEn;
  const getArticleSummary = (a: LawArticle) =>
    language === 'vi' ? a.summaryVi : a.summaryEn;
  const getArticleClauses = (a: LawArticle) =>
    language === 'vi' ? a.clausesVi : a.clausesEn;
  const getPenaltySnippet = (a: LawArticle) =>
    language === 'vi' ? a.penaltySnippetVi : a.penaltySnippetEn;

  // Save bookmarks
  const toggleBookmark = (articleId: string) => {
    triggerHaptic('light');
    setBookmarkedIds((prev) => {
      const updated = prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId];
      try {
        localStorage.setItem(`gigme_law_bookmarks_${currentUser?.id || '000000000'}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Toggle expand
  const toggleArticle = (id: string) => {
    triggerHaptic('light');
    setExpandedArticles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand / Collapse all
  const toggleAll = (expand: boolean) => {
    triggerHaptic('medium');
    const newState: Record<string, boolean> = {};
    FULL_LAW_ARTICLES.forEach((a) => {
      newState[a.id] = expand;
    });
    setExpandedArticles(newState);
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return FULL_LAW_ARTICLES.filter((article) => {
      // Bookmarks filter
      if (selectedChapter === 'BOOKMARKS') {
        if (!bookmarkedIds.includes(article.id)) return false;
      } else if (selectedChapter !== 'ALL' && article.category !== selectedChapter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitleVi = article.titleVi.toLowerCase().includes(query);
        const matchTitleEn = article.titleEn.toLowerCase().includes(query);
        const matchSummaryVi = article.summaryVi.toLowerCase().includes(query);
        const matchSummaryEn = article.summaryEn.toLowerCase().includes(query);
        const matchNumberVi = article.articleNumberVi.toLowerCase().includes(query);
        const matchNumberEn = article.articleNumberEn.toLowerCase().includes(query);
        const matchClausesVi = article.clausesVi.some((c) => c.toLowerCase().includes(query));
        const matchClausesEn = article.clausesEn.some((c) => c.toLowerCase().includes(query));

        return (
          matchTitleVi ||
          matchTitleEn ||
          matchSummaryVi ||
          matchSummaryEn ||
          matchNumberVi ||
          matchNumberEn ||
          matchClausesVi ||
          matchClausesEn
        );
      }
      return true;
    });
  }, [selectedChapter, searchQuery, bookmarkedIds]);

  // Copy article text
  const handleCopyArticle = (article: LawArticle) => {
    triggerHaptic('success');
    const artNum = getArticleNumber(article);
    const artTitle = getArticleTitle(article);
    const artClauses = getArticleClauses(article);
    const footerSource =
      language === 'vi'
        ? '(Nguồn: Bộ Luật Nền Tảng GigMe Campus 2026 - Bản quyền thi hành toàn quốc)'
        : '(Source: GigMe Campus Platform Code 2026 - Official Enacted Version)';

    const text = `${artNum}: ${artTitle}\n\n${artClauses.join('\n')}\n\n${footerSource}`;
    navigator.clipboard.writeText(text);
    setCopiedArticleId(article.id);
    showNotification(
      language === 'vi' ? 'Đã sao chép điều khoản!' : 'Article Copied!',
      language === 'vi'
        ? `Đã chép nội dung ${artNum} vào bộ nhớ tạm.`
        : `Copied ${artNum} to clipboard.`
    );
    setTimeout(() => setCopiedArticleId(null), 2500);
  };

  // Confirm digital commitment
  const handleConfirmCommitment = () => {
    triggerHaptic('success');
    const now = Date.now();
    const hash = `GIGME-SHA256-${currentUser?.id || '000000000'}-${now.toString(16).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const info = {
      isSigned: true,
      signedAt: now,
      signatureHash: hash,
    };

    setSignatureInfo(info);
    try {
      localStorage.setItem(`gigme_law_signed_${currentUser?.id || '000000000'}`, JSON.stringify(info));
    } catch {
      // ignore
    }

    showNotification(
      language === 'vi' ? 'Cam Kết Pháp Lý Thành Công! ⚖️' : 'Legal Commitment Signed! ⚖️',
      language === 'vi'
        ? `Tài khoản ID ${currentUser?.id || '000000000'} đã ký điện tử cam kết tuân thủ 100% Bộ Luật & Quy chế GigMe Campus. Mã chứng thư số: ${hash}`
        : `Account ID ${currentUser?.id || '000000000'} digitally signed 100% compliance with GigMe Campus Code. Certificate hash: ${hash}`,
      true,
      true
    );
  };

  // Download / Export plain text summary of law
  const handleExportLawText = () => {
    triggerHaptic('medium');
    const isVi = language === 'vi';
    const headerTitle = isVi
      ? 'BỘ LUẬT & ĐIỀU KHOẢN NỀN TẢNG GIGME CAMPUS (NĂM 2026)'
      : 'GIGME CAMPUS PLATFORM CODE & TERMS OF SERVICE (2026)';
    const headerSub = isVi
      ? 'Hệ thống văn bản pháp quy Campus Student Escrow Code v2.4\nTuân thủ Nghị định 13/2023/NĐ-CP & Tiêu chuẩn Escrow Bảo Chứng'
      : 'Campus Student Escrow Regulatory Code v2.4\nCompliant with Decree 13/2023/ND-CP & Escrow Vault Standards';

    const bodyContent = FULL_LAW_ARTICLES.map((a) => {
      const num = isVi ? a.articleNumberVi : a.articleNumberEn;
      const title = isVi ? a.titleVi : a.titleEn;
      const summary = isVi ? a.summaryVi : a.summaryEn;
      const clauses = isVi ? a.clausesVi : a.clausesEn;
      return `${num}: ${title}\n${summary}\n${clauses.join('\n')}\n`;
    }).join('\n-----------------------------------------------------\n');

    const authFooter = isVi
      ? 'Chứng thực bởi: GigMe Campus Executive Board\nĐơn vị bảo lãnh: Ban Quản Trị Tối Cao (ID 000000000)'
      : 'Certified by: GigMe Campus Executive Board\nUnderwriter: Supreme Admin Master (ID 000000000)';

    const content = `=====================================================\n${headerTitle}\n${headerSub}\n=====================================================\n\n${bodyContent}\n${authFooter}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isVi ? `GigMe-Bo-Luat-Campus-2026.txt` : `GigMe-Campus-Code-2026.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification(
      language === 'vi' ? 'Đã tải văn bản bộ luật!' : 'Code Downloaded!',
      language === 'vi'
        ? 'Tệp văn bản GigMe-Bo-Luat-Campus-2026.txt đã được lưu về thiết bị.'
        : 'GigMe-Campus-Code-2026.txt has been saved to your device.'
    );
  };

  // Send report to Admin
  const handleSendReportToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    sendChat(
      `🚨 [TỐ CÁO VI PHẠM PHÁP QUY]\n- Điều khoản vi phạm: ${reportTargetArticle}\n- ID/Người bị tố cáo: ${reportSuspectId || (language === 'vi' ? 'Chưa rõ' : 'Unspecified')}\n- Chi tiết hành vi: ${reportViolationContent}\n- Người gửi báo cáo: ID ${currentUser?.id || '000000000'} (${currentUser?.name || (language === 'vi' ? 'Thành viên' : 'Member')})`,
      'NONE',
      null,
      0,
      undefined,
      undefined,
      '000000000',
      'Quản Trị Viên Tối Cao'
    );
    setShowReportModal(false);
    setReportViolationContent('');
    setReportSuspectId('');
    showNotification(
      language === 'vi' ? 'Đã gửi báo cáo vi phạm tới Ban Quản Trị 🛡️' : 'Violation Report Sent to Admin 🛡️',
      language === 'vi'
        ? 'Hội đồng Trọng tài Admin Master 000000000 đã tiếp nhận hồ sơ và sẽ tiến hành xác minh trong 30 phút!'
        : 'Admin Master 000000000 arbitration panel received your dossier and will verify within 30 minutes!',
      true,
      true
    );
    if (onOpenContactAdmin) {
      onOpenContactAdmin();
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 pb-28 animate-fadeIn">
      {/* TOP HERO LEGAL HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F1E38] via-[#0B1527] to-[#070D18] border-b border-[#C5E5EC]/20 pt-6 pb-8 px-4 sm:px-6">
        {/* Ambient lighting effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#3064AE]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-4">
          {/* Top compliance badge bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              {onBack && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onBack();
                  }}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] hover:text-white flex items-center space-x-1 transition text-xs font-bold mr-1 cursor-pointer active:scale-95"
                  title={language === 'vi' ? 'Quay lại' : 'Back'}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'vi' ? 'Quay lại' : 'Back'}</span>
                </button>
              )}
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'vi' ? 'Quy Chuẩn Chính Thức 2026' : 'Official 2026 Standards'}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 font-bold text-[10px]">
                <span>{language === 'vi' ? 'Nghị định 13/2023/NĐ-CP' : 'Decree 13/2023/ND-CP'}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#C5E5EC]/70">
              <button
                type="button"
                onClick={handleExportLawText}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white border border-[#C5E5EC]/20 flex items-center space-x-1 font-bold transition cursor-pointer"
                title={language === 'vi' ? 'Tải tệp văn bản quy chế' : 'Download code summary'}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Tải Bản Văn Bản' : 'Download Text Copy'}</span>
              </button>
              <span>
                {language === 'vi' ? 'Mã văn bản:' : 'Doc ID:'} <strong>GIGME-LAW-2026</strong>
              </span>
            </div>
          </div>

          {/* Main Title & Authority Emblem */}
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-600 to-amber-700 p-0.5 shadow-xl shadow-amber-900/40 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-[#0A1220] flex items-center justify-center text-amber-300">
                <Scale className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>
                  {language === 'vi'
                    ? 'BỘ LUẬT & ĐIỀU KHOẢN GIGME CAMPUS'
                    : 'GIGME CAMPUS PLATFORM CODE & TERMS'}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#C5E5EC]/85 leading-relaxed font-medium">
                {language === 'vi'
                  ? 'Quy định nghiêm ngặt về Ký quỹ Smart Escrow 100%, Chợ KTX & đồ dùng cũ sinh viên, Định danh chính chủ, Chống lừa đảo, Xử lý bỏ kèo và Khung chế tài xử phạt trên toàn hệ thống.'
                  : 'Strict regulations regarding 100% Smart Escrow pre-funding, Dorm flea market used goods, authentic KYC identity, anti-fraud, no-show penalties, and systemwide sanction framework.'}
              </p>
            </div>
          </div>

          {/* Key Pillars Highlights (4 summary cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">Smart Escrow 100%</div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">
                {language === 'vi' ? 'Khóa tiền an toàn, cấm lách sàn' : 'Safe pre-lock, no off-platforming'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-extrabold text-[11px] text-white">
                {language === 'vi' ? 'Quy Chế Chợ KTX' : 'Dorm Flea Market'}
              </div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">
                {language === 'vi' ? 'Điều 18: Cọc giữ đồ & tặng 0đ' : 'Article 18: Escrow holds & free 0đ'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">
                {language === 'vi' ? 'Chống Fake GPS' : 'Anti-Mock GPS'}
              </div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">
                {language === 'vi' ? 'Bằng chứng Blockchain Hash' : 'Blockchain proof watermarking'}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#0D1B30] border border-[#C5E5EC]/20 text-center space-y-1">
              <div className="w-7 h-7 mx-auto rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Gavel className="w-4 h-4" />
              </div>
              <div className="font-extrabold text-[11px] text-white">
                {language === 'vi' ? 'Khung 5 Mức Phạt' : '5-Tier Sanctions'}
              </div>
              <div className="text-[10px] text-[#C5E5EC]/70 leading-tight">
                {language === 'vi' ? 'Khóa tài khoản & Xử lý hình sự' : 'Account freeze to criminal referral'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORY FILTER BAR */}
      <div className="sticky top-0 z-30 bg-[#070D18]/95 backdrop-blur-md border-b border-[#C5E5EC]/15 py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#C5E5EC]/60 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'vi'
                  ? "Tra cứu nhanh luật: 'chợ KTX', 'hoàn tiền', 'lách sàn', 'bỏ kèo', 'cọc giữ đồ', 'xử phạt'..."
                  : "Quick lookup: 'dorm market', 'refund', 'leakage', 'no-show', 'escrow hold', 'sanction'..."
              }
              className="w-full pl-10 pr-24 py-2.5 rounded-2xl bg-[#0F1E34] border border-[#C5E5EC]/25 text-white text-xs placeholder:text-[#C5E5EC]/40 focus:outline-none focus:border-amber-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white/10 hover:bg-white/20 text-[#C5E5EC] transition cursor-pointer"
              >
                {language === 'vi' ? 'Xóa tìm' : 'Clear'}
              </button>
            )}
          </div>

          {/* Horizontal Chapter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
            {lawChapters.map((chap) => {
              const Icon = chap.icon;
              const isSelected = selectedChapter === chap.id;
              return (
                <button
                  key={chap.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedChapter(chap.id);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white border-amber-300 shadow-md shadow-amber-900/30'
                      : 'bg-[#0E1B2E] border-[#C5E5EC]/20 text-[#C5E5EC]/80 hover:text-white hover:bg-[#13243C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{chap.label}</span>
                  {chap.id === 'BOOKMARKS' && bookmarkedIds.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black">
                      {bookmarkedIds.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN ARTICLES LIST */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* Counter and Expand All / Collapse All */}
        <div className="flex items-center justify-between text-xs text-[#C5E5EC]/80 pb-1">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white">
              {language === 'vi'
                ? `Hiển thị ${filteredArticles.length} điều khoản chặt chẽ`
                : `Showing ${filteredArticles.length} strict provisions`}
            </span>
            {selectedChapter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {language === 'vi' ? 'Mục:' : 'Category:'} {lawChapters.find((c) => c.id === selectedChapter)?.label}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-[11px] font-bold text-rose-300 transition cursor-pointer flex items-center space-x-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Báo Cáo Vi Phạm' : 'Report Violation'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleAll(true)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 text-[11px] font-bold text-[#C5E5EC] transition cursor-pointer"
            >
              {language === 'vi' ? 'Mở hết' : 'Expand All'}
            </button>
            <button
              type="button"
              onClick={() => toggleAll(false)}
              className="px-2.5 py-1 rounded-lg bg-[#0E1B2E] hover:bg-[#13243C] border border-[#C5E5EC]/20 text-[11px] font-bold text-[#C5E5EC] transition cursor-pointer"
            >
              {language === 'vi' ? 'Thu gọn' : 'Collapse All'}
            </button>
          </div>
        </div>

        {/* Empty Search Result */}
        {filteredArticles.length === 0 && (
          <div className="p-8 rounded-3xl bg-[#0D182A] border border-[#C5E5EC]/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">
              {language === 'vi' ? 'Không tìm thấy điều khoản phù hợp' : 'No matching articles found'}
            </h3>
            <p className="text-xs text-[#C5E5EC]/70 max-w-sm mx-auto">
              {language === 'vi'
                ? `Không có kết quả khớp với bộ lọc hoặc từ khóa "${searchQuery}". Bạn có thể thử tìm với: "chợ KTX", "hoàn tiền", "cọc", "chat", "CCCD", hoặc bấm xem toàn bộ bộ luật.`
                : `No results matching your filters or keyword "${searchQuery}". Try searching: "dorm market", "refund", "escrow", "chat", "KYC", or view the entire code.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedChapter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition cursor-pointer"
            >
              {language === 'vi' ? 'Xem tất cả 18 điều khoản' : 'View All 18 Articles'}
            </button>
          </div>
        )}

        {/* Article Cards */}
        {filteredArticles.map((article) => {
          const isExpanded = !!expandedArticles[article.id];
          const isBookmarked = bookmarkedIds.includes(article.id);
          const artNum = getArticleNumber(article);
          const artTitle = getArticleTitle(article);
          const artSummary = getArticleSummary(article);
          const artClauses = getArticleClauses(article);
          const penalty = getPenaltySnippet(article);

          return (
            <div
              key={article.id}
              className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                article.isCritical
                  ? 'bg-gradient-to-b from-[#0F1E36] to-[#0A1424] border-amber-500/40 shadow-lg shadow-amber-950/20'
                  : 'bg-[#0B1526] border-[#C5E5EC]/20 hover:border-[#C5E5EC]/40'
              }`}
            >
              {/* Card Header (Click to toggle) */}
              <div
                onClick={() => toggleArticle(article.id)}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition"
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs shrink-0 mt-0.5 border ${
                      article.isCritical
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black border-amber-300'
                        : 'bg-[#12233B] text-[#00E5FF] border-[#00E5FF]/30'
                    }`}
                  >
                    {artNum}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                        {artTitle}
                      </h2>
                      {article.isCritical && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black uppercase tracking-wider">
                          {language === 'vi' ? 'Đặc Biệt Quan Trọng' : 'Critical Provision'}
                        </span>
                      )}
                      {article.category === 'MARKETPLACE' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider">
                          {language === 'vi' ? 'Chợ KTX & Escrow Đồ Cũ' : 'Dorm Flea Market & Escrow'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#C5E5EC]/75 line-clamp-2">
                      {artSummary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(article.id);
                    }}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isBookmarked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-white/5 hover:bg-white/15 text-[#C5E5EC]'
                    }`}
                    title={
                      isBookmarked
                        ? language === 'vi'
                          ? 'Bỏ lưu điều khoản'
                          : 'Remove bookmark'
                        : language === 'vi'
                        ? 'Lưu lại điều khoản này'
                        : 'Bookmark article'
                    }
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-300' : ''}`} />
                  </button>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyArticle(article);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#C5E5EC] hover:text-white transition cursor-pointer"
                    title={language === 'vi' ? 'Sao chép điều khoản này' : 'Copy this article'}
                  >
                    {copiedArticleId === article.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <div className="p-2 rounded-xl bg-white/5 text-[#C5E5EC]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Card Body (Detailed Clauses) */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 space-y-3.5 border-t border-[#C5E5EC]/15 text-xs text-slate-200 leading-relaxed animate-fadeIn">
                  <div className="space-y-2.5 pt-2">
                    {artClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-[#070D18]/60 border border-white/5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                        <span className="leading-relaxed">{clause}</span>
                      </div>
                    ))}
                  </div>

                  {/* Penalty Snippet Callout */}
                  {penalty && (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-rose-200 flex items-start space-x-2.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-snug">
                        <strong className="text-rose-300 font-extrabold uppercase">
                          {language === 'vi' ? 'Chế tài nghiêm cấm: ' : 'Sanction & Penalty: '}
                        </strong>
                        <span>{penalty}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* BOTTOM OFFICIAL SIGNATURE & DIGITAL CERTIFICATE */}
        <div className="mt-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#12233D] via-[#0E1A2E] to-[#0A1324] border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {language === 'vi'
                  ? 'Cam Kết Pháp Lý & Chấp Thuận Điều Khoản'
                  : 'Legal Commitment & Terms Ratification'}
              </h3>
              <p className="text-xs text-[#C5E5EC]/80">
                {language === 'vi'
                  ? 'Hiệp ước cộng đồng sinh viên văn minh • Smart Escrow bảo đảm tiền thù lao & cọc đồ KTX'
                  : 'Campus student community covenant • Smart Escrow secured compensation & dorm item deposits'}
              </p>
            </div>
          </div>

          {/* User info box */}
          <div className="p-3.5 rounded-2xl bg-[#070E1A] border border-[#C5E5EC]/20 text-xs text-[#C5E5EC]/90 space-y-1.5">
            <p>
              • {language === 'vi' ? 'Tài khoản đang đăng nhập:' : 'Authenticated Account:'}{' '}
              <strong className="text-white font-mono">{currentUser?.id || '000000000'}</strong> (
              {currentUser?.name || (language === 'vi' ? 'Khách Campus' : 'Campus Guest')}).
            </p>
            <p>
              • {language === 'vi'
                ? 'Bằng việc kích hoạt cam kết, bạn đồng thuận rằng mọi giao dịch việc làm và mua bán đồ KTX sẽ được phân xử theo đúng 18 Điều khoản của Bộ Luật này và phán quyết từ Ban Quản Trị Tối Cao có giá trị thi hành tuyệt đối.'
                : 'By ratifying this commitment, you consent that all gig jobs and dorm marketplace transactions are governed under these 18 Articles and rulings by the Supreme Admin Master bear absolute finality.'}
            </p>
          </div>

          {/* VERIFIED DIGITAL CERTIFICATE BADGE (WHEN SIGNED) */}
          {signatureInfo.isSigned && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#0C241B] to-emerald-950/60 border border-emerald-500/40 text-emerald-200 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-black text-sm text-emerald-300 uppercase tracking-wide">
                    {language === 'vi'
                      ? 'CHỨNG THƯ PHÁP LÝ ĐIỆN TỬ HỢP LỆ'
                      : 'VALIDATED DIGITAL LEGAL CERTIFICATE'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  VALIDATED
                </span>
              </div>

              <div className="text-[11px] space-y-1 font-mono text-[#C5E5EC]/90 bg-black/40 p-2.5 rounded-xl border border-emerald-500/20">
                <div>
                  {language === 'vi' ? 'Ký bởi:' : 'Signed by:'}{' '}
                  <strong className="text-white">
                    {currentUser?.name || (language === 'vi' ? 'Sinh viên' : 'Student')}
                  </strong>{' '}
                  (ID: {currentUser?.id || '000000000'})
                </div>
                <div>
                  {language === 'vi' ? 'Thời gian ký:' : 'Signed at:'}{' '}
                  {new Date(signatureInfo.signedAt || Date.now()).toLocaleString(
                    language === 'vi' ? 'vi-VN' : 'en-US'
                  )}
                </div>
                <div className="break-all text-[10px] text-emerald-300/80">
                  {language === 'vi' ? 'Mã chứng thực số:' : 'Certificate hash:'}{' '}
                  {signatureInfo.signatureHash}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleConfirmCommitment}
              disabled={signatureInfo.isSigned}
              className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-xl cursor-pointer ${
                signatureInfo.isSigned
                  ? 'bg-emerald-600 text-white border border-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:brightness-110 text-black shadow-amber-900/50'
              }`}
            >
              {signatureInfo.isSigned ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>
                    {language === 'vi'
                      ? 'ĐÃ KÝ ĐIỆN TỬ CAM KẾT TUÂN THỦ 100% BỘ LUẬT'
                      : 'DIGITALLY RATIFIED 100% CODE COMPLIANCE'}
                  </span>
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4" />
                  <span>
                    {language === 'vi'
                      ? 'TÔI ĐÃ ĐỌC KỸ & KÝ CAM KẾT TUÂN THỦ 100% BỘ LUẬT'
                      : 'I HAVE READ & DIGITALLY PLEDGED 100% COMPLIANCE'}
                  </span>
                </>
              )}
            </button>

            {onOpenContactAdmin && (
              <button
                type="button"
                onClick={onOpenContactAdmin}
                className="w-full sm:w-auto py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-[#C5E5EC] hover:text-white font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 border border-[#C5E5EC]/20"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{language === 'vi' ? 'Hỏi Ban Quản Trị 24/7' : 'Ask Admin Support 24/7'}</span>
              </button>
            )}
          </div>
        </div>

        {/* FOOTER METADATA */}
        <div className="pt-4 pb-6 text-center space-y-1 text-[11px] text-[#C5E5EC]/60">
          <p>
            {language === 'vi'
              ? '© 2026 GigMe Platform • Hệ thống văn bản pháp quy Campus Student Escrow Code v2.4 (Bao gồm Điều 18 Chợ KTX)'
              : '© 2026 GigMe Platform • Campus Student Escrow Regulatory Code v2.4 (Including Article 18 Dorm Market)'}
          </p>
          <p>
            {language === 'vi'
              ? 'Ban hành bởi Ban Điều Hành GigMe • Hiệu lực bắt buộc trên toàn quốc'
              : 'Enacted by GigMe Executive Council • Nationally Binding across Campus Network'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BÁO CÁO VI PHẠM ĐIỀU KHOẢN TỚI ADMIN MASTER 000000000 */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-[#0D1627] border-2 border-rose-500/40 p-6 text-white shadow-2xl my-8 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'vi' ? 'Báo Cáo Vi Phạm Pháp Quy' : 'Report Policy Violation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReportToAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'vi' ? 'Điều khoản bị vi phạm' : 'Violated Article'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={reportTargetArticle}
                  onChange={(e) => setReportTargetArticle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                >
                  <option value="art-5">
                    {language === 'vi'
                      ? 'Điều 5: Nghiêm cấm lách giao dịch ngoài sàn'
                      : 'Article 5: Off-platform transaction ban (Anti-leakage)'}
                  </option>
                  <option value="art-18">
                    {language === 'vi'
                      ? 'Điều 18: Vi phạm quy chế Chợ KTX / Hàng cấm'
                      : 'Article 18: Dorm flea market / Contraband violation'}
                  </option>
                  <option value="art-9">
                    {language === 'vi'
                      ? 'Điều 9: Vi phạm liêm chính học thuật / Thi hộ'
                      : 'Article 9: Academic integrity / Exam fraud'}
                  </option>
                  <option value="art-10">
                    {language === 'vi'
                      ? 'Điều 10: Tự ý bỏ kèo (No-Show) / Hủy sát giờ'
                      : 'Article 10: Worker no-show / Late cancellation'}
                  </option>
                  <option value="art-2">
                    {language === 'vi'
                      ? 'Điều 2: Tài khoản ảo Sybil / Đánh giá khống'
                      : 'Article 2: Sybil fake accounts / Artificial reviews'}
                  </option>
                  <option value="art-3">
                    {language === 'vi'
                      ? 'Điều 3: Giả mạo vị trí Fake GPS'
                      : 'Article 3: Mock location & Fake GPS'}
                  </option>
                  <option value="other">
                    {language === 'vi' ? 'Điều khoản khác' : 'Other provision'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'vi'
                    ? 'ID 9 số hoặc Tên đối tượng vi phạm (nếu có)'
                    : '9-Digit ID or Name of Violator (if known)'}
                </label>
                <input
                  type="text"
                  placeholder={
                    language === 'vi'
                      ? 'Ví dụ: 123456789 hoặc tên người dùng...'
                      : 'E.g., 123456789 or username...'
                  }
                  value={reportSuspectId}
                  onChange={(e) => setReportSuspectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {language === 'vi'
                    ? 'Mô tả chi tiết bằng chứng vi phạm'
                    : 'Detailed description & violation evidence'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={
                    language === 'vi'
                      ? 'Cung cấp chi tiết: thời gian xảy ra, nội dung tin nhắn lách sàn hoặc link bài đăng Chợ KTX vi phạm...'
                      : 'Provide details: time of occurrence, message excerpts attempting leakage, or offending listing link...'
                  }
                  value={reportViolationContent}
                  onChange={(e) => setReportViolationContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#131E30] border border-slate-700 text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 leading-snug">
                {language === 'vi'
                  ? 'Báo cáo sẽ được chuyển trực tiếp vào kênh điều tra riêng của Ban Quản Trị Tối Cao (ID 000000000). Mọi hành vi vu khống ác ý cũng sẽ bị xử lý nghiêm khắc.'
                  : 'Reports route directly into the private investigation dossier of Supreme Admin Master (ID 000000000). Malicious false reporting is severely penalized.'}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold text-xs hover:brightness-110 shadow-lg shadow-rose-950/50 transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Send className="w-4 h-4" />
                <span>
                  {language === 'vi'
                    ? 'Gửi Báo Cáo Tới Ban Quản Trị Ngay'
                    : 'Submit Report to Admin Master'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
