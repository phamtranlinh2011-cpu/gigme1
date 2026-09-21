import React, { useState, Suspense, lazy } from 'react';
import { GigMeProvider, useGigMe } from './context/GigMeContext';
import { Header } from './components/Header';
import { BottomNav, TabScreen } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { AuthScreen } from './screens/AuthScreen';
import { SystemMaintenanceOverlay } from './components/SystemMaintenanceOverlay';
import { Wrench, Loader2 } from 'lucide-react';

// Code-Splitting: Lazy load secondary screens to accelerate initial app load
const CreateGigScreen = lazy(() =>
  import('./screens/CreateGigScreen').then((m) => ({ default: m.CreateGigScreen }))
);
const GigDetailScreen = lazy(() =>
  import('./screens/GigDetailScreen').then((m) => ({ default: m.GigDetailScreen }))
);
const WalletScreen = lazy(() =>
  import('./screens/WalletScreen').then((m) => ({ default: m.WalletScreen }))
);
const ProfileScreen = lazy(() =>
  import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen }))
);
const AdminDashboardScreen = lazy(() =>
  import('./screens/AdminDashboardScreen').then((m) => ({ default: m.AdminDashboardScreen }))
);
const CampusMarketplaceScreen = lazy(() =>
  import('./screens/CampusMarketplaceScreen').then((m) => ({ default: m.CampusMarketplaceScreen }))
);
const ChatSupportScreen = lazy(() =>
  import('./screens/ChatSupportScreen').then((m) => ({ default: m.ChatSupportScreen }))
);

// Code-Splitting: Lazy load heavy dialogs only when opened by the user
const NfcCccdScanDialog = lazy(() =>
  import('./components/AdvancedDialogs').then((m) => ({ default: m.NfcCccdScanDialog }))
);
const FaceLivenessDialog = lazy(() =>
  import('./components/AdvancedDialogs').then((m) => ({ default: m.FaceLivenessDialog }))
);
const StudentSsoDialog = lazy(() =>
  import('./components/AdvancedDialogs').then((m) => ({ default: m.StudentSsoDialog }))
);
const DownloadAppDialog = lazy(() =>
  import('./components/DownloadAppDialog').then((m) => ({ default: m.DownloadAppDialog }))
);
const FcmPushNotificationModal = lazy(() =>
  import('./components/FcmPushNotificationModal').then((m) => ({ default: m.FcmPushNotificationModal }))
);
const StudentEloModal = lazy(() =>
  import('./components/StudentEloModal').then((m) => ({ default: m.StudentEloModal }))
);
const VietQrOpenApiAutoScanner = lazy(() =>
  import('./components/VietQrOpenApiAutoScanner').then((m) => ({ default: m.VietQrOpenApiAutoScanner }))
);
const MoMoZaloPayGatewayModal = lazy(() =>
  import('./components/MoMoZaloPayGatewayModal').then((m) => ({ default: m.MoMoZaloPayGatewayModal }))
);
const GeminiVisionStudentIdModal = lazy(() =>
  import('./components/GeminiVisionStudentIdModal').then((m) => ({ default: m.GeminiVisionStudentIdModal }))
);
const VoipCallOverlay = lazy(() =>
  import('./components/VoipCallOverlay').then((m) => ({ default: m.VoipCallOverlay }))
);
const BlockchainProofModal = lazy(() =>
  import('./components/BlockchainProofModal').then((m) => ({ default: m.BlockchainProofModal }))
);

// High-performance smooth loading skeleton for lazy loaded tab screens
const ScreenLoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Đang tải dữ liệu...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-4 px-4 text-center animate-fadeIn">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-3 border-[#3064AE]/30 border-t-[#C5E5EC] animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#E0FAEB] animate-pulse" />
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-200 tracking-wide">{label}</p>
      <p className="text-[11px] text-[#C5E5EC]/60">GigMe Code-Splitting • Tối ưu mở app siêu tốc</p>
    </div>
  </div>
);


const MainLayout: React.FC = () => {
  const {
    currentUser,
    currentSelectedGig,
    selectGig,
    isMaintenanceActive,
    maintenanceConfig,
    setMaintenanceMode,
  } = useGigMe();

  const [currentTab, setCurrentTab] = useState<TabScreen>('HOME');

  // Modals state
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [showFcmPush, setShowFcmPush] = useState(false);
  const [showEloModal, setShowEloModal] = useState(false);
  const [showVietQrScanner, setShowVietQrScanner] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [showGeminiVision, setShowGeminiVision] = useState(false);
  const [showBlockchainProof, setShowBlockchainProof] = useState(false);

  if (!currentUser) {
    return <AuthScreen />;
  }

  const handleSelectTab = (tab: TabScreen) => {
    selectGig(null);
    setCurrentTab(tab);
  };

  const handleOpenGigDetail = (gigId: string) => {
    selectGig(gigId);
  };

  const renderContent = () => {
    // 🛠️ SYSTEM MAINTENANCE GUARD:
    // If maintenance mode is active in Cloud Firestore, regular users can ONLY view their profile!
    if (isMaintenanceActive && currentUser?.role !== 'ADMIN') {
      if (currentTab === 'PROFILE') {
        return (
          <ProfileScreen
            onOpenNfcDialog={() => setShowNfcModal(true)}
            onOpenSsoDialog={() => setShowSsoModal(true)}
            onOpenAdminDashboard={() => setCurrentTab('ADMIN')}
          />
        );
      }
      return (
        <SystemMaintenanceOverlay
          onGoToProfile={() => {
            selectGig(null);
            setCurrentTab('PROFILE');
          }}
          onGoToAdmin={() => {
            selectGig(null);
            setCurrentTab('ADMIN');
          }}
        />
      );
    }

    if (currentSelectedGig) {
      return (
        <GigDetailScreen
          gigId={currentSelectedGig.id}
          onBack={() => selectGig(null)}
          onOpenChat={() => {
            selectGig(null);
            setCurrentTab('CHAT');
          }}
          onOpenVerify={() => setShowNfcModal(true)}
        />
      );
    }

    switch (currentTab) {
      case 'HOME':
        return (
          <HomeScreen
            onSelectGigDetail={handleOpenGigDetail}
            onOpenCreateGig={() => setCurrentTab('CREATE_GIG')}
            onOpenVerify={() => setShowNfcModal(true)}
            onOpenMarketplace={() => setCurrentTab('MARKETPLACE')}
            onOpenVietQrScanner={() => setShowVietQrScanner(true)}
            onOpenPaymentGateway={() => setShowPaymentGateway(true)}
            onOpenGeminiVision={() => setShowGeminiVision(true)}
            onOpenFcmPush={() => setShowFcmPush(true)}
            onOpenEloModal={() => setShowEloModal(true)}
          />
        );
      case 'CREATE_GIG':
        return (
          <CreateGigScreen
            onBack={() => setCurrentTab('HOME')}
            onGigCreated={(gigId) => {
              selectGig(gigId);
            }}
          />
        );
      case 'WALLET':
        return <WalletScreen onOpenVerify={() => setShowNfcModal(true)} />;
      case 'PROFILE':
        return (
          <ProfileScreen
            onOpenNfcDialog={() => setShowNfcModal(true)}
            onOpenFaceDialog={() => setShowFaceModal(true)}
            onOpenSsoDialog={() => setShowSsoModal(true)}
            onOpenAdminDashboard={() => setCurrentTab('ADMIN')}
          />
        );
      case 'ADMIN':
        return <AdminDashboardScreen onBack={() => setCurrentTab('PROFILE')} />;
      case 'MARKETPLACE':
        return (
          <CampusMarketplaceScreen
            onOpenChat={() => setCurrentTab('CHAT')}
            onOpenWallet={() => setCurrentTab('WALLET')}
          />
        );
      case 'CHAT':
        return <ChatSupportScreen onBack={() => setCurrentTab('HOME')} />;
      default:
        return (
          <HomeScreen
            onSelectGigDetail={handleOpenGigDetail}
            onOpenCreateGig={() => setCurrentTab('CREATE_GIG')}
            onOpenVerify={() => setShowNfcModal(true)}
            onOpenMarketplace={() => setCurrentTab('MARKETPLACE')}
            onOpenVietQrScanner={() => setShowVietQrScanner(true)}
            onOpenPaymentGateway={() => setShowPaymentGateway(true)}
            onOpenGeminiVision={() => setShowNfcModal(true)}
            onOpenFcmPush={() => setShowFcmPush(true)}
            onOpenEloModal={() => setShowEloModal(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0C1728] via-[#102038] to-[#0C1728] text-slate-100 selection:bg-[#3064AE] selection:text-[#E0FAEB] transition-colors duration-200 relative overflow-x-hidden">
      {/* Decorative ambient color washes for Cobalt Blue, Crystal Blue, and Ethereal Green brand palette */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3064AE]/20 to-[#C5E5EC]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-0 w-80 h-80 bg-gradient-to-tr from-[#3064AE]/15 via-[#C5E5EC]/10 to-[#E0FAEB]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Header
        onOpenCreateGig={() => {
          selectGig(null);
          setCurrentTab('CREATE_GIG');
        }}
        onOpenWallet={() => {
          selectGig(null);
          setCurrentTab('WALLET');
        }}
        onOpenProfile={() => {
          selectGig(null);
          setCurrentTab('PROFILE');
        }}
        onOpenAdmin={() => {
          selectGig(null);
          setCurrentTab('ADMIN');
        }}
        onOpenDownloadApp={() => setShowDownloadApp(true)}
        onOpenMarketplace={() => {
          selectGig(null);
          setCurrentTab('MARKETPLACE');
        }}
        onOpenChat={() => {
          selectGig(null);
          setCurrentTab('CHAT');
        }}
        onOpenFcmPush={() => setShowFcmPush(true)}
        onOpenEloModal={() => setShowEloModal(true)}
        onOpenVietQrScanner={() => setShowVietQrScanner(true)}
        onOpenPaymentGateway={() => setShowPaymentGateway(true)}
      />

      {/* Global Realtime Maintenance Status Bar for Admin */}
      {isMaintenanceActive && currentUser?.role === 'ADMIN' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-[#12233B] to-amber-950/90 border-b border-amber-500/40 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 text-amber-300 sticky top-0 z-30 shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <Wrench className="w-4 h-4 text-amber-400" />
            <span className="font-extrabold">
              ROOT ADMIN: Chế độ bảo trì đang BẬT trên toàn sàn (Người dùng thường chỉ xem được trang Hồ sơ).
            </span>
            <span className="text-[11px] text-[#C5E5EC]/70">
              Dự kiến kết thúc: {new Date(maintenanceConfig.endTime).toLocaleTimeString('vi-VN')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                selectGig(null);
                setCurrentTab('ADMIN');
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-extrabold text-[11px] hover:brightness-110 transition shadow cursor-pointer"
            >
              Vào Bảng Admin
            </button>
            <button
              onClick={() => setMaintenanceMode({ isActive: false })}
              className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold text-[11px] hover:bg-rose-900 transition cursor-pointer"
            >
              Tắt Bảo Trì Nhanh
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto pb-20">
        <Suspense fallback={<ScreenLoadingSpinner label="Đang tải giao diện..." />}>
          {renderContent()}
        </Suspense>
      </main>

      <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Global Dialogs & Modals - Lazy loaded on-demand to minimize initial bundle size */}
      {showNfcModal && (
        <Suspense fallback={null}>
          <NfcCccdScanDialog
            isOpen={showNfcModal}
            onClose={() => setShowNfcModal(false)}
            onContinueToFaceLiveness={() => setShowFaceModal(true)}
          />
        </Suspense>
      )}

      {showFaceModal && (
        <Suspense fallback={null}>
          <FaceLivenessDialog
            isOpen={showFaceModal}
            onClose={() => setShowFaceModal(false)}
          />
        </Suspense>
      )}

      {showSsoModal && (
        <Suspense fallback={null}>
          <StudentSsoDialog
            isOpen={showSsoModal}
            onClose={() => setShowSsoModal(false)}
          />
        </Suspense>
      )}

      {showDownloadApp && (
        <Suspense fallback={null}>
          <DownloadAppDialog
            isOpen={showDownloadApp}
            onClose={() => setShowDownloadApp(false)}
          />
        </Suspense>
      )}

      {showFcmPush && (
        <Suspense fallback={null}>
          <FcmPushNotificationModal
            isOpen={showFcmPush}
            onClose={() => setShowFcmPush(false)}
          />
        </Suspense>
      )}

      {showEloModal && (
        <Suspense fallback={null}>
          <StudentEloModal
            isOpen={showEloModal}
            onClose={() => setShowEloModal(false)}
          />
        </Suspense>
      )}

      {showVietQrScanner && (
        <Suspense fallback={null}>
          <VietQrOpenApiAutoScanner
            isOpen={showVietQrScanner}
            onClose={() => setShowVietQrScanner(false)}
          />
        </Suspense>
      )}

      {showPaymentGateway && (
        <Suspense fallback={null}>
          <MoMoZaloPayGatewayModal
            isOpen={showPaymentGateway}
            onClose={() => setShowPaymentGateway(false)}
          />
        </Suspense>
      )}

      {showGeminiVision && (
        <Suspense fallback={null}>
          <GeminiVisionStudentIdModal
            isOpen={showGeminiVision}
            onClose={() => setShowGeminiVision(false)}
          />
        </Suspense>
      )}

      {showBlockchainProof && (
        <Suspense fallback={null}>
          <BlockchainProofModal
            isOpen={showBlockchainProof}
            onClose={() => setShowBlockchainProof(false)}
            gigId={currentSelectedGig?.id || ''}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <VoipCallOverlay />
      </Suspense>

    </div>
  );
};

export default function App() {
  return (
    <GigMeProvider>
      <MainLayout />
    </GigMeProvider>
  );
}
