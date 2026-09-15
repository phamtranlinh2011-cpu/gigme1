import React, { useState } from 'react';
import { GigMeProvider, useGigMe } from './context/GigMeContext';
import { Header } from './components/Header';
import { BottomNav, TabScreen } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { CreateGigScreen } from './screens/CreateGigScreen';
import { GigDetailScreen } from './screens/GigDetailScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminDashboardScreen } from './screens/AdminDashboardScreen';
import { CampusLeaderboardScreen } from './screens/CampusLeaderboardScreen';
import { CampusMarketplaceScreen } from './screens/CampusMarketplaceScreen';
import { ChatSupportScreen } from './screens/ChatSupportScreen';
import { AuthScreen } from './screens/AuthScreen';

import {
  NfcCccdScanDialog,
  FaceLivenessDialog,
  StudentSsoDialog,
} from './components/AdvancedDialogs';
import { DownloadAppDialog } from './components/DownloadAppDialog';
import { FcmPushNotificationModal } from './components/FcmPushNotificationModal';
import { StudentEloModal } from './components/StudentEloModal';
import { SosSafeWalkModal } from './components/SosSafeWalkModal';
import { VietQrOpenApiAutoScanner } from './components/VietQrOpenApiAutoScanner';
import { MoMoZaloPayGatewayModal } from './components/MoMoZaloPayGatewayModal';
import { GeminiVisionStudentIdModal } from './components/GeminiVisionStudentIdModal';
import { VoipCallOverlay } from './components/VoipCallOverlay';
import { BlockchainProofModal } from './components/BlockchainProofModal';

const MainLayout: React.FC = () => {
  const {
    currentUser,
    currentSelectedGig,
    selectGig,
  } = useGigMe();

  const [currentTab, setCurrentTab] = useState<TabScreen>('HOME');

  // Modals state
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const [showFcmPush, setShowFcmPush] = useState(false);
  const [showEloModal, setShowEloModal] = useState(false);
  const [showSafeWalk, setShowSafeWalk] = useState(false);
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
            onOpenLeaderboard={() => setCurrentTab('LEADERBOARD')}
            onOpenMarketplace={() => setCurrentTab('MARKETPLACE')}
            onOpenVietQrScanner={() => setShowVietQrScanner(true)}
            onOpenPaymentGateway={() => setShowPaymentGateway(true)}
            onOpenGeminiVision={() => setShowGeminiVision(true)}
            onOpenFcmPush={() => setShowFcmPush(true)}
            onOpenEloModal={() => setShowEloModal(true)}
            onOpenSafeWalk={() => setShowSafeWalk(true)}
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
            onOpenSsoDialog={() => setShowSsoModal(true)}
            onOpenAdminDashboard={() => setCurrentTab('ADMIN')}
          />
        );
      case 'ADMIN':
        return <AdminDashboardScreen onBack={() => setCurrentTab('PROFILE')} />;
      case 'LEADERBOARD':
        return (
          <CampusLeaderboardScreen
            onBack={() => setCurrentTab('HOME')}
            onSelectFreelancer={() => {}}
          />
        );
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
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06090F] text-slate-100 selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
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
        onOpenLeaderboard={() => {
          selectGig(null);
          setCurrentTab('LEADERBOARD');
        }}
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
        onOpenSafeWalk={() => setShowSafeWalk(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto pb-20">
        {renderContent()}
      </main>

      <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Global Dialogs & Modals */}
      <NfcCccdScanDialog
        isOpen={showNfcModal}
        onClose={() => setShowNfcModal(false)}
        onContinueToFaceLiveness={() => setShowFaceModal(true)}
      />

      <FaceLivenessDialog
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
      />

      <StudentSsoDialog
        isOpen={showSsoModal}
        onClose={() => setShowSsoModal(false)}
      />

      <DownloadAppDialog
        isOpen={showDownloadApp}
        onClose={() => setShowDownloadApp(false)}
      />

      <FcmPushNotificationModal
        isOpen={showFcmPush}
        onClose={() => setShowFcmPush(false)}
      />

      <StudentEloModal
        isOpen={showEloModal}
        onClose={() => setShowEloModal(false)}
      />

      <SosSafeWalkModal
        isOpen={showSafeWalk}
        onClose={() => setShowSafeWalk(false)}
      />

      <VietQrOpenApiAutoScanner
        isOpen={showVietQrScanner}
        onClose={() => setShowVietQrScanner(false)}
      />

      <MoMoZaloPayGatewayModal
        isOpen={showPaymentGateway}
        onClose={() => setShowPaymentGateway(false)}
      />

      <GeminiVisionStudentIdModal
        isOpen={showGeminiVision}
        onClose={() => setShowGeminiVision(false)}
      />

      <BlockchainProofModal
        isOpen={showBlockchainProof}
        onClose={() => setShowBlockchainProof(false)}
        gigId={currentSelectedGig?.id || ''}
      />

      <VoipCallOverlay />
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
